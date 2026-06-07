import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @magi/core/ui — テーマ切替UI（v0.2）
 *
 * 「4プリセット × White/Dark = 8テーマ」を選ぶ3段タブのスイッチ:
 *   1段目 ui-mode-tabs   … Standard / Nova（大分類）
 *   2段目 preset-tabs    … 選んだ mode のプリセット（Lumen/Aura または Carbon/Ember）
 *   3段目 theme-mode-tabs … White / Dark
 *
 * 原本: magi-resident-spine/src/App.tsx 内の DisplaySwitch を移植。
 *   原本はアイコンに Material Symbols 演出（PresetIcon）と lucide を切り替えていたが、
 *   コア版はアプリ固有のフォント依存を持ち込まず lucide-react のみを使う
 *   （Palette / Sun / Moon）。CSS（ui-switch-panel 等）は design-system.css 側。
 *
 * 使い方（useThemeState とセットで配線）:
 *   import { DisplaySwitch, useThemeState } from '@magi/core/ui';
 *   import '@magi/core/ui/design-system.css';
 *   const theme = useThemeState();
 *   <DisplaySwitch {...theme} />
 *
 * peerDependencies: react / lucide-react（採用側アプリが持つ）。
 */
import { Moon, Palette, Sun } from 'lucide-react';
import { UI_MODES, firstPresetForMode, getUiPreset, presetsForMode, } from './uiPresets';
const themeModes = [
    { value: 'white', label: 'White', icon: Sun, description: '明るい背景で表示します' },
    { value: 'dark', label: 'Dark', icon: Moon, description: '暗い背景で表示します' },
];
export function DisplaySwitch({ onThemeMode, onUiPreset, themeMode, uiMode, uiPreset, }) {
    const activePreset = getUiPreset(uiPreset);
    const activeTheme = themeModes.find((item) => item.value === themeMode) ?? themeModes[0];
    const modePresets = presetsForMode(uiMode);
    return (_jsxs("section", { className: "ui-switch-panel", "aria-label": "UI\u5F62\u5F0F\u3068\u8272\u30C6\u30FC\u30DE", children: [_jsxs("div", { className: "ui-switch-head", children: [_jsxs("span", { children: [_jsx(Palette, { size: 14, "aria-hidden": "true" }), "\u8868\u793A"] }), _jsxs("strong", { children: [activePreset.shortLabel, " / ", activeTheme.label] })] }), _jsx("div", { className: "ui-mode-tabs", role: "group", "aria-label": "UI\u5F62\u5F0F", children: UI_MODES.map((item) => (_jsx("button", { "aria-pressed": uiMode === item.value, className: uiMode === item.value ? 'active' : '', onClick: () => onUiPreset(firstPresetForMode(item.value)), title: item.description, type: "button", children: item.shortLabel }, item.value))) }), _jsx("div", { className: "preset-tabs", role: "group", "aria-label": "UI\u30D7\u30EA\u30BB\u30C3\u30C8", children: modePresets.map((item) => (_jsx("button", { "aria-pressed": uiPreset === item.value, className: uiPreset === item.value ? 'active' : '', onClick: () => onUiPreset(item.value), title: item.description, type: "button", children: item.shortLabel }, item.value))) }), _jsx("div", { className: "theme-mode-tabs", role: "group", "aria-label": "\u8272\u30C6\u30FC\u30DE", children: themeModes.map((item) => {
                    const Icon = item.icon;
                    return (_jsxs("button", { "aria-pressed": themeMode === item.value, className: themeMode === item.value ? 'active' : '', onClick: () => onThemeMode(item.value), title: item.description, type: "button", children: [_jsx(Icon, { size: 15, "aria-hidden": "true" }), item.label] }, item.value));
                }) })] }));
}
//# sourceMappingURL=DisplaySwitch.js.map