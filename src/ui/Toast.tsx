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
import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

type ToastItem = {
  id: number;
  type: ToastType;
  message: string;
  /** ブラウザタイマーID。アンマウント時のクリア用 */
  timerId?: ReturnType<typeof setTimeout>;
};

type ToastContextValue = {
  show: (type: ToastType, message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_TOASTS = 3;
const DURATION_DEFAULT = 2500;
const DURATION_ERROR = 4000;

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  // タイマー解除用に最新の toasts への参照を保持
  const toastsRef = useRef(toasts);
  toastsRef.current = toasts;

  const remove = useCallback((id: number) => {
    setToasts((prev) => {
      const target = prev.find((t) => t.id === id);
      if (target?.timerId) clearTimeout(target.timerId);
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  const show = useCallback(
    (type: ToastType, message: string) => {
      const id = nextId++;
      const duration = type === 'error' ? DURATION_ERROR : DURATION_DEFAULT;
      const timerId = setTimeout(() => remove(id), duration);
      setToasts((prev) => {
        // 上限超過時は古いものを削除
        const next = [...prev, { id, type, message, timerId }];
        if (next.length > MAX_TOASTS) {
          const overflowed = next.shift();
          if (overflowed?.timerId) clearTimeout(overflowed.timerId);
        }
        return next;
      });
    },
    [remove],
  );

  // アンマウント時のタイマークリア
  useEffect(() => {
    return () => {
      for (const t of toastsRef.current) {
        if (t.timerId) clearTimeout(t.timerId);
      }
    };
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <ToastContainer toasts={toasts} onClose={remove} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // ToastProvider 外で呼ばれた場合のフォールバック（コンソールログのみ）
    return {
      success: (msg: string) => console.log('[Toast/success]', msg),
      error: (msg: string) => console.error('[Toast/error]', msg),
      info: (msg: string) => console.log('[Toast/info]', msg),
      warning: (msg: string) => console.warn('[Toast/warning]', msg),
    };
  }
  return {
    success: (msg: string) => ctx.show('success', msg),
    error: (msg: string) => ctx.show('error', msg),
    info: (msg: string) => ctx.show('info', msg),
    warning: (msg: string) => ctx.show('warning', msg),
  };
}

function ToastContainer({
  toasts,
  onClose,
}: {
  toasts: ToastItem[];
  onClose: (id: number) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 no-print pointer-events-none"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <ToastBubble key={t.id} item={t} onClose={() => onClose(t.id)} />
      ))}
    </div>
  );
}

function ToastBubble({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const colors: Record<ToastType, { className: string; icon: string }> = {
    success: { className: 'toast-success', icon: '✓' },
    error: { className: 'toast-error', icon: '✕' },
    info: { className: 'toast-info', icon: 'ℹ' },
    warning: { className: 'toast-warning', icon: '⚠' },
  };
  const c = colors[item.type];
  return (
    <div
      className={`pointer-events-auto toast-bubble ${c.className} px-4 py-2.5 rounded-lg shadow-xl max-w-md flex items-center gap-2`}
      style={{
        animation: 'toast-slide-in 0.2s ease-out',
      }}
    >
      <span className="text-lg flex-shrink-0" aria-hidden>{c.icon}</span>
      <span className="text-sm flex-1 break-words">{item.message}</span>
      <button
        type="button"
        onClick={onClose}
        className="toast-close opacity-70 hover:opacity-100 ml-1 text-lg leading-none"
        aria-label="閉じる"
      >
        ×
      </button>
    </div>
  );
}
