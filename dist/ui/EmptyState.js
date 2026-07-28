import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function EmptyState({ label, hint, action, icon, className }) {
    return (_jsxs("div", { className: `magi-empty-state${className ? ` ${className}` : ''}`, children: [icon ? (_jsx("span", { "aria-hidden": "true", className: "magi-empty-state-icon", children: icon })) : null, _jsx("p", { className: "magi-empty-state-label", children: label }), hint ? _jsx("p", { className: "magi-empty-state-hint", children: hint }) : null, action ? _jsx("div", { className: "magi-empty-state-action", children: action }) : null] }));
}
//# sourceMappingURL=EmptyState.js.map