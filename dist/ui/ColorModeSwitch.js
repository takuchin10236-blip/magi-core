import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * ColorModeSwitch — White/Dark だけの職員向け色切替（v0.5・AppShell）。
 *
 * DisplaySwitch（8テーマ・プリセット選択つき）は温存する。こちらは職員が日常で
 *   触る最小の2択だけを出す簡素版。useThemeState の返り値をそのまま渡せる
 *   （themeMode / onThemeMode だけを要求＝ThemeState は構造的に代入可能）。
 * 表示名は日本語「ホワイト」「ダーク」（職員向けの分かりやすさ優先）。
 */
import { Moon, Sun } from 'lucide-react';
const MODES = [
    { value: 'white', label: 'ホワイト', icon: Sun, description: '明るい背景で表示します' },
    { value: 'dark', label: 'ダーク', icon: Moon, description: '暗い背景で表示します' },
];
export function ColorModeSwitch({ themeMode, onThemeMode, className }) {
    return (_jsx("div", { className: `magi-appshell-colormode${className ? ` ${className}` : ''}`, role: "group", "aria-label": "\u8272\u30C6\u30FC\u30DE", children: MODES.map((item) => {
            const Icon = item.icon;
            const active = themeMode === item.value;
            return (_jsxs("button", { "aria-pressed": active, className: active ? 'active' : '', onClick: () => onThemeMode(item.value), title: item.description, type: "button", children: [_jsx(Icon, { size: 15, "aria-hidden": "true" }), _jsx("span", { children: item.label })] }, item.value));
        }) }));
}
//# sourceMappingURL=ColorModeSwitch.js.map