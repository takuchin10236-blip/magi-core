import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ManualViewer } from './ManualViewer';
export function ManualEntry({ content, label = 'マニュアル', renderTrigger }) {
    const [open, setOpen] = useState(false);
    const openerRef = useRef(null);
    const openViewer = () => {
        openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        setOpen(true);
    };
    const closeViewer = () => {
        setOpen(false);
        window.requestAnimationFrame(() => openerRef.current?.focus());
    };
    return (_jsxs(_Fragment, { children: [renderTrigger ? (renderTrigger(openViewer)) : (_jsxs("button", { type: "button", className: "magi-manual-entry", onClick: openViewer, title: `${content.appName} のマニュアルを開きます`, "aria-haspopup": "dialog", "aria-expanded": open, children: [_jsxs("svg", { className: "magi-manual-entry__icon", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", focusable: "false", children: [_jsx("path", { d: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20" }), _jsx("path", { d: "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" })] }), _jsx("span", { className: "magi-manual-entry__label", children: label })] })), open &&
                typeof document !== 'undefined' &&
                createPortal(_jsx(ManualViewer, { content: content, onClose: closeViewer }), document.body)] }));
}
//# sourceMappingURL=ManualEntry.js.map