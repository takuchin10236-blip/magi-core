import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * @magi/core/ui — サイドパネル用マニュアル起動ボタン（v0.3）
 *
 * 設計意図（2026-06-07 設計1枚 §2）:
 *   「サイドパネルの必須項目・テーマ切替UI(DisplaySwitch)の直前・固定配置」を
 *   共通コア側で規約化するための入口コンポーネント。
 *   各アプリは <ManualEntry content={APP_MANUAL} /> をサイドパネルの
 *   <DisplaySwitch> の直前に1行置くだけでよい。
 *
 *   - 内部に open state を持ち、ボタンクリックで ManualViewer を開閉する
 *   - 既定 label='マニュアル'（'見ながら学べる マニュアル' は冗長なので短縮）
 *   - lucide-react は peer optional のため使わず、アイコンはユニコード記号のフォールバック
 *   - 印刷時はドロワー側CSS（@media print）で非表示になる
 *   - renderTrigger を渡すと、各アプリのサイドナビ項目（例: .nav-item）に
 *     溶け込ませた独自トリガーを描画できる。未指定時は従来の manual-entry-btn
 *     フォールバック（後方互換）。
 *
 * 使い方:
 *   import { ManualEntry } from '@magi/core/ui';
 *   import '@magi/core/ui/design-system.css';
 *   // 既定（フォールバックの専用ボタン）:
 *   <ManualEntry content={OMUTSU_MANUAL} />
 *   // サイドナビ項目に溶け込ませる（折りたたみ時アイコンのみ・1クリック開く）:
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
    return (_jsxs(_Fragment, { children: [renderTrigger ? (renderTrigger(openViewer)) : (_jsxs("button", { type: "button", className: "manual-entry-btn", onClick: openViewer, title: `${content.appName} のマニュアルを開きます`, "aria-haspopup": "dialog", "aria-expanded": open, children: [_jsx("span", { className: "manual-entry-icon", "aria-hidden": "true", children: "\uD83D\uDCD6" }), _jsx("span", { className: "manual-entry-label", children: label })] })), open &&
                typeof document !== 'undefined' &&
                createPortal(_jsx(ManualViewer, { content: content, onClose: closeViewer }), document.body)] }));
}
//# sourceMappingURL=ManualEntry.js.map