/**
 * choice.tsx — 選択系フィールド（v0.6）
 * ─────────────────────────────────────────────────────────────────────
 * CheckboxField（単独のはい/いいえ）と RadioGroup（排他選択）。
 *
 * DADS作法として守るもの:
 *   - RadioGroup は fieldset/legend で束ねる（何についての選択かを読み上げに伝える）
 *   - 当たり判定は 44px 以上。ラベル文字をクリックしても選べる
 *   - エラーは group 単位で1回出す（選択肢ごとに出さない）
 */
import { useId, type ReactNode } from 'react';

import { RequirementBadge } from './FormField';

export interface CheckboxFieldProps {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  supportText?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function CheckboxField({
  label,
  checked,
  onChange,
  supportText,
  disabled,
  className,
}: CheckboxFieldProps) {
  const baseId = useId();
  const supportId = `${baseId}-support`;
  return (
    <div className={`magi-choice${className ? ` ${className}` : ''}`}>
      <label className="magi-choice-item">
        <input
          aria-describedby={supportText ? supportId : undefined}
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          type="checkbox"
        />
        <span>{label}</span>
      </label>
      {supportText ? (
        <p className="magi-form-support" id={supportId}>
          {supportText}
        </p>
      ) : null}
    </div>
  );
}

export type RadioOption = {
  value: string;
  label: ReactNode;
  supportText?: ReactNode;
  disabled?: boolean;
};

export interface RadioGroupProps {
  /** 何についての選択か。fieldset の legend になる。 */
  legend: ReactNode;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  supportText?: ReactNode;
  errorText?: ReactNode;
  /** 横並びにするか。既定は縦（読みやすさ優先）。 */
  inline?: boolean;
  className?: string;
}

export function RadioGroup({
  legend,
  options,
  value,
  onChange,
  required = false,
  supportText,
  errorText,
  inline = false,
  className,
}: RadioGroupProps) {
  const baseId = useId();
  const name = `${baseId}-radio`;
  const supportId = `${baseId}-support`;
  const errorId = `${baseId}-error`;
  const hasError = Boolean(errorText);
  const describedBy = [supportText ? supportId : null, hasError ? errorId : null]
    .filter(Boolean)
    .join(' ');

  return (
    <fieldset
      aria-describedby={describedBy || undefined}
      aria-invalid={hasError || undefined}
      aria-required={required || undefined}
      className={`magi-form-field magi-radio-group${hasError ? ' is-invalid' : ''}${className ? ` ${className}` : ''}`}
    >
      <legend className="magi-form-label">
        <span>{legend}</span>
        <RequirementBadge required={required} />
      </legend>

      {supportText ? (
        <p className="magi-form-support" id={supportId}>
          {supportText}
        </p>
      ) : null}

      <div className={`magi-choice${inline ? ' is-inline' : ''}`}>
        {options.map((option) => (
          <label className="magi-choice-item" key={option.value}>
            <input
              checked={value === option.value}
              disabled={option.disabled}
              name={name}
              onChange={() => onChange(option.value)}
              type="radio"
              value={option.value}
            />
            <span>
              {option.label}
              {option.supportText ? <span className="magi-choice-support">{option.supportText}</span> : null}
            </span>
          </label>
        ))}
      </div>

      {hasError ? (
        <p className="magi-form-error" id={errorId} role="alert">
          {errorText}
        </p>
      ) : null}
    </fieldset>
  );
}
