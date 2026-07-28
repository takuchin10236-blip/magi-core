import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const TONE_LABEL = {
    info: 'お知らせ',
    success: '完了',
    warning: '注意',
    error: 'エラー',
};
export function NotificationBanner({ tone, title, children, action, showToneLabel = true, className, }) {
    const assertive = tone === 'error' || tone === 'warning';
    return (_jsxs("div", { className: `magi-notification magi-notification-${tone}${className ? ` ${className}` : ''}`, role: assertive ? 'alert' : 'status', children: [_jsxs("div", { className: "magi-notification-body", children: [_jsxs("p", { className: "magi-notification-title", children: [showToneLabel ? _jsx("span", { className: "magi-notification-tone", children: TONE_LABEL[tone] }) : null, _jsx("span", { children: title })] }), children ? _jsx("div", { className: "magi-notification-detail", children: children }) : null] }), action ? _jsx("div", { className: "magi-notification-action", children: action }) : null] }));
}
//# sourceMappingURL=NotificationBanner.js.map