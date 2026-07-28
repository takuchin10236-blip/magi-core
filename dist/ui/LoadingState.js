import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function LoadingState({ label, slowHint, variant = 'block', className }) {
    return (_jsxs("div", { "aria-live": "polite", className: `magi-loading magi-loading-${variant}${className ? ` ${className}` : ''}`, role: "status", children: [_jsx("span", { "aria-hidden": "true", className: "magi-loading-spinner" }), _jsxs("span", { className: "magi-loading-text", children: [_jsx("span", { className: "magi-loading-label", children: label }), slowHint ? _jsx("span", { className: "magi-loading-hint", children: slowHint }) : null] })] }));
}
//# sourceMappingURL=LoadingState.js.map