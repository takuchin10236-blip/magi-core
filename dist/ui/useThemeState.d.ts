import { type ThemeMode, type UiMode, type UiPreset } from './uiPresets';
export interface ThemeState {
    uiPreset: UiPreset;
    themeMode: ThemeMode;
    /** uiPreset から導出した大分類（standard / nova）。DisplaySwitch の mode タブ用。 */
    uiMode: UiMode;
    onUiPreset: (value: UiPreset) => void;
    onThemeMode: (value: ThemeMode) => void;
}
export interface UseThemeStateOptions {
    /**
     * localStorage キーのプレフィックス。アプリごとに分けたい場合に指定する。
     * 既定は 'magi'。例: 'magi-omutsu' → 'magi-omutsu.ui-preset.v1' 等。
     */
    storagePrefix?: string;
    /** 初期 uiPreset（localStorage に保存値が無いときの既定）。 */
    defaultUiPreset?: UiPreset;
    /** 初期 themeMode（localStorage に保存値が無いときの既定）。 */
    defaultThemeMode?: ThemeMode;
}
export declare function useThemeState(options?: UseThemeStateOptions): ThemeState;
//# sourceMappingURL=useThemeState.d.ts.map