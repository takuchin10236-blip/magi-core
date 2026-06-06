import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * ドラッグ可能モーダルの共通コンポーネント (Step 13 / 2026-05-04 タチコマ)
 *
 * 設計意図:
 *   既存モーダル群（EditModal, RouteModal, CancelModal, DeleteModal,
 *   CommentModal, TaskListModal, ConfirmPostModal, EditLogTab, StatsDashboard）が
 *   画面中央に固定されていて動かせなかった問題を解決。
 *   ヘッダ部分（タイトルバー）を掴んでドラッグ移動可能にする。
 *
 *   既存の各モーダルの構造（オーバーレイ + themed-card 内部）を維持しつつ、
 *   オーバーレイ + DraggableModal でラップする形にリファクタする。
 *
 * 実装ポイント:
 *   - react-draggable v4 を採用（軽量・実績あり）
 *   - findDOMNode 非推奨警告回避のため nodeRef を使う
 *   - bounds=parent ではなく明示的に画面範囲制限（モーダル外の余白を考慮）
 *   - オーバーレイクリックで閉じる動作は維持（モーダル本体のクリックは伝播停止）
 *
 * 使い方:
 *   <DraggableModal onClose={onClose} title="モーダルのタイトル" maxWidth="xl">
 *     <div>本体コンテンツ</div>
 *   </DraggableModal>
 *
 *   タイトル + 閉じるボタン込みのヘッダを自動生成。
 *   独自ヘッダにしたい場合は title=null + customHeader prop を使う。
 */
import { useId, useRef } from 'react';
import Draggable from 'react-draggable';
const MAX_WIDTH_CLASS = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
};
export function DraggableModal({ onClose, title, subtitle, customHeader, maxWidth = 'xl', extraClass = '', children, zIndex = 50, titleColorClass = 'text-[var(--color-primary)]', }) {
    // findDOMNode 回避用 ref（React 19 / StrictMode 対応）
    const nodeRef = useRef(null);
    const titleId = useId();
    const subtitleId = useId();
    return (_jsx("div", { className: "fixed inset-0 flex items-center justify-center bg-black/50 p-4 no-print", style: { zIndex }, onClick: onClose, children: _jsx(Draggable, { nodeRef: nodeRef, handle: ".draggable-handle", 
            // 画面外に出ないよう bounds を画面サイズの大体の範囲に制限
            // 実際にはオーバーレイの inset-0 範囲内を超えなければOKだが、
            // 厳密 bounds は親要素を ref 取得する必要があるため、ゆるめに設定
            bounds: { left: -300, right: 300, top: -200, bottom: 300 }, children: _jsxs("div", { ref: nodeRef, className: `themed-card draggable-modal rounded-2xl shadow-2xl w-full ${MAX_WIDTH_CLASS[maxWidth]} max-h-[90vh] overflow-y-auto ${extraClass}`, onClick: (e) => e.stopPropagation(), role: "dialog", "aria-modal": "true", "aria-labelledby": title !== null && title !== undefined ? titleId : undefined, "aria-describedby": subtitle ? subtitleId : undefined, children: [title !== null && title !== undefined && (_jsxs("div", { className: "draggable-handle flex items-center justify-between px-5 pt-5 pb-3 border-b border-[var(--border-default)]", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("h3", { id: titleId, className: `text-lg font-bold ${titleColorClass} flex items-center gap-2`, children: [title, _jsx("span", { className: "text-xs themed-text-muted opacity-60 font-normal hidden md:inline", title: "\u4E0A\u306E\u90E8\u5206\u3092\u3064\u304B\u3080\u3068\u3001\u3053\u306E\u5C0F\u3055\u306A\u753B\u9762\u3092\u52D5\u304B\u305B\u307E\u3059", children: "\u22EE\u22EE \u3064\u304B\u3093\u3067\u52D5\u304B\u305B\u307E\u3059" })] }), subtitle && _jsx("p", { id: subtitleId, className: "text-xs themed-text-muted mt-0.5", children: subtitle })] }), _jsx("button", { type: "button", onClick: onClose, className: "themed-text-muted hover:themed-text-secondary text-xl ml-2 px-2", "aria-label": "\u9589\u3058\u308B", title: "\u9589\u3058\u307E\u3059", children: "\u00D7" })] })), customHeader && customHeader, _jsx("div", { className: "p-5", children: children })] }) }) }));
}
//# sourceMappingURL=DraggableModal.js.map