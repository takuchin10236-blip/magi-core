import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function StatusBadge({ tone, children, tooltip, icon, ariaLabel, className, }) {
    return (_jsxs("span", { "aria-label": ariaLabel, className: `magi-status-badge status-${tone}${className ? ` ${className}` : ''}`, title: tooltip, children: [icon ? _jsx("span", { "aria-hidden": "true", children: icon }) : null, _jsx("span", { children: children })] }));
}
//# sourceMappingURL=StatusBadge.js.map