import { type ThemeMode, type UiMode, type UiPreset } from './uiPresets';
export interface DisplaySwitchProps {
    uiPreset: UiPreset;
    uiMode: UiMode;
    themeMode: ThemeMode;
    onUiPreset: (value: UiPreset) => void;
    onThemeMode: (value: ThemeMode) => void;
}
export declare function DisplaySwitch({ onThemeMode, onUiPreset, themeMode, uiMode, uiPreset, }: DisplaySwitchProps): import("react").JSX.Element;
//# sourceMappingURL=DisplaySwitch.d.ts.map