import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * MagiAppShell — ヘッダー・トップメニュー・本文の骨格（v0.9・AppShell）。
 *
 * 骨格: ヘッダー（ロゴ＋施設名/フロア名/アプリ名 ＋ 右側に状態/版）→ BusinessNav → children。
 *   状態要約・版チップ・ナビは合成済みノードで受ける（headerStatus/headerVersion/nav スロット）。
 *   各部品の props を透過的に MagiAppShell へ重複展開すると結合が強くなるため、
 *   合成した部品ノードを差し込む slot 方式を採る（アプリ側で <MagiStatusSummary/> 等を組む）。
 *
 * ヘッダーのバッジ行（v0.9・社長裁定「フロントページ5層標準」・基準実体＝職員マスタ）:
 *   - 右端寄せ・**原則1列（nowrap）**・高さと padding は揃える
 *   - 視覚順序は**右端から ①状態の説明 ②版 ③その他バッジ**。全体で**3〜4個以内**に留める
 *     （個数はアプリ側の約束。ここでは並び順と大きさだけを型で保証する）
 *   - 並び替えは design-system.css の order で行い、DOM順・各部品のAPIは変えていない
 *     （MagiStatusSummary は「バッジ群＋状態の説明」を1つの部品として持つため、
 *      クラスタを display: contents で親の並びへ溶かし込み、間に版チップを差し込む）
 *
 * 作業面の全画面表示（v0.9・focusMode）:
 *   focusMode で「作業面（children）だけ」を全面に出す。ヘッダー・ナビ、および
 *   アプリが `.magi-appshell-focus-hidden` を付けた帯が隠れる。**Esc で必ず戻れる**。
 *   印刷は focus 状態に関わらず従来どおり（focus の CSS は @media screen 内にある）。
 */
import { useCallback, useEffect, useState } from 'react';
import { FocusToggle } from './FocusToggle';
import { hasOpenModal } from './modalGuards';
import { SgLumenLogo } from './SgLumenLogo';
export function MagiAppShell({ facilityName, floorName, appName, logo, logoLabel, logoDark, headerStatus, headerVersion, nav, focusMode, onFocusModeChange, children, className, }) {
    // props を初期値として持ちつつ、内部でも状態を持つ（Esc を確実に効かせるため）。
    const [focusActive, setFocusActive] = useState(focusMode ?? false);
    useEffect(() => {
        setFocusActive(focusMode ?? false);
    }, [focusMode]);
    const changeFocus = useCallback((next) => {
        setFocusActive(next);
        onFocusModeChange?.(next);
    }, [onFocusModeChange]);
    useEffect(() => {
        if (!focusActive)
            return;
        const onKeyDown = (event) => {
            if (event.key !== 'Escape')
                return;
            // モーダルが開いている間は、その Esc（閉じる操作）を横取りしない（判定は modalGuards に集約）。
            if (hasOpenModal())
                return;
            changeFocus(false);
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [focusActive, changeFocus]);
    return (_jsxs("div", { className: `magi-appshell${focusActive ? ' magi-appshell-focus-mode' : ''}${className ? ` ${className}` : ''}`, "data-focus-mode": focusActive ? 'on' : 'off', children: [_jsxs("header", { className: "magi-appshell-header", children: [_jsxs("div", { className: "magi-appshell-brand", children: [logo ?? _jsx(SgLumenLogo, { className: "magi-appshell-logo", dark: logoDark, label: logoLabel }), _jsxs("div", { className: "magi-appshell-titles", children: [_jsxs("p", { className: "magi-appshell-kicker", children: [facilityName, floorName ? _jsx("span", { className: "magi-appshell-floor", children: ` ${floorName}` }) : null] }), _jsx("h1", { className: "magi-appshell-title", children: appName })] })] }), (headerStatus || headerVersion) ? (_jsxs("div", { className: "magi-appshell-header-right", children: [headerStatus, headerVersion] })) : null] }), nav, _jsx("main", { className: "magi-appshell-main", children: children }), focusActive ? (_jsx(FocusToggle, { className: "magi-appshell-focus-exit", focusMode: true, onFocusModeChange: changeFocus })) : null] }));
}
//# sourceMappingURL=MagiAppShell.js.map