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
 *   - bounds=parent でオーバーレイ内に制限し、画面外へ出さない
 *   - オーバーレイクリックで閉じる動作は維持（モーダル本体のクリックは伝播停止）
 *   - ヘッダ・スクロール本文・固定フッタの3層構造（U8標準）
 *   - 閉じるボタンは44px、Escape対応、背景スクロール停止、閉じた後に元の場所へフォーカス復帰
 *
 * 使い方:
 *   <DraggableModal onClose={onClose} title="モーダルのタイトル" maxWidth="xl">
 *     <div>本体コンテンツ</div>
 *   </DraggableModal>
 *
 *   タイトル + 閉じるボタン込みのヘッダを自動生成。
 *   独自ヘッダにしたい場合は title=null + customHeader prop を使う。
 */
import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
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
export function DraggableModal({ onClose, title, subtitle, customHeader, maxWidth = 'xl', extraClass = '', children, footer, zIndex = 'var(--magi-z-modal, 800)', titleColorClass = 'text-[var(--color-primary)]', }) {
    // findDOMNode 回避用 ref（React 19 / StrictMode 対応）
    const nodeRef = useRef(null);
    const closeButtonRef = useRef(null);
    const onCloseRef = useRef(onClose);
    const titleId = useId();
    const subtitleId = useId();
    onCloseRef.current = onClose;
    useEffect(() => {
        const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onCloseRef.current();
                return;
            }
            if (event.key === 'Tab' && nodeRef.current) {
                const focusable = Array.from(nodeRef.current.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((element) => element.getAttribute('aria-hidden') !== 'true');
                if (focusable.length === 0) {
                    event.preventDefault();
                    nodeRef.current.focus();
                    return;
                }
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                }
                else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        const focusFrame = window.requestAnimationFrame(() => {
            (closeButtonRef.current ?? nodeRef.current)?.focus();
        });
        return () => {
            window.cancelAnimationFrame(focusFrame);
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = previousOverflow;
            previouslyFocused?.focus();
        };
    }, []);
    /*
     * 画面の一番上（body直下）へ出す。
     *
     * なぜ必要か: z-index は「同じ土俵の中」でしか比べられない。`backdrop-filter` や
     * `transform` の付いた祖先はそこに独立した土俵を作るので、その内側で 800 を付けても
     * 土俵ごと後ろに置かれれば負ける。ポータルで body 直下へ出すと、この負け方が
     * 原理的に起きない。ManualEntry は既にこの作法（同 40/105 行）。
     * SSR や document の無い環境では素で描く（テスト環境の保険）。
     */
    const overlay = (_jsx("div", { className: "magi-modal-overlay fixed inset-0 flex items-center justify-center bg-black/50 p-4 no-print", style: { zIndex }, onClick: onClose, children: _jsx(Draggable, { nodeRef: nodeRef, handle: ".draggable-handle", bounds: "parent", children: _jsxs("div", { ref: nodeRef, tabIndex: -1, className: `themed-card draggable-modal magi-modal-frame rounded-2xl shadow-2xl w-full ${MAX_WIDTH_CLASS[maxWidth]} ${extraClass}`, onClick: (e) => e.stopPropagation(), role: "dialog", "aria-modal": "true", "aria-labelledby": title !== null && title !== undefined ? titleId : undefined, "aria-describedby": subtitle ? subtitleId : undefined, children: [title !== null && title !== undefined && (_jsxs("div", { className: "draggable-handle magi-modal-header flex items-center justify-between px-5 pt-5 pb-3 border-b border-[var(--border-default)]", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("h3", { id: titleId, className: `text-lg font-bold ${titleColorClass} flex items-center gap-2`, children: [title, _jsx("span", { className: "text-xs themed-text-muted opacity-60 font-normal hidden md:inline", title: "\u4E0A\u306E\u90E8\u5206\u3092\u3064\u304B\u3080\u3068\u3001\u3053\u306E\u5C0F\u3055\u306A\u753B\u9762\u3092\u52D5\u304B\u305B\u307E\u3059", children: "\u22EE\u22EE \u3064\u304B\u3093\u3067\u52D5\u304B\u305B\u307E\u3059" })] }), subtitle && _jsx("p", { id: subtitleId, className: "text-xs themed-text-muted mt-0.5", children: subtitle })] }), _jsx("button", { ref: closeButtonRef, type: "button", onClick: onClose, className: "magi-modal-close themed-text-muted hover:themed-text-secondary ml-2", "aria-label": "\u9589\u3058\u308B", title: "\u9589\u3058\u307E\u3059", children: _jsx("svg", { "aria-hidden": "true", className: "magi-modal-close-icon", fill: "none", viewBox: "0 0 24 24", children: _jsx("path", { d: "M6 6l12 12M18 6 6 18", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "2.4" }) }) })] })), customHeader && customHeader, _jsx("div", { className: "magi-modal-body p-5", children: children }), footer !== null && footer !== undefined && (_jsx("div", { className: "magi-modal-footer", children: footer }))] }) }) }));
    return typeof document === 'undefined' ? overlay : createPortal(overlay, document.body);
}
//# sourceMappingURL=DraggableModal.js.map