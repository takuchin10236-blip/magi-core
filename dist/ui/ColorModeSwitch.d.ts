import type { ThemeMode } from './uiPresets';
export interface ColorModeSwitchProps {
    themeMode: ThemeMode;
    onThemeMode: (value: ThemeMode) => void;
    /** アプリ固有の微調整用（本体クラスの再定義には使わない）。 */
    className?: string;
}
export declare function ColorModeSwitch({ themeMode, onThemeMode, className }: ColorModeSwitchProps): import("react").JSX.Element;
//# sourceMappingURL=ColorModeSwitch.d.ts.map