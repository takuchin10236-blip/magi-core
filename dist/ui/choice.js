import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import { useId } from 'react';
import { RequirementBadge } from './FormField';
export function CheckboxField({ label, checked, onChange, supportText, disabled, className, }) {
    const baseId = useId();
    const supportId = `${baseId}-support`;
    return (_jsxs("div", { className: `magi-choice${className ? ` ${className}` : ''}`, children: [_jsxs("label", { className: "magi-choice-item", children: [_jsx("input", { "aria-describedby": supportText ? supportId : undefined, checked: checked, disabled: disabled, onChange: (event) => onChange(event.target.checked), type: "checkbox" }), _jsx("span", { children: label })] }), supportText ? (_jsx("p", { className: "magi-form-support", id: supportId, children: supportText })) : null] }));
}
export function RadioGroup({ legend, options, value, onChange, required = false, supportText, errorText, inline = false, className, }) {
    const baseId = useId();
    const name = `${baseId}-radio`;
    const supportId = `${baseId}-support`;
    const errorId = `${baseId}-error`;
    const hasError = Boolean(errorText);
    const describedBy = [supportText ? supportId : null, hasError ? errorId : null]
        .filter(Boolean)
        .join(' ');
    return (_jsxs("fieldset", { "aria-describedby": describedBy || undefined, "aria-invalid": hasError || undefined, "aria-required": required || undefined, className: `magi-form-field magi-radio-group${hasError ? ' is-invalid' : ''}${className ? ` ${className}` : ''}`, children: [_jsxs("legend", { className: "magi-form-label", children: [_jsx("span", { children: legend }), _jsx(RequirementBadge, { required: required })] }), supportText ? (_jsx("p", { className: "magi-form-support", id: supportId, children: supportText })) : null, _jsx("div", { className: `magi-choice${inline ? ' is-inline' : ''}`, children: options.map((option) => (_jsxs("label", { className: "magi-choice-item", children: [_jsx("input", { checked: value === option.value, disabled: option.disabled, name: name, onChange: () => onChange(option.value), type: "radio", value: option.value }), _jsxs("span", { children: [option.label, option.supportText ? _jsx("span", { className: "magi-choice-support", children: option.supportText }) : null] })] }, option.value))) }), hasError ? (_jsx("p", { className: "magi-form-error", id: errorId, role: "alert", children: errorText })) : null] }));
}
//# sourceMappingURL=choice.js.map