/**
 * brandIcon — SGアイコン型（正方形・1:1）の同梱アセットと favicon 追従フック。v0.16.0
 *
 * 横長ロゴ（SgBrandLogo・2:1）との使い分け:
 *   横長は「ヘッダーに名乗る」ための絵。**幅104px を切ると装飾ストロークが潰れる**（07 v2.3 §1-4）。
 *   favicon（16〜32px）・アプリアイコン・小さな丸い枠のように、そこまで縮める場面は
 *   横長を縮小するのではなく**このアイコン型を使う**。素材そのものが正方形で描き起こされている。
 *
 * 素材の出所（採用 2026-08-09 15:35 社長裁定「ロゴは採用します。つぎのアプリ開発から実装できるように」）:
 *   便＝SGLOGO-20260809-01便。正本（1024×1024）は Drive 側
 *   `個人/2026-08-08_Eclipse_デザインシステム/素材/SGアイコン型第1便_20260809/` に残置する。
 *   同梱するのは 512×512（LANCZOS 縮小）の3枚だけ＝横長版の「standard のみ同梱・master は
 *   Drive 残置」方針の踏襲。SHA-256 は brand/logo-manifest.json の icons 節で追跡し、
 *   scripts/verify-brand-assets.mjs が毎回の check で src / dist の両方を突合する。
 *
 * ここに部品（<img> を返すコンポーネント）を置いていない理由:
 *   アイコン型の主用途は favicon / アプリアイコンで、画面に置く絵ではない。器が要る場面は
 *   SG_BRAND_ICON_SOURCES を使って採用側が自前の <img> を組む（横長版で自前 <img> を
 *   例外扱いにしているのと同じ線引き）。
 */
import { useEffect, useRef } from 'react';
import { useColorMode } from './colorMode';
import dayIcon from './brand/sg-icon-day.png';
import nightIcon from './brand/sg-icon-night.png';
import sunsetIcon from './brand/sg-icon-sunset.png';
/**
 * 絵柄のURL。SG_BRAND_LOGO_SOURCES と同じ形（src/width/height）。
 * favicon 以外（アプリアイコン・自前 <img>）に使うときはこれを読む。
 */
export const SG_BRAND_ICON_SOURCES = {
    day: { src: dayIcon, width: 512, height: 512 },
    night: { src: nightIcon, width: 512, height: 512 },
    sunset: { src: sunsetIcon, width: 512, height: 512 },
};
/** テーマ→絵柄の既定マップ（SgBrandLogo と同じ対応＝陽光/残照/月光で絵を揃える）。 */
const VARIANT_BY_THEME = {
    white: 'day',
    dusk: 'sunset',
    dark: 'night',
};
/** 我々が面倒を見ている <link> の目印（採用アプリ側の link と取り違えないため）。 */
const MANAGED_ATTR = 'data-magi-brand-favicon';
const ICON_LINK_SELECTOR = 'link[rel~="icon"]';
/**
 * <link rel="icon"> の所有権（モジュール内で1枚だけ面倒を見る）。
 *
 * 多重呼び出し安全のための参照数え: 複数の画面が useBrandFavicon() を呼んでも触る link は1枚。
 *   最後の1人が離れた時だけ後始末する（先に離れた1人が favicon を消す事故を防ぐ）。
 */
/** 借り物の link に戻すため、書き換える属性の元の値を控えておく。 */
const MANAGED_ATTRS = ['href', 'type', 'sizes'];
let ownedLink = null;
let createdByUs = false;
let originalAttrs = [];
let holders = 0;
function acquireLink() {
    if (typeof document === 'undefined')
        return null;
    if (holders === 0) {
        const existing = document.head.querySelector(ICON_LINK_SELECTOR);
        if (existing) {
            // 採用アプリが index.html に置いている link をそのまま借りる（2枚出して競わせない）。
            ownedLink = existing;
            createdByUs = false;
            originalAttrs = MANAGED_ATTRS.map((name) => [name, existing.getAttribute(name)]);
        }
        else {
            const link = document.createElement('link');
            link.rel = 'icon';
            ownedLink = link;
            createdByUs = true;
            originalAttrs = [];
            document.head.appendChild(link);
        }
        ownedLink.setAttribute(MANAGED_ATTR, 'on');
    }
    holders += 1;
    return ownedLink;
}
function releaseLink() {
    if (holders === 0)
        return;
    holders -= 1;
    if (holders > 0 || !ownedLink)
        return;
    if (createdByUs) {
        ownedLink.remove();
    }
    else {
        // 借り物は借りた時の姿へ返す（href だけでなく type/sizes も。目印も消す）。
        for (const [name, value] of originalAttrs) {
            if (value === null)
                ownedLink.removeAttribute(name);
            else
                ownedLink.setAttribute(name, value);
        }
        ownedLink.removeAttribute(MANAGED_ATTR);
    }
    ownedLink = null;
    createdByUs = false;
    originalAttrs = [];
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
export function useBrandFavicon(options = {}) {
    const { variant, themeMode } = options;
    // hooks は条件分岐の外で呼ぶ。themeMode が渡っていれば購読結果は使わない。
    const observedMode = useColorMode();
    const resolvedVariant = variant ?? VARIANT_BY_THEME[themeMode ?? observedMode];
    const source = SG_BRAND_ICON_SOURCES[resolvedVariant];
    const linkRef = useRef(null);
    // link の確保はマウント中ずっと（＝依存なし）。色モードが変わるたびに link を作り直すと
    //   一瞬アイコンが消えるので、確保と「何を指すか」は別の effect に分ける。
    //   この effect を先に書いてあることが順序の保証（React は宣言順に effect を走らせる）。
    useEffect(() => {
        linkRef.current = acquireLink();
        return () => {
            linkRef.current = null;
            releaseLink();
        };
    }, []);
    useEffect(() => {
        const link = linkRef.current;
        if (!link)
            return;
        link.setAttribute('type', 'image/png');
        link.setAttribute('sizes', `${source.width}x${source.height}`);
        link.setAttribute('href', source.src);
    }, [source]);
    return resolvedVariant;
}
//# sourceMappingURL=brandIcon.js.map