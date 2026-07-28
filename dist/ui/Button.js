import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
const VARIANT_CLASS = {
    primary: 'themed-btn-primary',
    secondary: 'themed-btn-secondary',
    danger: 'themed-btn-danger',
    ghost: 'themed-btn-ghost',
};
export function Button({ variant = 'primary', busy = false, busyLabel = '処理中…', icon, children, className, disabled, type = 'button', ...rest }) {
    return (_jsx("button", { "aria-busy": busy || undefined, className: `magi-button ${VARIANT_CLASS[variant]}${busy ? ' is-busy' : ''}${className ? ` ${className}` : ''}`, disabled: disabled || busy, type: type, ...rest, children: busy ? (_jsxs(_Fragment, { children: [_jsx("span", { "aria-hidden": "true", className: "magi-loading-spinner magi-button-spinner" }), _jsx("span", { children: busyLabel })] })) : (_jsxs(_Fragment, { children: [icon ? _jsx("span", { "aria-hidden": "true", children: icon }) : null, _jsx("span", { children: children })] })) }));
}
//# sourceMappingURL=Button.js.map