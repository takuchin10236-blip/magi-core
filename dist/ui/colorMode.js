/**
 * colorMode — いま何色モードかを購読する共通部（内部モジュール・公開APIではない）。
 *
 * 出所: SgBrandLogo（v0.8）が持っていた購読機構をそのまま切り出したもの。挙動は変えていない。
 *   切り出した理由は、v0.16.0 で useBrandFavicon が同じ購読を要るようになったため。
 *   複製すると「テーマをどこから読むか」の出どころが2つになり、属性名を変えた時に片方だけ
 *   直し損ねる。読む場所は1箇所に保つ。
 *
 * 読む対象は <html data-color-mode>＝useThemeState が書き込んでいる属性そのもの。
 *   prefers-color-scheme の独自検知はしない（職員が ColorModeSwitch で選んだ結果と必ず一致させる）。
 * SSR では属性が無いので既定（陽光）を返す＝getServerSnapshot が document を触らない。
 */
import { useSyncExternalStore } from 'react';
import { DEFAULT_THEME_MODE, normalizeThemeMode } from './uiPresets';
export function subscribeColorMode(onStoreChange) {
    if (typeof document === 'undefined' || typeof MutationObserver === 'undefined')
        return () => { };
    // useThemeState は data-color-mode を書き換えるだけなので、属性変化を購読すれば足りる。
    const observer = new MutationObserver(onStoreChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-color-mode'] });
    return () => observer.disconnect();
}
export function readColorMode() {
    if (typeof document === 'undefined')
        return DEFAULT_THEME_MODE;
    return normalizeThemeMode(document.documentElement.getAttribute('data-color-mode')) ?? DEFAULT_THEME_MODE;
}
export function readServerColorMode() {
    return DEFAULT_THEME_MODE;
}
/** いまの色モード。属性が変われば再描画される。 */
export function useColorMode() {
    return useSyncExternalStore(subscribeColorMode, readColorMode, readServerColorMode);
}
//# sourceMappingURL=colorMode.js.map