/**
 * MagiStatusSummary — 重要状態の表示・安全側集約・不明時展開（v0.5.1・AppShell / Sol R1 修正）。
 *
 * 最重要・P0対策の中核。設計の背骨は候補_core_AppShell部品設計.md §0:
 *   - 本番URL・書込ON/OFF は機械検出のみ（アプリは検出設定/検出関数を渡すだけ、値は渡せない）
 *   - 宣言できるのは許可リスト型 DeclarableState（業務本番化のみ）＝必ず「無検証」バッジ併記
 *   - fail-closed 集約: 安全に揃った時だけ1バッジへ畳み、不明・不整合・宣言存在なら個別展開
 *   - 誤申告（不正 kind）は表示せずエラー個別表示（拒否）
 *
 * Sol R1 修正（v0.5.1）:
 *   - R1-C2-PROP-TYPE-BYPASS: 公開 declaredStates を許可リスト型 readonly DeclarableState[] に。
 *     JS/外部境界用は unsafeDeclaredStates?: unknown[]（実行時検証してから合流）に分離。
 *   - R1-C2-DETECTOR-SELFDECLARATION: 書込検出器が Core提供ファクトリ由来（信頼済み）かを
 *     実行時判定し、生関数の結果は無検証併記＋集約除外にする（deriveStatusDisplay の writeTrusted）。
 *   - R1-C2-FAILCLOSED-EDGE: 書込結果は typeof boolean のみ受理（Boolean() 丸めを廃止）。
 *
 * 見た目は magi-resident-spine の StatusStrip/statusDisplay の2段レイアウトを踏襲
 *   （1段目=バッジ群、2段目=版チップ＋状態の説明 details）。表示原子は既存 StatusBadge。
 */
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ShieldCheck } from 'lucide-react';
import { isDevBuild } from './devWarn';
import { StatusBadge } from './StatusBadge';
import {
  deriveStatusDisplay,
  detectRuntime,
  isTrustedWriteDetector,
  validateDeclaredState,
  type DeclarableState,
  type RuntimeDetectorConfig,
  type RuntimeSurface,
  type StatusDisplayItem,
  type StatusResolution,
  type WriteDetector,
} from './statusDetection';

export interface MagiStatusSummaryProps {
  /** ランタイム面（local/preview/production）の検出設定。 */
  runtimeDetector?: RuntimeDetectorConfig;
  /**
   * 書込ON/OFF の検出関数。未指定なら「書込確認中」を出す（fail-closed）。
   *   **信頼済み扱い（安全側集約に入る）は createHealthWriteDetector() が返す TrustedWriteDetector だけ**
   *   （固定 /api/health を GET 観測）。createEnvWriteDetector・生関数・任意コールバックは無検証扱いで、
   *   結果に「無検証」を併記し集約から除外する（v0.5.3・R1-C2）。
   */
  writeDetector?: WriteDetector;
  /**
   * アプリの状態宣言（許可リスト型・TypeScript 経路）。型で businessLive のみに縛られる
   *   ＝本番URL・書込状態を騙る kind はコンパイルエラー（R1-C2-PROP-TYPE-BYPASS）。
   */
  declaredStates?: readonly DeclarableState[];
  /**
   * JS・外部入力境界用の状態宣言。unknown[] を受け、実行時に許可リストへ照合する。
   *   不正な形（本番URL・書込状態を騙る object 等）は拒否してエラー個別表示にする。
   */
  unsafeDeclaredStates?: unknown[];
  /** 状態の説明 details に載せる補助情報（データ接続名・本人確認の状態など・任意）。 */
  detailRows?: Array<{ label: string; value: string }>;
  className?: string;
}

// ── writeDetector の参照が毎レンダー変わる事故を、開発中に気づけるようにする（v0.9.4） ──
//   検出 effect の依存は [writeDetector]。JSX の中で検出器を作ると毎レンダー別参照になり、
//   effect が回り続けて観測要求を出し続ける。同一マウントで短時間に何度も再実行されたら助言する。
const DETECTOR_CHURN_LIMIT = 5;
const DETECTOR_CHURN_WINDOW_MS = 2000;

type DetectorChurn = { count: number; since: number; warned: boolean };

function noteDetectorRun(churn: DetectorChurn): void {
  if (!isDevBuild() || churn.warned) return;
  const now = Date.now();
  if (churn.since === 0 || now - churn.since > DETECTOR_CHURN_WINDOW_MS) {
    churn.since = now;
    churn.count = 0;
  }
  churn.count += 1;
  if (churn.count <= DETECTOR_CHURN_LIMIT) return;
  churn.warned = true;
  console.warn(
    '[MagiStatusSummary] writeDetector の参照が毎レンダー変わっています。'
    + ' 検出が繰り返し走り、/api/health を叩き続けます。'
    + ' createHealthWriteDetector() の呼び出しを JSX の外（module 定数や useMemo）へ退避してください。',
  );
}

function runtimeSurfaceLabel(surface: RuntimeSurface): string {
  if (surface === 'local') return 'このPC内';
  if (surface === 'preview') return 'レビュー環境';
  if (surface === 'production') return '本番環境';
  return '確認中';
}

export function MagiStatusSummary({
  runtimeDetector,
  writeDetector,
  declaredStates,
  unsafeDeclaredStates,
  detailRows,
  className,
}: MagiStatusSummaryProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  // 検出 effect が同一マウントで何回走ったか（開発時の助言用・本番では読まれない）。
  const churnRef = useRef<DetectorChurn>({ count: 0, since: 0, warned: false });

  // 型経路（declaredStates）は許可リスト型で縛られ済み＝そのまま信頼。
  // JS/外部境界経路（unsafeDeclaredStates）だけ実行時に許可リスト照合する。
  const declared: DeclarableState[] = [...(declaredStates ?? [])];
  const rejected: StatusResolution['rejected'] = [];
  for (const entry of (unsafeDeclaredStates ?? []).map(validateDeclaredState)) {
    if (entry.ok) declared.push(entry.state);
    else rejected.push({ reason: entry.reason, received: entry.received });
  }

  // 書込検出器が Core提供ファクトリ由来（信頼済み）か。生関数は無検証扱い（R1-C2）。
  const writeTrusted = writeDetector !== undefined && isTrustedWriteDetector(writeDetector);

  // ランタイム面は同期検出、書込は非同期になり得るので effect で解決する。
  const runtimeSurface = detectRuntime(runtimeDetector);
  const [writeState, setWriteState] = useState<{ writable: boolean | null; failed: boolean; ready: boolean }>({
    writable: null,
    failed: false,
    ready: writeDetector === undefined ? true : false,
  });

  useEffect(() => {
    // 開発中だけ、参照が変わり続けていないかを見張る（本番では何もしない）。
    noteDetectorRun(churnRef.current);
    if (!writeDetector) {
      // 検出手段が無い＝書込状態は不明。安全に見せず「書込確認中」を出す。
      setWriteState({ writable: null, failed: false, ready: true });
      return;
    }
    let cancelled = false;
    setWriteState({ writable: null, failed: false, ready: false });
    Promise.resolve()
      .then(() => writeDetector())
      .then((value) => {
        if (cancelled) return;
        // boolean 以外（undefined/null/0/''/非boolean）は検出失敗へ落とす（Boolean 丸め廃止・R1-C2）。
        if (typeof value === 'boolean') {
          setWriteState({ writable: value, failed: false, ready: true });
        } else {
          setWriteState({ writable: null, failed: true, ready: true });
        }
      })
      .catch(() => {
        if (!cancelled) setWriteState({ writable: null, failed: true, ready: true });
      });
    return () => {
      cancelled = true;
    };
  }, [writeDetector]);

  const resolution: StatusResolution = {
    healthReady: writeState.ready,
    runtimeSurface,
    writable: writeState.writable,
    writeDetectorFailed: writeState.failed,
    writeTrusted,
    declared,
    rejected,
  };
  const display = deriveStatusDisplay(resolution);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      const element = detailsRef.current;
      if (!element?.open) return;
      if (event.target instanceof Node && element.contains(event.target)) return;
      element.open = false;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !detailsRef.current?.open) return;
      detailsRef.current.open = false;
      detailsRef.current.querySelector('summary')?.focus();
    };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <div
      className={`magi-appshell-status-cluster${className ? ` ${className}` : ''}`}
      data-status-mode={display.mode}
      aria-label="MAGI状態"
    >
      <div className="magi-appshell-status-badges" role="status" aria-live="polite">
        {display.visible.map((item: StatusDisplayItem) => (
          <span className="magi-appshell-status-item" key={item.id}>
            <StatusBadge className="magi-appshell-status-badge" tone={item.tone} tooltip={item.detail}>
              {item.label}
            </StatusBadge>
            {item.unverified ? (
              <StatusBadge
                className="magi-appshell-unverified"
                tone="warn"
                tooltip={item.detail ? `無検証（根拠: ${item.detail}）` : '機械検証されていない自己申告です'}
              >
                無検証
              </StatusBadge>
            ) : null}
          </span>
        ))}
      </div>

      <details className="magi-appshell-status-details" ref={detailsRef}>
        <summary aria-label="状態の詳しい説明を表示">
          <ShieldCheck size={15} aria-hidden />
          <span>状態の説明</span>
          <ChevronDown size={14} aria-hidden />
        </summary>
        <div className="magi-appshell-status-detail-body" role="group" aria-label="状態の説明一覧">
          <button
            className="magi-appshell-status-close"
            onClick={(event) => event.currentTarget.closest('details')?.removeAttribute('open')}
            type="button"
          >
            閉じる
          </button>
          <dl>
            <div><dt>反映先</dt><dd>{runtimeSurfaceLabel(runtimeSurface)}</dd></div>
            <div><dt>本番反映</dt><dd>{runtimeSurface === 'production' ? '済' : runtimeSurface === 'unknown' ? '確認中' : '未'}</dd></div>
            <div>
              <dt>書込</dt>
              <dd>{!writeState.ready ? '確認中' : writeState.failed || writeState.writable === null ? '確認中' : writeState.writable ? 'ON' : 'OFF'}</dd>
            </div>
            {declared.map((state) => (
              <div key={`declared-${state.kind}`}>
                <dt>業務本番化（無検証）</dt>
                <dd>{state.value ? '済（申告）' : '未（申告）'} / 根拠: {state.basis}</dd>
              </div>
            ))}
            {rejected.map((entry, index) => (
              <div key={`rejected-${index}`}>
                <dt>申告エラー</dt>
                <dd>{entry.reason}</dd>
              </div>
            ))}
            {(detailRows ?? []).map((row) => (
              <div key={`row-${row.label}`}><dt>{row.label}</dt><dd>{row.value}</dd></div>
            ))}
          </dl>
        </div>
      </details>
    </div>
  );
}
