import { jsx as _jsx } from "react/jsx-runtime";
/**
 * SgBrandLogo — 正式ブランドロゴ（絵画調SG・2:1・不透明PNG）。v0.8
 *
 * SgLumenLogo（SVG・窓と富士）とは別系統の「絵」のロゴ。素材正本は
 *   施設運営/職員マスタアプリ/assets/brand-final-20260730（採用日 2026-07-30）。
 *
 * 同梱するのは昼・夜の標準版（480×240）2枚だけ:
 *   @2x（960×480・各770KB）は同梱しない。ヘッダーでの表示幅は約112pxで、
 *   480px の原画はそこに約4倍の密度で入る＝DPR2の端末でも約2倍の余裕がある。
 *   夕日版（sunset）と master（1774×887）も同梱しない＝いずれも Drive 正本に残置する。
 *   同梱物の出所は brand/logo-manifest.json（SHA-256）で追跡し、
 *   scripts/verify-brand-assets.mjs が毎回の check で突合する。
 *
 * テーマ連動:
 *   ライト（white）→ day ／ ダーク（dark）→ night。
 *   themeMode を渡さない場合は documentElement の data-color-mode を読む。これは
 *   useThemeState が書き込んでいる属性そのもの（core 既存の作法）で、prefers-color-scheme の
 *   独自検知はしない＝職員が ColorModeSwitch で選んだ結果とロゴが必ず一致する。
 *
 * 夜版の白い外周について:
 *   原画像は「外側に白余白のある不透明PNG」で、暗い画面では白い額縁が浮いて見える。
 *   原画像は改変せず、CSS の表示範囲（overflow: hidden ＋ 位置合わせ）で余白だけを
 *   切り取る（design-system.css の .magi-brand-logo）。切り取り量は実測に基づく:
 *   480×240 のうち四辺 20px が余白で、絵柄の実体は 440×200（＝2.2:1）。
 *   trim={false} で原画（2:1・白余白つき）のまま出せる。
 */
import { useSyncExternalStore } from 'react';
import { DEFAULT_THEME_MODE, normalizeThemeMode } from './uiPresets';
import dayLogo from './brand/sg-logo-day.png';
import nightLogo from './brand/sg-logo-night.png';
/** 絵柄のURL。アプリ側が自前の <img> を組みたいときのために公開する。 */
export const SG_BRAND_LOGO_SOURCES = {
    day: { src: dayLogo, width: 480, height: 240 },
    night: { src: nightLogo, width: 480, height: 240 },
};
/** テーマ→絵柄の既定マップ。 */
const VARIANT_BY_THEME = {
    white: 'day',
    dark: 'night',
};
/** 既定の代替テキスト（＝この画像の読み上げ名）。 */
const DEFAULT_ALT = '第二湘南グリーン';
function subscribeColorMode(onStoreChange) {
    if (typeof document === 'undefined' || typeof MutationObserver === 'undefined')
        return () => { };
    // useThemeState は data-color-mode を書き換えるだけなので、属性変化を購読すれば足りる。
    const observer = new MutationObserver(onStoreChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-color-mode'] });
    return () => observer.disconnect();
}
function readColorMode() {
    if (typeof document === 'undefined')
        return DEFAULT_THEME_MODE;
    return normalizeThemeMode(document.documentElement.getAttribute('data-color-mode')) ?? DEFAULT_THEME_MODE;
}
function readServerColorMode() {
    return DEFAULT_THEME_MODE;
}
export function SgBrandLogo({ variant, themeMode, alt = DEFAULT_ALT, trim = true, className, }) {
    // hooks は条件分岐の外で呼ぶ。themeMode が渡っていれば購読結果は使わない。
    const observedMode = useSyncExternalStore(subscribeColorMode, readColorMode, readServerColorMode);
    const resolvedVariant = variant ?? VARIANT_BY_THEME[themeMode ?? observedMode];
    const source = SG_BRAND_LOGO_SOURCES[resolvedVariant];
    return (_jsx("span", { className: `magi-brand-logo${className ? ` ${className}` : ''}`, "data-variant": resolvedVariant, "data-trim": trim ? 'on' : 'off', children: _jsx("img", { alt: alt, className: "magi-brand-logo-img", decoding: "async", draggable: false, height: source.height, src: source.src, width: source.width }) }));
}
//# sourceMappingURL=SgBrandLogo.js.map