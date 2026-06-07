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
export type UiMode = 'standard' | 'nova';
export type ThemeMode = 'white' | 'dark';
export type UiPreset = 'standard-lumen' | 'standard-aura' | 'nova-carbon' | 'nova-ember';
export interface UiModeDefinition {
    value: UiMode;
    label: string;
    shortLabel: string;
    description: string;
}
export interface UiPresetDefinition {
    value: UiPreset;
    mode: UiMode;
    label: string;
    shortLabel: string;
    description: string;
}
export declare const UI_MODES: UiModeDefinition[];
export declare const UI_PRESETS: UiPresetDefinition[];
export declare const DEFAULT_UI_PRESET: UiPreset;
export declare const DEFAULT_THEME_MODE: ThemeMode;
export declare function getUiPreset(value: UiPreset): UiPresetDefinition;
export declare function presetsForMode(mode: UiMode): UiPresetDefinition[];
export declare function firstPresetForMode(mode: UiMode): UiPreset;
export declare function normalizeUiPreset(value: string | null): UiPreset | null;
export declare function normalizeThemeMode(value: string | null): ThemeMode | null;
//# sourceMappingURL=uiPresets.d.ts.map