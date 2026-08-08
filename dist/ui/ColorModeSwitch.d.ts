import { type ThemeMode, type ThemeModeSetting } from './uiPresets';
export interface ColorModeSwitchProps {
    /** 適用中の実モード。自動運転中は「いま解決されている色」が入る。 */
    themeMode: ThemeMode;
    /** 手動で色を選んだときに呼ぶ（従来どおり）。 */
    onThemeMode: (value: ThemeMode) => void;
    /** 職員が選んでいる値（'auto' を含む）。未指定なら themeMode を選択中とみなす。 */
    themeModeSetting?: ThemeModeSetting;
    /** 'auto' を含む選択の受け口。**渡したときだけ「自動」ボタンが出る**。 */
    onThemeModeSetting?: (value: ThemeModeSetting) => void;
    /** アプリ固有の微調整用（本体クラスの再定義には使わない）。 */
    className?: string;
}
export declare function ColorModeSwitch({ themeMode, onThemeMode, themeModeSetting, onThemeModeSetting, className, }: ColorModeSwitchProps): import("react").JSX.Element;
//# sourceMappingURL=ColorModeSwitch.d.ts.map