/**
 * BusinessNav — 主要画面タブ＋右側補助メニュー（v0.5・AppShell）。
 *
 * 原本: magi-resident-spine origin/main src/components/TopMenuBar.tsx を一般化。
 *   利用者マスタ固有の NAV_ITEMS / マニュアル / DisplaySwitch 直結を外し、
 *   タブ・ロール・メニュー項目・メニュー内スロットを props で受ける汎用ナビにした。
 *   アイコンは ReactNode で受ける（アプリが lucide 等を注入）＝icon 依存を型に固定しない。
 */
import { type ReactNode } from 'react';
export type BusinessNavTab = {
    value: string;
    label: string;
    description?: string;
    icon?: ReactNode;
};
export type BusinessNavMenuItem = {
    key: string;
    label: string;
    icon?: ReactNode;
    description?: string;
    /** ボタンとして扱う。href 指定時はリンクを優先。 */
    onSelect?: () => void;
    href?: string;
};
export interface BusinessNavProps {
    tabs: BusinessNavTab[];
    activeTab: string;
    onNavigate: (value: string) => void;
    /** 右側に表示するロール名（例 '管理者' '職員'）。 */
    role?: string;
    /** ロールチップのタイトル補足（例 'ログインで確認された権限: admin'）。 */
    roleTitle?: string;
    menuItems?: BusinessNavMenuItem[];
    /** メニュー内に差し込む追加要素（例 ColorModeSwitch / DisplaySwitch）。 */
    menuChildren?: ReactNode;
    /** メニュー開閉ボタンのラベル。既定 'メニュー'。 */
    menuLabel?: string;
    className?: string;
}
export declare function BusinessNav({ tabs, activeTab, onNavigate, role, roleTitle, menuItems, menuChildren, menuLabel, className, }: BusinessNavProps): import("react").JSX.Element;
//# sourceMappingURL=BusinessNav.d.ts.map