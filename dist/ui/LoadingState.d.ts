/**
 * LoadingState — 「いま何をしているか」を必ず文字で伝える待ち表示（v0.6）
 * ─────────────────────────────────────────────────────────────────────
 * 社長指示（2026-07-28）の物理化:
 *   「書き込み中・読み込み中など、初心者は待てないし不安になる。ボタンを押したり
 *     クリックを連発してしまう。今どういう状態なのか必ずアナウンスを出してほしい。
 *     構造を理解していないと、とにかく間が怖い。『何かやらかしちゃったかしら』となる」
 *
 * 設計:
 *   - `label` を **必須 prop** にした。型で強制することで「無言のスピナー」を
 *     物理的に書けなくする（注意書きではなく仕組みで守る）。
 *   - aria-live="polite" で読み上げにも届ける。
 *   - 3秒を超えうる処理には `slowHint` を出し、「時間がかかることがあります」を予告する。
 *   - reduced-motion では回転が止まるが、文言は残るので情報は失われない（motion.css）。
 */
import type { ReactNode } from 'react';
export type LoadingStateVariant = 'block' | 'inline';
export interface LoadingStateProps {
    /**
     * 状態を動詞で言い切る。例「読み込み中です。お待ちください」「保存しています…」
     * スピナーだけで済ませないための必須項目。
     */
    label: string;
    /** 3秒を超えうる処理での予告。例「件数が多いと時間がかかることがあります」 */
    slowHint?: ReactNode;
    /** block=領域を占有（一覧の差し替え等） / inline=行内（ボタン横等） */
    variant?: LoadingStateVariant;
    className?: string;
}
export declare function LoadingState({ label, slowHint, variant, className }: LoadingStateProps): import("react").JSX.Element;
//# sourceMappingURL=LoadingState.d.ts.map