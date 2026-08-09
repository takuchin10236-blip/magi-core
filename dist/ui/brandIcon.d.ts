import { type ThemeMode } from './uiPresets';
/** 同梱しているアイコンの絵柄（512×512 の3枚）。1024原本は同梱しない（Drive 正本に残置）。 */
export type SgBrandIconVariant = 'day' | 'night' | 'sunset';
export interface SgBrandIconSource {
    /** 同梱版（512×512）のURL。 */
    src: string;
    /** 原画の実寸（属性で渡して読み込み中のガタつきを防ぐ）。 */
    width: number;
    height: number;
}
/**
 * 絵柄のURL。SG_BRAND_LOGO_SOURCES と同じ形（src/width/height）。
 * favicon 以外（アプリアイコン・自前 <img>）に使うときはこれを読む。
 */
export declare const SG_BRAND_ICON_SOURCES: Record<SgBrandIconVariant, SgBrandIconSource>;
export interface UseBrandFaviconOptions {
    /** 絵柄の明示指定。指定するとテーマ連動より優先される。 */
    variant?: SgBrandIconVariant;
    /** テーマの明示指定。未指定なら documentElement の data-color-mode を読む。 */
    themeMode?: ThemeMode;
}
/**
 * useBrandFavicon — タブのアイコンを現在の色モードへ自動追従させる（1行で呼ぶ）。
 *
 *   function App() {
 *     useBrandFavicon();   // これだけ。陽光→day / 残照→sunset / 月光→night
 *     …
 *   }
 *
 * 挙動:
 *   - <link rel="icon"> が既にあればそれを借りて href だけ差し替える。無ければ1枚作る。
 *   - 色モードが変われば href も変わる（SgBrandLogo と同じ購読機構＝data-color-mode を見る）。
 *   - 多重呼び出し安全: 何箇所から呼んでも link は1枚。最後の呼び出し元が消えた時に、
 *     借り物なら元の href へ戻し、自前で作った1枚なら取り除く。
 *   - SSR 安全: document を触るのは effect の中だけ（サーバ描画では何も起きない）。
 *
 * 戻り値は解決した絵柄（表示や検証に使いたい時のため。使わなくてよい）。
 */
export declare function useBrandFavicon(options?: UseBrandFaviconOptions): SgBrandIconVariant;
//# sourceMappingURL=brandIcon.d.ts.map