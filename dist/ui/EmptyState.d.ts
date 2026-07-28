/**
 * EmptyState — 「0件」の表示（v0.6・全MAGI共通）
 * ─────────────────────────────────────────────────────────────────────
 * 視覚検収の5状態（通常／読込・保存中／0件／エラー／権限不足）のうち、
 * 「0件」だけ共通部品が無く、各アプリが素の div に文字を置いていた。
 * その結果、枠に文字が貼り付いて窮屈に見える事故が起きた（2026-07-28 社長指摘）。
 *
 * 守ること:
 *   - 何が無いのかを言い切る（label 必須）
 *   - 「次にどうすればよいか」を書ける場所を持つ（hint）
 *   - 器の内側に必ず余白を持つ（呼び出し側の padding 有無に依存しない）
 */
import type { ReactNode } from 'react';
export interface EmptyStateProps {
    /** 何が無いのか。例「条件に合うクッションがありません」 */
    label: string;
    /** 次にどうすればよいか。例「フロア・状態・検索の条件を見直してください」 */
    hint?: ReactNode;
    /** 絞り込み解除ボタン等。 */
    action?: ReactNode;
    /** 任意のアイコン。 */
    icon?: ReactNode;
    className?: string;
}
export declare function EmptyState({ label, hint, action, icon, className }: EmptyStateProps): import("react").JSX.Element;
//# sourceMappingURL=EmptyState.d.ts.map