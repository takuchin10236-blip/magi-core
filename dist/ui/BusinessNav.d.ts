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
    /**
     * メニュー内の最下段に置く要素（更新履歴など、開く頻度が最も低いもの）。
     * menuChildren より後ろに描画する（2026-07-28 社長裁定の並び順）。
     */
    menuFooter?: ReactNode;
    /**
     * メニューボタンの「左」に並べる常設操作（例: 操作者チップ）。
     * ヘッダーではなくナビ行に置くことで、ヘッダーを環境・版だけに保つ。
     */
    navActions?: ReactNode;
    /** メニュー開閉ボタンのラベル。既定 'メニュー'。 */
    menuLabel?: string;
    className?: string;
}
export declare function BusinessNav({ tabs, activeTab, onNavigate, role, roleTitle, menuItems, menuChildren, menuFooter, navActions, menuLabel, className, }: BusinessNavProps): import("react").JSX.Element;
//# sourceMappingURL=BusinessNav.d.ts.map