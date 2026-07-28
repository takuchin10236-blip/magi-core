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
import { type ReactNode } from 'react';
export interface CheckboxFieldProps {
    label: ReactNode;
    checked: boolean;
    onChange: (checked: boolean) => void;
    supportText?: ReactNode;
    disabled?: boolean;
    className?: string;
}
export declare function CheckboxField({ label, checked, onChange, supportText, disabled, className, }: CheckboxFieldProps): import("react").JSX.Element;
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
export declare function RadioGroup({ legend, options, value, onChange, required, supportText, errorText, inline, className, }: RadioGroupProps): import("react").JSX.Element;
//# sourceMappingURL=choice.d.ts.map