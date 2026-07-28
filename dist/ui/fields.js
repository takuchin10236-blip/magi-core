import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FormField } from './FormField';
export function TextField({ label, required, supportText, errorText, fieldClassName, className, type = 'text', ...rest }) {
    return (_jsx(FormField, { className: fieldClassName, errorText: errorText, label: label, required: required, supportText: supportText, children: (control) => (_jsx("input", { className: `magi-input${className ? ` ${className}` : ''}`, type: type, ...control, ...rest })) }));
}
export function TextArea({ label, required, supportText, errorText, fieldClassName, className, rows = 3, ...rest }) {
    return (_jsx(FormField, { className: fieldClassName, errorText: errorText, label: label, required: required, supportText: supportText, children: (control) => (_jsx("textarea", { className: `magi-input magi-textarea${className ? ` ${className}` : ''}`, rows: rows, ...control, ...rest })) }));
}
export function SelectField({ label, required, supportText, errorText, fieldClassName, className, options, placeholder, ...rest }) {
    return (_jsx(FormField, { className: fieldClassName, errorText: errorText, label: label, required: required, supportText: supportText, children: (control) => (_jsxs("select", { className: `magi-input magi-select${className ? ` ${className}` : ''}`, ...control, ...rest, children: [placeholder ? _jsx("option", { value: "", children: placeholder }) : null, options.map((option) => (_jsx("option", { disabled: option.disabled, value: option.value, children: option.label }, option.value)))] })) }));
}
//# sourceMappingURL=fields.js.map