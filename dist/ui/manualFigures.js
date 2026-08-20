/**
 * manualFigures — マニュアルのロゴ節で使う「ロゴの切り出し図」（v0.21.0・2026-08-21）
 *
 * なぜ core に置くか:
 *   ロゴ画像そのものは既に core が同梱している（`brand/sg-logo-*.png`）。その切り出しも
 *   同じ絵であり、施設固有の**文言**は一切含まない。文言は非公開の `@magi/manual-content`、
 *   絵は core という分担を保つ（2026-08-20 社長裁定 A-3）。
 *
 * 出どころ:
 *   Drive 正本 `施設運営/アプリ開発/職員マスタアプリ/assets/brand-final-20260730/`
 *   の master（1774×887）から切り出し、表示幅へ縮小して WebP（品質82）で保存した。
 *   master 自体は同梱しない（パッケージ肥大の防止＝brand と同じ方針）。
 *   合計 約190KB。PNG のままだと約2MB あったため WebP を選んだ。
 *
 * 使い方:
 *   import { SG_LOGO_FIGURES } from '@magi/core/ui';
 *   { type: 'image', src: SG_LOGO_FIGURES.fuji, alt: '…', caption: '…' }
 */
import fuji from './manual-figures/logo-fuji.webp';
import full from './manual-figures/logo-full.webp';
import karakusa from './manual-figures/logo-karakusa.webp';
import monogram from './manual-figures/logo-monogram.webp';
import threeSkies from './manual-figures/logo-three-skies.webp';
import wave from './manual-figures/logo-wave.webp';
/** ロゴ節で使う図のURL（バンドラが解決した配備後のURL）。 */
export const SG_LOGO_FIGURES = {
    /** ロゴ全体（陽光） */
    full,
    /** SGの組み文字 */
    monogram,
    /** 富士山 */
    fuji,
    /** 手前の波 */
    wave,
    /** 角の金の唐草 */
    karakusa,
    /** 陽光・残照・月光の3枚を横に並べた図 */
    threeSkies,
};
//# sourceMappingURL=manualFigures.js.map