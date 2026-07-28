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
type SharedProps = {
    label: ReactNode;
    required?: boolean;
    supportText?: ReactNode;
    errorText?: ReactNode;
    /** 器（外枠）へのクラス。入力欄本体には className を使う。 */
    fieldClassName?: string;
};
export type TextFieldProps = SharedProps & Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'aria-describedby' | 'aria-invalid' | 'aria-required'>;
export declare function TextField({ label, required, supportText, errorText, fieldClassName, className, type, ...rest }: TextFieldProps): import("react").JSX.Element;
export type TextAreaProps = SharedProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'aria-describedby' | 'aria-invalid' | 'aria-required'>;
export declare function TextArea({ label, required, supportText, errorText, fieldClassName, className, rows, ...rest }: TextAreaProps): import("react").JSX.Element;
export type SelectOption = {
    value: string;
    label: string;
    disabled?: boolean;
};
export type SelectFieldProps = SharedProps & {
    options: SelectOption[];
    /** 未選択の選択肢。省略時は出さない（必須項目で既定値を持たせたい時に使う）。 */
    placeholder?: string;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'aria-describedby' | 'aria-invalid' | 'aria-required' | 'children'>;
export declare function SelectField({ label, required, supportText, errorText, fieldClassName, className, options, placeholder, ...rest }: SelectFieldProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=fields.d.ts.map