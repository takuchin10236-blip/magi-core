import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * ColorModeSwitch — 職員向けの色切替（v0.5・AppShell / v0.14.0 で4択）。
 *
 * DisplaySwitch（8テーマ・プリセット選択つき＝開発者検証画面専用）は温存する。こちらは
 *   職員が日常で触る最小の切替だけを出す簡素版。useThemeState の返り値をそのまま渡せる
 *   （<ColorModeSwitch {...theme} />）。
 *
 * v0.14.0（仕様「テーマ第3モード残照 v1.0」§1・§4）:
 *   陽光（white）／残照（dusk）／月光（dark）／自動 の4択。表示は**アイコン＋漢字2字**
 *   ——漢字が読めない職員はアイコンで分かる（社長方針 2026-08-08 15:13）。
 *
 * 後方互換:
 *   themeMode / onThemeMode の型は v0.13 以前のまま（ThemeMode を渡す・受け取る）。
 *   「自動」は onThemeModeSetting を渡したときだけ出す＝旧来の2引数だけで使っている
 *   アプリは、ボタンが3つ（陽光・残照・月光）になるだけで型も配線も壊れない。
 */
import { Clock, Moon, Sun, Sunset } from 'lucide-react';
import { THEME_MODES, getThemeMode } from './uiPresets';
const MODE_ICONS = {
    white: Sun,
    dusk: Sunset,
    dark: Moon,
};
export function ColorModeSwitch({ themeMode, onThemeMode, themeModeSetting, onThemeModeSetting, className, }) {
    const selected = themeModeSetting ?? themeMode;
    const canAuto = typeof onThemeModeSetting === 'function';
    const buttonCount = THEME_MODES.length + (canAuto ? 1 : 0);
    // 色の手動選択は常に従来の onThemeMode を呼ぶ（既存配線をそのまま残す）。
    // onThemeModeSetting は「自動」専用の受け口＝2つの契約が競合しない。
    return (_jsxs("div", { className: `magi-appshell-colormode${className ? ` ${className}` : ''}`, "data-modes": buttonCount, role: "group", "aria-label": "\u8272\u30C6\u30FC\u30DE", children: [THEME_MODES.map((item) => {
                const Icon = MODE_ICONS[item.value];
                const active = selected === item.value;
                return (_jsxs("button", { "aria-pressed": active, className: active ? 'active' : '', onClick: () => onThemeMode(item.value), title: `${item.label}（${item.reading}）— ${item.description}`, type: "button", children: [_jsx(Icon, { size: 15, "aria-hidden": "true" }), _jsx("span", { children: item.label })] }, item.value));
            }), canAuto ? (_jsxs("button", { "aria-pressed": selected === 'auto', className: selected === 'auto' ? 'active' : '', onClick: () => onThemeModeSetting?.('auto'), title: `自動（じどう）— 時刻に合わせて切り替えます（いまは${getThemeMode(themeMode).label}）`, type: "button", children: [_jsx(Clock, { size: 15, "aria-hidden": "true" }), _jsx("span", { children: "\u81EA\u52D5" })] }, "auto")) : null] }));
}
//# sourceMappingURL=ColorModeSwitch.js.map