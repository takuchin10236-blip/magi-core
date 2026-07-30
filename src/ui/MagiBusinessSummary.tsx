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
  className?: string;
}

export function MagiBusinessSummary({
  items,
  label = '現在の状況',
  detailsLabel = 'ダッシュボード',
  ariaLabel,
  storageKey,
  className,
}: MagiBusinessSummaryProps) {
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

  return (
    <section
      aria-label={ariaLabel}
      className={`magi-business-summary themed-card no-print${className ? ` ${className}` : ''}`}
    >
      <span className="magi-business-summary-label">{label}</span>

      <div
        className="magi-business-summary-chips"
        // 列数は項目数に追随させる（4項目固定にしない＝アプリごとに項目数を変えられる）。
        style={{ ['--magi-summary-columns' as string]: String(Math.max(items.length, 1)) }}
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
    </section>
  );
}
