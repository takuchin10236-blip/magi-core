import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * BusinessNav — 主要画面タブ＋右側補助メニュー（v0.5・AppShell）。
 *
 * 原本: magi-resident-spine origin/main src/components/TopMenuBar.tsx を一般化。
 *   利用者マスタ固有の NAV_ITEMS / マニュアル / DisplaySwitch 直結を外し、
 *   タブ・ロール・メニュー項目・メニュー内スロットを props で受ける汎用ナビにした。
 *   アイコンは ReactNode で受ける（アプリが lucide 等を注入）＝icon 依存を型に固定しない。
 *
 * 重なり順の規約（v0.9.2）: ナビ帯は `--magi-z-nav`、メニューパネルは `--magi-z-popover`。
 *   **アプリの sticky 帯・独自ポップアップは `--magi-z-app-sticky-max`（100）未満にすること。**
 *   帯は z-index で積み重ねの文脈を作るため、これを超えるとメニューが帯ごと下に潜る。
 */
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Settings2, ShieldCheck } from 'lucide-react';
import { FocusToggle } from './FocusToggle';
import { hasOpenModal, isInsideOpenModal } from './modalGuards';
/**
 * メニューの標準キー（2026-08-02 還流・experimental / pilot・版は未確定）。
 *
 * 正本: フロントページ5層標準 §2-A（`01_UI標準` §3-3）。「今すぐ更新」「マニュアル」は
 *   どのアプリでも同じ場所（メニュー内の操作項目）に置く、という取り決めの値だけを写した。
 * pilot 段階なので**強制ガードは置かない**（キーを揃えたいアプリが使うための目安）。
 */
export const MENU_STANDARD_KEYS = ['refresh', 'manual'];
export function BusinessNav({ tabs, activeTab, onNavigate, role, roleTitle, menuItems, menuChildren, menuFooter, navActions, navLeadingActions, navFocusToggle, focusMode, onFocusModeChange, menuLabel = 'メニュー', className, }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const hasMenu = (menuItems && menuItems.length > 0) || Boolean(menuChildren) || Boolean(menuFooter);
    // 押しても何も起きないボタンを出さないため、状態と通知が揃っているときだけ描く。
    const showFocusToggle = navFocusToggle === true && typeof focusMode === 'boolean' && typeof onFocusModeChange === 'function';
    useEffect(() => {
        if (!menuOpen)
            return;
        const onPointerDown = (event) => {
            if (!menuRef.current || menuRef.current.contains(event.target))
                return;
            // メニューから開いたモーダルは portal で body 直下へ出るため、DOM上は「外側」に見える。
            // そこを外側扱いで閉じると menuChildren（例: ManualEntry）ごと unmount され、
            // 開いていたマニュアルが消える（2026-07-30 shift-v4 実機で再現）。
            if (isInsideOpenModal(event.target))
                return;
            setMenuOpen(false);
        };
        const onKeyDown = (event) => {
            if (event.key !== 'Escape')
                return;
            // モーダルが開いている間の Esc は、そのモーダルを閉じる操作。ここで奪わない
            // （奪うとメニューごと畳まれ、閉じた先の部品まで消える）。
            // キー操作は焦点が body にあることもあるので、target ではなく画面全体で見る。
            if (hasOpenModal())
                return;
            setMenuOpen(false);
        };
        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [menuOpen]);
    return (_jsxs("nav", { className: `magi-appshell-nav no-print${className ? ` ${className}` : ''}`, "aria-label": "\u30E1\u30A4\u30F3\u30E1\u30CB\u30E5\u30FC", children: [_jsx("div", { className: "magi-appshell-nav-tabs", role: "tablist", "aria-label": "\u8868\u793A\u5185\u5BB9", children: tabs.map((tab) => {
                    const active = activeTab === tab.value;
                    return (_jsxs("button", { "aria-label": tab.description ? `${tab.label}: ${tab.description}` : tab.label, "aria-pressed": active, className: `magi-appshell-nav-tab${active ? ' active' : ''}`, onClick: () => onNavigate(tab.value), title: tab.description, type: "button", children: [tab.icon ? _jsx("span", { "aria-hidden": true, children: tab.icon }) : null, _jsx("span", { children: tab.label })] }, tab.value));
                }) }), navLeadingActions ? (_jsx("div", { className: "magi-appshell-nav-leading", children: navLeadingActions })) : null, _jsxs("div", { className: "magi-appshell-nav-right", children: [showFocusToggle ? (_jsx(FocusToggle, { className: "magi-appshell-nav-focus-toggle", focusMode: focusMode, onFocusModeChange: onFocusModeChange })) : null, navActions, role ? (_jsxs("span", { className: "magi-appshell-role-chip", title: roleTitle ?? `権限: ${role}`, children: [_jsx(ShieldCheck, { size: 16, "aria-hidden": true }), _jsx("span", { children: role })] })) : null, hasMenu ? (_jsxs("div", { className: "magi-appshell-menu", ref: menuRef, children: [_jsxs("button", { "aria-expanded": menuOpen, "aria-haspopup": "true", className: `magi-appshell-nav-tab magi-appshell-menu-toggle${menuOpen ? ' active' : ''}`, onClick: () => setMenuOpen((value) => !value), title: "\u8868\u793A\u30C6\u30FC\u30DE\u30FB\u30E1\u30CB\u30E5\u30FC\u3092\u958B\u304D\u307E\u3059", type: "button", children: [_jsx(Settings2, { size: 16, "aria-hidden": true }), _jsx("span", { children: menuLabel }), _jsx(ChevronDown, { size: 14, "aria-hidden": true, className: `magi-appshell-menu-caret${menuOpen ? ' open' : ''}` })] }), menuOpen ? (_jsxs("div", { className: "magi-appshell-menu-panel", role: "menu", "aria-label": "\u88DC\u52A9\u30E1\u30CB\u30E5\u30FC", children: [(menuItems ?? []).map((item) => item.href ? (_jsxs("a", { className: "magi-appshell-menu-item", href: item.href, onClick: () => setMenuOpen(false), title: item.description, children: [item.icon ? _jsx("span", { "aria-hidden": true, children: item.icon }) : null, _jsx("span", { children: item.label })] }, item.key)) : (_jsxs("button", { className: "magi-appshell-menu-item", onClick: () => {
                                            setMenuOpen(false);
                                            item.onSelect?.();
                                        }, title: item.description, type: "button", children: [item.icon ? _jsx("span", { "aria-hidden": true, children: item.icon }) : null, _jsx("span", { children: item.label })] }, item.key))), menuChildren, menuFooter] })) : null] })) : null] })] }));
}
//# sourceMappingURL=BusinessNav.js.map