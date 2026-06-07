/**
 * @magi/core/ui — テーマ状態フック（v0.2）
 *
 * 「4プリセット × White/Dark = 8テーマ」の状態を1か所に集約する。
 *   - uiPreset / themeMode の useState（初期値は localStorage から復元）
 *   - localStorage への永続化
 *   - document.documentElement への data 属性付与
 *       data-ui-preset / data-color-mode / data-ui-mode（= `${uiPreset}-${themeMode}`）
 *       ＋ class 'dark' トグル ＋ style.colorScheme
 *   これらは design-system.css の :root[data-ui-preset][data-color-mode] が拾う。
 *
 * 原本: magi-resident-spine/src/App.tsx のテーマ状態ロジック（loadUiPreset /
 *       loadThemeMode / 永続化 useEffect）を集約・踏襲したもの。
 *
 * 返り値は DisplaySwitch にそのまま渡せる形:
 *   const theme = useThemeState();
 *   <DisplaySwitch {...theme} />
 *
 * uiMode は uiPreset から導出（standard-lumen/aura → 'standard'、nova-* → 'nova'）。
 */
import { useEffect, useState } from 'react';
import { DEFAULT_THEME_MODE, DEFAULT_UI_PRESET, getUiPreset, normalizeThemeMode, normalizeUiPreset, } from './uiPresets';
function uiPresetKey(prefix) {
    return `${prefix}.ui-preset.v1`;
}
function themeModeKey(prefix) {
    return `${prefix}.theme-mode.v1`;
}
function loadUiPreset(prefix, fallback) {
    try {
        const stored = normalizeUiPreset(localStorage.getItem(uiPresetKey(prefix)));
        if (stored)
            return stored;
    }
    catch {
        // UI設定の読取失敗（プライベートモード等）は操作を止めない。
    }
    return fallback;
}
function loadThemeMode(prefix, fallback) {
    try {
        const stored = normalizeThemeMode(localStorage.getItem(themeModeKey(prefix)));
        if (stored)
            return stored;
    }
    catch {
        // UI設定の読取失敗は操作を止めない。
    }
    return fallback;
}
export function useThemeState(options = {}) {
    const { storagePrefix = 'magi', defaultUiPreset = DEFAULT_UI_PRESET, defaultThemeMode = DEFAULT_THEME_MODE, } = options;
    const [uiPreset, setUiPreset] = useState(() => loadUiPreset(storagePrefix, defaultUiPreset));
    const [themeMode, setThemeMode] = useState(() => loadThemeMode(storagePrefix, defaultThemeMode));
    // uiPreset から大分類を導出（standard-lumen/aura → standard、nova-* → nova）。
    const uiMode = getUiPreset(uiPreset).mode;
    // 永続化 ＋ document root への反映（原本 App.tsx の useEffect 踏襲）。
    useEffect(() => {
        try {
            localStorage.setItem(uiPresetKey(storagePrefix), uiPreset);
            localStorage.setItem(themeModeKey(storagePrefix), themeMode);
        }
        catch {
            // 書込失敗（容量超過・プライベートモード等）でも UI 反映は続ける。
        }
        const root = document.documentElement;
        root.dataset.uiPreset = uiPreset;
        root.dataset.colorMode = themeMode;
        root.dataset.uiMode = `${uiPreset}-${themeMode}`;
        root.classList.toggle('dark', themeMode === 'dark');
        root.style.colorScheme = themeMode === 'dark' ? 'dark' : 'light';
    }, [storagePrefix, themeMode, uiPreset]);
    return {
        uiPreset,
        themeMode,
        uiMode,
        onUiPreset: setUiPreset,
        onThemeMode: setThemeMode,
    };
}
//# sourceMappingURL=useThemeState.js.map