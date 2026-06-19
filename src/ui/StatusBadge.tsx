/**
 * StatusBadge — MAGI共通の状態バッジ原子部品。
 *
 * 設計意図:
 *   - 全アプリ共通の状態表示を @magi/core/ui に集約し、手実装コピーの腐敗を防ぐ。
 *   - ホバー説明は OS標準の title 属性に一本化する。
 *     data-tooltip + ::after のリッチtooltipは、画面端での見切れ事故を再発させるため使わない。
 *   - title は補助情報。必須情報は children のラベルや画面本文側にも出す。
 */
import type { ReactNode } from 'react';

export type StatusTone = 'ok' | 'neutral' | 'warn' | 'danger' | 'info';

export interface StatusBadgeProps {
  /** 状態色。色だけに意味を持たせず、必ずラベル文字列でも意味が通るようにする。 */
  tone: StatusTone;
  /** バッジに表示するラベル本体。 */
  children: ReactNode;
  /** OS標準tooltipに渡す補助説明。必須情報はここだけに置かない。 */
  tooltip?: string;
  /** 任意のアイコン。lucide等を想定。 */
  icon?: ReactNode;
  /** アイコンのみ等、表示文字だけで不足する場合の代替ラベル。 */
  ariaLabel?: string;
  /** アプリ固有の微調整用。magi-status-badge本体/tone色の再定義には使わない。 */
  className?: string;
}

export function StatusBadge({
  tone,
  children,
  tooltip,
  icon,
  ariaLabel,
  className,
}: StatusBadgeProps) {
  return (
    <span
      aria-label={ariaLabel}
      className={`magi-status-badge status-${tone}${className ? ` ${className}` : ''}`}
      title={tooltip}
    >
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      <span>{children}</span>
    </span>
  );
}
