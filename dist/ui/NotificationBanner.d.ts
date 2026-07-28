/**
 * NotificationBanner — 画面上の告知・警告・エラー帯（v0.6）
 * ─────────────────────────────────────────────────────────────────────
 * デジタル庁DS の NotificationBanner に相当する層。各アプリが個別に作っていた
 * 警告帯（クッションの refs-error-panel / readonly-note 等）の共通形。
 *
 * 守る作法:
 *   - 色だけで意味を伝えない。必ず見出し文字で種別が分かる（WCAG 1.4.1／DADS色作法）
 *   - error/warning は role="alert"（即読み上げ）、info/success は role="status"（穏やかに）
 *   - 「何が起きたか」＋「次にどうすればよいか」を書ける器にする（action スロット）
 */
import type { ReactNode } from 'react';
export type NotificationTone = 'info' | 'success' | 'warning' | 'error';
export interface NotificationBannerProps {
    tone: NotificationTone;
    /** 何が起きたか。1行で言い切る。 */
    title: ReactNode;
    /** 次にどうすればよいか。省略可だが、error では原則書く。 */
    children?: ReactNode;
    /** 再試行ボタン等。 */
    action?: ReactNode;
    /** 種別ラベル（「注意」等）を出すか。既定 true＝色以外でも種別が分かる。 */
    showToneLabel?: boolean;
    className?: string;
}
export declare function NotificationBanner({ tone, title, children, action, showToneLabel, className, }: NotificationBannerProps): import("react").JSX.Element;
//# sourceMappingURL=NotificationBanner.d.ts.map