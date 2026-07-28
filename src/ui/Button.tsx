/**
 * Button — MAGI共通ボタン（v0.6）
 * ─────────────────────────────────────────────────────────────────────
 * これまで各アプリが `.themed-btn-primary` 等のCSSクラスを手書きしていたものを部品化する。
 * クラスは互換のため内部でそのまま使う（見た目は1pxも変えない＝非破壊）。
 *
 * 部品にした理由は見た目ではなく「待ち状態の作法を全アプリで強制する」ため:
 *   - `busy` を渡すと自動で disabled になる（連打耐性・社長指示2026-07-28）
 *   - busy 中は `busyLabel` を表示する。無言で固まらない
 *   - aria-busy を立てて読み上げにも状態を伝える
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: ButtonVariant;
  /** 処理中。true で自動的に押せなくなる（二重送信の物理防止）。 */
  busy?: boolean;
  /** 処理中の表示文言。既定「処理中…」。動詞で言い切る。 */
  busyLabel?: string;
  icon?: ReactNode;
  children: ReactNode;
  /** 既定は button。form の送信に使う時だけ submit。 */
  type?: 'button' | 'submit' | 'reset';
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'themed-btn-primary',
  secondary: 'themed-btn-secondary',
  danger: 'themed-btn-danger',
  ghost: 'themed-btn-ghost',
};

export function Button({
  variant = 'primary',
  busy = false,
  busyLabel = '処理中…',
  icon,
  children,
  className,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      aria-busy={busy || undefined}
      className={`magi-button ${VARIANT_CLASS[variant]}${busy ? ' is-busy' : ''}${className ? ` ${className}` : ''}`}
      disabled={disabled || busy}
      type={type}
      {...rest}
    >
      {busy ? (
        <>
          <span aria-hidden="true" className="magi-loading-spinner magi-button-spinner" />
          <span>{busyLabel}</span>
        </>
      ) : (
        <>
          {icon ? <span aria-hidden="true">{icon}</span> : null}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
