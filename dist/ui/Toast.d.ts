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
import { type ReactNode } from 'react';
export type ToastType = 'success' | 'error' | 'info' | 'warning';
export declare function ToastProvider({ children }: {
    children: ReactNode;
}): import("react").JSX.Element;
export declare function useToast(): {
    success: (msg: string) => void;
    error: (msg: string) => void;
    info: (msg: string) => void;
    warning: (msg: string) => void;
};
//# sourceMappingURL=Toast.d.ts.map