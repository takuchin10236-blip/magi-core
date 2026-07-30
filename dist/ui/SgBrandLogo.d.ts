import { type ThemeMode } from './uiPresets';
/** 同梱している絵柄。sunset は同梱しない（Drive 正本に残置）。 */
export type SgBrandLogoVariant = 'day' | 'night';
export interface SgBrandLogoSource {
    /** 標準版（480×240）のURL。 */
    src: string;
    /** 原画の実寸（属性で渡して読み込み中のガタつきを防ぐ）。 */
    width: number;
    height: number;
}
/** 絵柄のURL。アプリ側が自前の <img> を組みたいときのために公開する。 */
export declare const SG_BRAND_LOGO_SOURCES: Record<SgBrandLogoVariant, SgBrandLogoSource>;
export interface SgBrandLogoProps {
    /** 絵柄の明示指定。指定するとテーマ連動より優先される。 */
    variant?: SgBrandLogoVariant;
    /** テーマの明示指定。未指定なら documentElement の data-color-mode を読む。 */
    themeMode?: ThemeMode;
    /**
     * 代替テキスト（読み上げ名）。既定は「第二湘南グリーン」。
     * MagiAppShell の中で使うときは alt="" を推奨（施設名は kicker が読み上げるので二重になる）。
     */
    alt?: string;
    /** 夜版の外周の白余白を表示範囲から切り取る（既定 true）。false で原画のまま出す。 */
    trim?: boolean;
    /** アプリ固有の微調整用（幅は --magi-brand-logo-width でも変えられる）。 */
    className?: string;
}
export declare function SgBrandLogo({ variant, themeMode, alt, trim, className, }: SgBrandLogoProps): import("react").JSX.Element;
//# sourceMappingURL=SgBrandLogo.d.ts.map