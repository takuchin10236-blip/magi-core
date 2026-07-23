/**
 * MagiStatusSummary — 重要状態の表示・安全側集約・不明時展開（v0.5・AppShell）。
 *
 * 最重要・P0対策の中核。設計の背骨は候補_core_AppShell部品設計.md §0:
 *   - 本番URL・書込ON/OFF は機械検出のみ（アプリは検出設定/検出関数を渡すだけ、値は渡せない）
 *   - 宣言できるのは許可リスト型 DeclarableState（業務本番化のみ）＝必ず「無検証」バッジ併記
 *   - fail-closed 集約: 安全に揃った時だけ1バッジへ畳み、不明・不整合・宣言存在なら個別展開
 *   - 誤申告（不正 kind）は表示せずエラー個別表示（拒否）
 *
 * 見た目は magi-resident-spine の StatusStrip/statusDisplay の2段レイアウトを踏襲
 *   （1段目=バッジ群、2段目=版チップ＋状態の説明 details）。表示原子は既存 StatusBadge。
 */
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ShieldCheck } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import {
  deriveStatusDisplay,
  detectRuntime,
  validateDeclaredState,
  type DeclarableState,
  type RuntimeDetectorConfig,
  type RuntimeSurface,
  type StatusDisplayItem,
  type StatusResolution,
} from './statusDetection';

/** 書込ON/OFF の検出関数。真偽値を直接渡す props は設けない（自己申告を型で塞ぐ）。 */
export type WriteDetector = () => boolean | Promise<boolean>;

export interface MagiStatusSummaryProps {
  /** ランタイム面（local/preview/production）の検出設定。 */
  runtimeDetector?: RuntimeDetectorConfig;
  /** 書込ON/OFF の検出関数。未指定なら「書込確認中」を出す（fail-closed）。 */
  writeDetector?: WriteDetector;
  /**
   * アプリの状態宣言（許可リスト型のみ）。unknown[] を受け、実行時に許可リストへ照合する。
   *   不正な形（本番URL・書込状態を騙る object 等）は拒否してエラー個別表示にする。
   */
  declaredStates?: unknown[];
  /** 状態の説明 details に載せる補助情報（データ接続名・本人確認の状態など・任意）。 */
  detailRows?: Array<{ label: string; value: string }>;
  className?: string;
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
  detailRows,
  className,
}: MagiStatusSummaryProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  // 宣言状態の許可リスト照合は render 中に確定できる（同期・純粋）。
  const validated = (declaredStates ?? []).map(validateDeclaredState);
  const declared: DeclarableState[] = [];
  const rejected: StatusResolution['rejected'] = [];
  for (const entry of validated) {
    if (entry.ok) declared.push(entry.state);
    else rejected.push({ reason: entry.reason, received: entry.received });
  }

  // ランタイム面は同期検出、書込は非同期になり得るので effect で解決する。
  const runtimeSurface = detectRuntime(runtimeDetector);
  const [writeState, setWriteState] = useState<{ writable: boolean | null; failed: boolean; ready: boolean }>({
    writable: null,
    failed: false,
    ready: writeDetector === undefined ? true : false,
  });

  useEffect(() => {
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
        if (!cancelled) setWriteState({ writable: Boolean(value), failed: false, ready: true });
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
