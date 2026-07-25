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
import { type ReactNode } from 'react';
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
export declare function MagiBusinessSummary({ items, label, detailsLabel, ariaLabel, storageKey, className, }: MagiBusinessSummaryProps): import("react").JSX.Element;
//# sourceMappingURL=MagiBusinessSummary.d.ts.map