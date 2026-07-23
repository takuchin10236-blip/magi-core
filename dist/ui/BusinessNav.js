import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * BusinessNav — 主要画面タブ＋右側補助メニュー（v0.5・AppShell）。
 *
 * 原本: magi-resident-spine origin/main src/components/TopMenuBar.tsx を一般化。
 *   利用者マスタ固有の NAV_ITEMS / マニュアル / DisplaySwitch 直結を外し、
 *   タブ・ロール・メニュー項目・メニュー内スロットを props で受ける汎用ナビにした。
 *   アイコンは ReactNode で受ける（アプリが lucide 等を注入）＝icon 依存を型に固定しない。
 */
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Settings2, ShieldCheck } from 'lucide-react';
export function BusinessNav({ tabs, activeTab, onNavigate, role, roleTitle, menuItems, menuChildren, menuLabel = 'メニュー', className, }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const hasMenu = (menuItems && menuItems.length > 0) || Boolean(menuChildren);
    useEffect(() => {
        if (!menuOpen)
            return;
        const onPointerDown = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target))
                setMenuOpen(false);
        };
        const onKeyDown = (event) => {
            if (event.key === 'Escape')
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
                }) }), _jsxs("div", { className: "magi-appshell-nav-right", children: [role ? (_jsxs("span", { className: "magi-appshell-role-chip", title: roleTitle ?? `権限: ${role}`, children: [_jsx(ShieldCheck, { size: 16, "aria-hidden": true }), _jsx("span", { children: role })] })) : null, hasMenu ? (_jsxs("div", { className: "magi-appshell-menu", ref: menuRef, children: [_jsxs("button", { "aria-expanded": menuOpen, "aria-haspopup": "true", className: `magi-appshell-nav-tab magi-appshell-menu-toggle${menuOpen ? ' active' : ''}`, onClick: () => setMenuOpen((value) => !value), title: "\u8868\u793A\u30C6\u30FC\u30DE\u30FB\u30E1\u30CB\u30E5\u30FC\u3092\u958B\u304D\u307E\u3059", type: "button", children: [_jsx(Settings2, { size: 16, "aria-hidden": true }), _jsx("span", { children: menuLabel }), _jsx(ChevronDown, { size: 14, "aria-hidden": true, className: `magi-appshell-menu-caret${menuOpen ? ' open' : ''}` })] }), menuOpen ? (_jsxs("div", { className: "magi-appshell-menu-panel", role: "menu", "aria-label": "\u88DC\u52A9\u30E1\u30CB\u30E5\u30FC", children: [(menuItems ?? []).map((item) => item.href ? (_jsxs("a", { className: "magi-appshell-menu-item", href: item.href, onClick: () => setMenuOpen(false), title: item.description, children: [item.icon ? _jsx("span", { "aria-hidden": true, children: item.icon }) : null, _jsx("span", { children: item.label })] }, item.key)) : (_jsxs("button", { className: "magi-appshell-menu-item", onClick: () => {
                                            setMenuOpen(false);
                                            item.onSelect?.();
                                        }, title: item.description, type: "button", children: [item.icon ? _jsx("span", { "aria-hidden": true, children: item.icon }) : null, _jsx("span", { children: item.label })] }, item.key))), menuChildren] })) : null] })) : null] })] }));
}
//# sourceMappingURL=BusinessNav.js.map