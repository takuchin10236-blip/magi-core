/**
 * MagiBusinessSummary — 業務状況の要約パネル（v0.5・「現在の状況」＋ダッシュボード）
 * ─────────────────────────────────────────────────────────────────────
 *
 * 原本: 利用者マスタ magi-resident-spine の `.business-summary`（自前実装）を一般化。
 *   2026-07-26 社長裁定「利用者マスタの形を正とする／枠（パネルの形）は揃え、
 *   ダッシュボードの内容と各項目はアプリごとに変更してよい」に基づき Core 部品化した。
 *
 * 何を Core が持ち、何をアプリが決めるか:
 *   - Core が持つ＝**器**（ラベル＋チップ列＋開閉式ダッシュボード、寸法・配色・余白・挙動）
 *   - アプリが決める＝**中身**（項目の数・ラベル・値・押した時の動き・説明文）
 *   これにより「見た目は全アプリで揃い、業務ごとの中身は自由」を両立する。
 *   各アプリが自前でパネルを作ると必ず drift する（職員マスタのUI検査459行コピーが実例）。
 *
 * 重なり順の規約（v0.9.2）: 帯は `--magi-z-business-band`、開いたダッシュボードは
 *   `--magi-z-popover`。**アプリの sticky 帯は `--magi-z-app-sticky-max`（100）未満にすること。**
 *   帯ごと下に潜るとダッシュボードが分断されて見える（2026-07-30 社長の実機指摘）。
 *
 * 使い方:
 *   <MagiBusinessSummary
 *     ariaLabel="職員マスタの状況"
 *     items={[
 *       { key: 'active', label: '在籍', value: 7, title: '在籍中の職員数', onSelect: () => ...,
 *         description: '在籍中の職員数' },
 *       { key: 'read', label: '読取', value: '04:47', description: '最後に読み取った時刻' },
 *     ]}
 *     storageKey="magi-staff-master.dashboard-open.v1"
 *   />
 *
 * 挙動:
 *   - onSelect のある項目は button（押せる）、無い項目は静的表示になる。
 *   - ダッシュボード（details）は外側クリック・Escape でも閉じる（共有PC・介護現場で
 *     「閉じられない」と感じさせないため。MagiStatusSummary と同じ流儀）。
 *   - storageKey を渡すと開閉状態を localStorage に覚える（渡さなければ覚えない）。
 *   - description を持つ項目だけがダッシュボードに並ぶ。1件も無ければダッシュボードは出さない。
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export type MagiSummaryItem = {
  /** React の key。項目の識別子。 */
  key: string;
  /** 見出し（例 '在所' '在籍' '空き'）。短い語にする。 */
  label: string;
  /** 値（例 30 / '04:47'）。数値でも文字列でも可。 */
  value: ReactNode;
  /** ホバー時の補足（例 '在所者の一覧を表示します'）。 */
  title?: string;
  /** 押した時の動き。渡すと押せる項目になる（渡さなければ静的表示）。 */
  onSelect?: () => void;
  /** 読込中など、一時的に押させたくない時に true。 */
  disabled?: boolean;
  /** ダッシュボード（開閉式）に出す説明。これがある項目だけが並ぶ。 */
  description?: ReactNode;
};

export interface MagiBusinessSummaryProps {
  /** 表示する項目。数は自由（列は項目数に合わせて等分される）。 */
  items: MagiSummaryItem[];
  /** 左端のラベル。既定 '現在の状況'。 */
  label?: string;
  /** 開閉ボタンの文言。既定 'ダッシュボード'。 */
  detailsLabel?: string;
  /** section の aria-label（例 '職員マスタの状況'）。 */
  ariaLabel?: string;
  /** 開閉状態を覚える localStorage キー。省略すると覚えない。 */
  storageKey?: string;
  /**
   * チップの列数。**省略時は項目数から自動**（v0.10.0）。
   *   アプリが CSS 変数 --magi-summary-columns を設定し忘れると5個目が溢れる事故が
   *   あったため、部品が自分で決めるのを既定にした。明示指定した時だけそれを優先する。
   */
  columns?: number;
  /**
   * 帯を隠せるようにする（2026-08-27 社長裁定D-1 → 2026-09-01 裁定で**既定ON**へ昇格）。
   *   帯そのものは既定で表示（「見えているのが基本」）。隠すのは各利用者の選択で、storageKey があれば
   *   `${storageKey}.hidden` に覚える。隠している間は細い「現在の状況を表示」ボタンだけ残す
   *   （完全に消すと出勤時確認への戻り道が無くなるため）。
   *
   *   **既定 `true`**＝「隠す」ボタンが出る。`collapsible={false}` で従来どおり隠せない帯へ戻せる
   *   （opt-out）。既定にできる理由は、隠すかどうかは各利用者がその場で決める操作であり、
   *   初期状態は従来と同じ「表示」のままだから——かつ各アプリは core の版をピンで固定している。
   */
  collapsible?: boolean;
  /**
   * 表示/非表示を外から制御する（2026-08-27 社長差戻し「表示領域が減らなければ隠す意味が無い」対応）。
   *   これを渡すと帯は controlled になり、**隠し中は行ごと何も描画しない**（復帰導線はアプリが
   *   自分の行——例: 検索行の左端——へ置く責務を負う）。省略時は従来どおり内蔵の細い復帰ボタンを出す。
   */
  hidden?: boolean;
  onHiddenChange?: (next: boolean) => void;
  className?: string;
}

export function MagiBusinessSummary({
  items,
  label = '現在の状況',
  detailsLabel = 'ダッシュボード',
  ariaLabel,
  storageKey,
  columns,
  collapsible = true,
  hidden,
  onHiddenChange,
  className,
}: MagiBusinessSummaryProps) {
  // 列数: 明示指定 > 項目数（最低1）。
  const summaryColumns = Math.max(1, Math.floor(columns ?? items.length));

  // 帯の表示/非表示（collapsible時のみ・既定は表示）。
  const hiddenKey = storageKey ? `${storageKey}.hidden` : null;
  const [bandHidden, setBandHidden] = useState(() => {
    if (!collapsible || !hiddenKey) return false;
    try {
      return window.localStorage.getItem(hiddenKey) === 'true';
    } catch {
      return false;
    }
  });
  const controlled = hidden !== undefined;
  const effectiveHidden = controlled ? Boolean(hidden) : bandHidden;
  const setBandHiddenPersist = (next: boolean) => {
    onHiddenChange?.(next);
    if (controlled) return; // controlled時は状態も記憶もアプリの責務
    setBandHidden(next);
    if (!hiddenKey) return;
    try {
      window.localStorage.setItem(hiddenKey, String(next));
    } catch {
      // 覚えられないブラウザでも切替そのものは続ける
    }
  };

  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(() => {
    if (!storageKey) return false;
    try {
      return window.localStorage.getItem(storageKey) === 'true';
    } catch {
      return false; // localStorage を使えないブラウザでも表示自体は続ける
    }
  });

  // 外側クリック / Escape で閉じる。ネイティブ details は summary 再クリックでしか
  // 閉じないため、共有PCでは「閉じられない」と感じやすい（MagiStatusSummary と同じ対策）。
  useEffect(() => {
    const closeIfOpen = () => {
      const element = detailsRef.current;
      if (element?.open) element.open = false;
    };
    const onDocClick = (event: MouseEvent) => {
      const element = detailsRef.current;
      if (!element?.open) return;
      if (event.target instanceof Node && element.contains(event.target)) return;
      closeIfOpen();
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

  const describedItems = items.filter((item) => item.description !== undefined);

  if (collapsible && effectiveHidden) {
    // controlled時は行ごと消す（復帰導線はアプリの行に同居させ、1行分を丸ごと返す）。
    if (controlled) return null;
    return (
      <section aria-label={ariaLabel} className={`magi-business-summary is-band-hidden no-print${className ? ` ${className}` : ''}`}>
        <button
          className="magi-business-summary-restore"
          onClick={() => setBandHiddenPersist(false)}
          title="隠している状況の帯をもう一度表示します"
          type="button"
        >
          <ChevronDown size={14} aria-hidden />
          <span>{label}を表示</span>
        </button>
      </section>
    );
  }

  return (
    <section
      aria-label={ariaLabel}
      className={`magi-business-summary themed-card no-print${className ? ` ${className}` : ''}`}
    >
      <span className="magi-business-summary-label">{label}</span>

      <div
        className="magi-business-summary-chips"
        // 列数は項目数に追随させる（4項目固定にしない＝アプリごとに項目数を変えられる）。
        // v0.10.0: 既定は「項目数」。columns を明示した時だけそちらを使う
        //   ＝アプリの設定漏れで5個目が溢れる事故（2026-07-30）が構造的に起きない。
        style={{ ['--magi-summary-columns' as string]: String(summaryColumns) }}
      >
        {items.map((item) =>
          item.onSelect ? (
            <button
              disabled={item.disabled}
              key={item.key}
              onClick={item.onSelect}
              title={item.title}
              type="button"
            >
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </button>
          ) : (
            <div className="magi-business-summary-item" key={item.key} title={item.title}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ),
        )}
      </div>

      {describedItems.length > 0 ? (
        <details
          className="magi-business-summary-details"
          onToggle={(event) => {
            const next = event.currentTarget.open;
            setOpen(next);
            if (!storageKey) return;
            try {
              window.localStorage.setItem(storageKey, String(next));
            } catch {
              // 保存できないブラウザでも開閉そのものは継続する
            }
          }}
          open={open}
          ref={detailsRef}
        >
          <summary>
            {detailsLabel}
            <ChevronDown size={14} aria-hidden />
          </summary>
          <div className="magi-business-summary-panel">
            {describedItems.map((item) => (
              <p key={item.key}>
                <strong>{item.label}</strong>
                <span>{item.description}</span>
              </p>
            ))}
          </div>
        </details>
      ) : null}

      {collapsible ? (
        <button
          className="magi-business-summary-hide"
          onClick={() => setBandHiddenPersist(true)}
          title="状況の帯を隠します（いつでも戻せます）"
          type="button"
        >
          隠す
        </button>
      ) : null}
    </section>
  );
}
