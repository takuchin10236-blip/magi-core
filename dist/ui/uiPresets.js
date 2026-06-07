/**
 * @magi/core/ui — テーマプリセット定義（v0.2）
 *
 * 「4プリセット × White/Dark = 8テーマ」のメタデータ。
 *   UiMode    … 大分類2つ（standard / nova）
 *   UiPreset  … 4プリセット（standard-lumen / standard-aura / nova-carbon / nova-ember）
 *   ThemeMode … white / dark
 *
 * 原本: magi-resident-spine/src/lib/uiPresets.ts（挙動・正規化規則を完全踏襲）。
 * design-system.css の :root[data-ui-preset="..."][data-color-mode="..."] と対になる。
 * DisplaySwitch / useThemeState が参照する。
 */
export const UI_MODES = [
    {
        value: 'standard',
        label: 'Standard',
        shortLabel: 'Standard',
        description: '共有PCで迷わず使うための、罫線と密度を保った業務UI',
    },
    {
        value: 'nova',
        label: 'Nova',
        shortLabel: 'Nova',
        description: '質感と階層で見通しを良くする先進UI',
    },
];
export const UI_PRESETS = [
    {
        value: 'standard-lumen',
        mode: 'standard',
        label: 'Lumen',
        shortLabel: 'Lumen',
        description: 'Google Material 3系。明快な色とグリッドで毎日の操作に向いた標準UI',
    },
    {
        value: 'standard-aura',
        mode: 'standard',
        label: 'Aura',
        shortLabel: 'Aura',
        description: 'Apple HIG系。余白と透明感で静かに読ませる標準UI',
    },
    {
        value: 'nova-carbon',
        mode: 'nova',
        label: 'Carbon',
        shortLabel: 'Carbon',
        description: 'Cursor系。シャープで集中しやすいテック寄りのNova UI',
    },
    {
        value: 'nova-ember',
        mode: 'nova',
        label: 'Ember',
        shortLabel: 'Ember',
        description: 'Anthropic系。暖色のクラフト感で落ち着いて読めるNova UI',
    },
];
export const DEFAULT_UI_PRESET = 'standard-lumen';
export const DEFAULT_THEME_MODE = 'white';
export function getUiPreset(value) {
    return UI_PRESETS.find((preset) => preset.value === value) ?? UI_PRESETS[0];
}
export function presetsForMode(mode) {
    return UI_PRESETS.filter((preset) => preset.mode === mode);
}
export function firstPresetForMode(mode) {
    return presetsForMode(mode)[0]?.value ?? DEFAULT_UI_PRESET;
}
// 旧称・別名からの正規化（localStorage に古い値が残っていても安全に拾う）。
//   原本（利用者マスタ）の規則をそのまま踏襲する。
export function normalizeUiPreset(value) {
    if (value === 'standard')
        return 'standard-lumen';
    if (value === 'nova')
        return 'nova-carbon';
    if (value === 'standard-basic')
        return 'standard-lumen';
    if (value === 'standard-enterprise')
        return 'standard-aura';
    if (value === 'nova-apple')
        return 'standard-aura';
    if (value === 'nova-anthropic')
        return 'nova-ember';
    return UI_PRESETS.some((preset) => preset.value === value) ? value : null;
}
export function normalizeThemeMode(value) {
    if (value === 'white' || value === 'light')
        return 'white';
    if (value === 'dark')
        return 'dark';
    return null;
}
//# sourceMappingURL=uiPresets.js.map