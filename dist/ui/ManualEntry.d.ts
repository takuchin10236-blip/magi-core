/**
 * @magi/core/ui — サイドパネル用マニュアル起動ボタン（v0.3.2）
 *
 * 設計意図（2026-06-07 設計1枚 §2 / 2026-06-09 既定アイコン型化）:
 *   「サイドパネルの必須項目・テーマ切替UI(DisplaySwitch)の直前・固定配置」を
 *   共通コア側で規約化するための入口コンポーネント。
 *   各アプリは <ManualEntry content={APP_MANUAL} /> をサイドパネルの
 *   <DisplaySwitch> の直前に1行置くだけでよい。
 *
 *   - 内部に open state を持ち、ボタンクリックで ManualViewer を開閉する
 *   - 既定 label='マニュアル'（'見ながら学べる マニュアル' は冗長なので短縮）
 *   - lucide-react は peer optional のため使わず、アイコンはインラインSVG（本）。
 *     ＝@magi/core は lucide に依存しない方針なので自前 SVG で描く。
 *   - 既定トリガーは「アイコン型の小ボタン」（class=magi-manual-entry）。
 *     細いサイドパネル（rest=80pxレール）では📖アイコンを上・小ラベルを下に
 *     縦積みした 64px タイル、hover/focus 展開時は横並び＋ラベルになる。
 *     旧 v0.3.1 までは全幅 text ボタン(manual-entry-btn)で、細い rail で
 *     大箱に化けて崩れた。それを設計の既定として解消した（narrowサイドバー対応）。
 *   - 印刷時はビューア側CSS（@media print）で非表示になる
 *   - renderTrigger を渡すと、各アプリのサイドナビ項目（例: .nav-item）に
 *     溶け込ませた独自トリガーを描画できる（後方互換・オムツ在庫が利用）。
 *
 * 使い方:
 *   import { ManualEntry } from '@magi/core/ui';
 *   import '@magi/core/ui/design-system.css';
 *   // 既定（アイコン型の小ボタン・サイドパネルに溶け込む）:
 *   <ManualEntry content={OMUTSU_MANUAL} />
 *   // 独自トリガーへ差し替え（後方互換）:
 *   <ManualEntry
 *     content={OMUTSU_MANUAL}
 *     renderTrigger={(open) => (
 *       <button type="button" className="nav-item" onClick={open} title="マニュアル">
 *         <BookOpen size={20} aria-hidden="true" />
 *         <span>マニュアル</span>
 *       </button>
 *     )}
 *   />
 */
import { type ReactNode } from 'react';
import type { ManualContent } from './manual-types';
export interface ManualEntryProps {
    content: ManualContent;
    /** サイドパネルのボタン文言（既定 'マニュアル'）。既定トリガー時のみ使用。 */
    label?: string;
    /**
     * トリガー要素を差し替える。引数 open() を呼ぶとビューアが開く。
     * 各アプリのサイドナビ項目（.nav-item 等）に溶け込ませたい場合に使う。
     * 未指定なら既定のアイコン型トリガー magi-manual-entry を描画（後方互換）。
     */
    renderTrigger?: (open: () => void) => ReactNode;
}
export declare function ManualEntry({ content, label, renderTrigger }: ManualEntryProps): import("react").JSX.Element;
//# sourceMappingURL=ManualEntry.d.ts.map