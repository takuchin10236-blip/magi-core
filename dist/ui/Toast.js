import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Toast 通知（Step 15 / 2026-05-04 タチコマ実装）
 *
 * 設計意図:
 *   - 既読・タスク化・コメント投稿などの操作後に短時間表示する自前トースト。
 *   - react-hot-toast 等のライブラリ追加を避け、軽量自前実装（〜4KB）。
 *   - useToast フックで `toast.success / toast.error / toast.info` を提供。
 *   - <ToastContainer /> を App.tsx の最上位に1つ置けば動作する。
 *
 * 仕様:
 *   - 種類: success（緑） / error（赤） / info（青） / warning（橙）
 *   - 寿命: success/info/warning=2.5秒, error=4秒（読みやすさ優先）
 *   - 同時表示: 最大3件、古いものから順に消える
 *   - 位置: 画面右下固定（モーダルとも被らない位置）
 *   - 重要: アクセシビリティのため role="status" + aria-live="polite"
 */
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
const ToastContext = createContext(null);
const MAX_TOASTS = 3;
const DURATION_DEFAULT = 2500;
const DURATION_ERROR = 4000;
let nextId = 1;
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    // タイマー解除用に最新の toasts への参照を保持
    const toastsRef = useRef(toasts);
    toastsRef.current = toasts;
    const remove = useCallback((id) => {
        setToasts((prev) => {
            const target = prev.find((t) => t.id === id);
            if (target?.timerId)
                clearTimeout(target.timerId);
            return prev.filter((t) => t.id !== id);
        });
    }, []);
    const show = useCallback((type, message) => {
        const id = nextId++;
        const duration = type === 'error' ? DURATION_ERROR : DURATION_DEFAULT;
        const timerId = setTimeout(() => remove(id), duration);
        setToasts((prev) => {
            // 上限超過時は古いものを削除
            const next = [...prev, { id, type, message, timerId }];
            if (next.length > MAX_TOASTS) {
                const overflowed = next.shift();
                if (overflowed?.timerId)
                    clearTimeout(overflowed.timerId);
            }
            return next;
        });
    }, [remove]);
    // アンマウント時のタイマークリア
    useEffect(() => {
        return () => {
            for (const t of toastsRef.current) {
                if (t.timerId)
                    clearTimeout(t.timerId);
            }
        };
    }, []);
    return (_jsxs(ToastContext.Provider, { value: { show }, children: [children, _jsx(ToastContainer, { toasts: toasts, onClose: remove })] }));
}
export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        // ToastProvider 外で呼ばれた場合のフォールバック（コンソールログのみ）
        return {
            success: (msg) => console.log('[Toast/success]', msg),
            error: (msg) => console.error('[Toast/error]', msg),
            info: (msg) => console.log('[Toast/info]', msg),
            warning: (msg) => console.warn('[Toast/warning]', msg),
        };
    }
    return {
        success: (msg) => ctx.show('success', msg),
        error: (msg) => ctx.show('error', msg),
        info: (msg) => ctx.show('info', msg),
        warning: (msg) => ctx.show('warning', msg),
    };
}
function ToastContainer({ toasts, onClose, }) {
    if (toasts.length === 0)
        return null;
    return (_jsx("div", { className: "fixed bottom-4 right-4 z-[100] flex flex-col gap-2 no-print pointer-events-none", role: "status", "aria-live": "polite", children: toasts.map((t) => (_jsx(ToastBubble, { item: t, onClose: () => onClose(t.id) }, t.id))) }));
}
function ToastBubble({ item, onClose }) {
    const colors = {
        success: { className: 'toast-success', icon: '✓' },
        error: { className: 'toast-error', icon: '✕' },
        info: { className: 'toast-info', icon: 'ℹ' },
        warning: { className: 'toast-warning', icon: '⚠' },
    };
    const c = colors[item.type];
    return (_jsxs("div", { className: `pointer-events-auto toast-bubble ${c.className} px-4 py-2.5 rounded-lg shadow-xl max-w-md flex items-center gap-2`, style: {
            animation: 'toast-slide-in 0.2s ease-out',
        }, children: [_jsx("span", { className: "text-lg flex-shrink-0", "aria-hidden": true, children: c.icon }), _jsx("span", { className: "text-sm flex-1 break-words", children: item.message }), _jsx("button", { type: "button", onClick: onClose, className: "toast-close opacity-70 hover:opacity-100 ml-1 text-lg leading-none", "aria-label": "\u9589\u3058\u308B", children: "\u00D7" })] }));
}
//# sourceMappingURL=Toast.js.map