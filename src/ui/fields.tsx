/**
 * fields.tsx — 文字入力系フィールド（v0.6）
 * ─────────────────────────────────────────────────────────────────────
 * TextField / TextArea / SelectField。いずれも FormField の器に載せ、
 * ラベル・必須・補足・エラーの配線を器へ任せる（各アプリで手配線しない）。
 *
 * DADS作法として守るもの:
 *   - プレースホルダをラベル代わりにしない（消えると何の欄か分からなくなる）
 *   - エラーは色だけでなく文字で示し、role="alert" で読み上げる（器が担当）
 *   - 入力欄は 44px 以上の当たり判定（CSS側 .magi-input）
 */
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

import { FormField } from './FormField';

type SharedProps = {
  label: ReactNode;
  required?: boolean;
  supportText?: ReactNode;
  errorText?: ReactNode;
  /** 器（外枠）へのクラス。入力欄本体には className を使う。 */
  fieldClassName?: string;
};

export type TextFieldProps = SharedProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'aria-describedby' | 'aria-invalid' | 'aria-required'>;

export function TextField({
  label,
  required,
  supportText,
  errorText,
  fieldClassName,
  className,
  type = 'text',
  ...rest
}: TextFieldProps) {
  return (
    <FormField
      className={fieldClassName}
      errorText={errorText}
      label={label}
      required={required}
      supportText={supportText}
    >
      {(control) => (
        <input className={`magi-input${className ? ` ${className}` : ''}`} type={type} {...control} {...rest} />
      )}
    </FormField>
  );
}

export type TextAreaProps = SharedProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'aria-describedby' | 'aria-invalid' | 'aria-required'>;

export function TextArea({
  label,
  required,
  supportText,
  errorText,
  fieldClassName,
  className,
  rows = 3,
  ...rest
}: TextAreaProps) {
  return (
    <FormField
      className={fieldClassName}
      errorText={errorText}
      label={label}
      required={required}
      supportText={supportText}
    >
      {(control) => (
        <textarea
          className={`magi-input magi-textarea${className ? ` ${className}` : ''}`}
          rows={rows}
          {...control}
          {...rest}
        />
      )}
    </FormField>
  );
}

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectFieldProps = SharedProps & {
  options: SelectOption[];
  /** 未選択の選択肢。省略時は出さない（必須項目で既定値を持たせたい時に使う）。 */
  placeholder?: string;
} & Omit<
    SelectHTMLAttributes<HTMLSelectElement>,
    'id' | 'aria-describedby' | 'aria-invalid' | 'aria-required' | 'children'
  >;

export function SelectField({
  label,
  required,
  supportText,
  errorText,
  fieldClassName,
  className,
  options,
  placeholder,
  ...rest
}: SelectFieldProps) {
  return (
    <FormField
      className={fieldClassName}
      errorText={errorText}
      label={label}
      required={required}
      supportText={supportText}
    >
      {(control) => (
        <select className={`magi-input magi-select${className ? ` ${className}` : ''}`} {...control} {...rest}>
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option disabled={option.disabled} key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FormField>
  );
}
