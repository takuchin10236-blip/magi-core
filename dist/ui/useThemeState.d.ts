import { type AutoThemeSchedule, type ThemeMode, type ThemeModeSetting, type UiMode, type UiPreset } from './uiPresets';
export interface ThemeState {
    uiPreset: UiPreset;
    /** 適用中の実モード（'auto' は入らない。自動運転中は時刻で解決した結果が入る）。 */
    themeMode: ThemeMode;
    /** 職員が選んでいる値（'auto' を含む）。v0.14.0 追加。 */
    themeModeSetting: ThemeModeSetting;
    /** uiPreset から導出した大分類（standard / nova）。DisplaySwitch の mode タブ用。 */
    uiMode: UiMode;
    onUiPreset: (value: UiPreset) => void;
    /** 色を手動で選ぶ（従来どおり）。自動運転中に呼ぶと手動へ切り替わる。 */
    onThemeMode: (value: ThemeMode) => void;
    /** 'auto' を含む選択（v0.14.0 追加）。ColorModeSwitch の「自動」が使う。 */
    onThemeModeSetting: (value: ThemeModeSetting) => void;
}
export interface UseThemeStateOptions {
    /**
     * localStorage キーのプレフィックス。アプリごとに分けたい場合に指定する。
     * 既定は 'magi'。例: 'magi-omutsu' → 'magi-omutsu.ui-preset.v1' 等。
     */
    storagePrefix?: string;
    /** 初期 uiPreset（localStorage に保存値が無いときの既定）。 */
    defaultUiPreset?: UiPreset;
    /** 初期 themeMode（localStorage に保存値が無いときの既定）。'auto' も渡せる。 */
    defaultThemeMode?: ThemeModeSetting;
    /** 自動モードの時刻帯（既定＝陽光 6:00 / 残照 16:00 / 月光 19:00）。 */
    autoSchedule?: AutoThemeSchedule;
    /** 自動モードの再評価間隔（既定 15分）。試験で短くできる。 */
    autoIntervalMs?: number;
}
export declare function useThemeState(options?: UseThemeStateOptions): ThemeState;
//# sourceMappingURL=useThemeState.d.ts.map