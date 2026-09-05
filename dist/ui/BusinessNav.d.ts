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
import { type ReactNode } from 'react';
export type BusinessNavTab = {
    value: string;
    label: string;
    description?: string;
    icon?: ReactNode;
    /**
     * 主操作（CTA）として強調表示する（2026-08-27 社長裁定「項目と明らかに違うと分かるように」）。
     *   例: 連絡ノートの「投稿を書く」。通常タブよりやや大きく・塗りで描く。
     */
    emphasis?: boolean;
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
    /**
     * 業務タブの「直後（左寄せ側）」に並べる、その画面の主操作（例: 「追加」）。
     *
     * なぜ navActions と別に要るか（2026-07-29 社長指摘・利用者マスタ管理アプリ）:
     *   navActions は右端（メニュー・権限チップの並び）で、「今この画面で何をするか」
     *   という主操作を置くと、視線がタブから画面の反対側へ飛ぶ。主操作はタブの隣、
     *   つまり**見ている場所のすぐ横**にあるべきである。
     * 省略時は何も描画しないため、既存アプリの見た目は変わらない。
     *
     * 🔴 **全画面（FocusToggle）をここに置かない**（v0.28.0・2026-09-06 社長裁定）。
     *   全画面は**右群の先頭**が正（01_UI標準 §3-3-2「全画面 → 操作者 → 職員（ロール） → メニュー」）。
     *   `focusMode` / `onFocusModeChange` を渡せば **core がその位置に描く**ので、アプリは置き場所を
     *   決めなくてよい。ここへ置くとタブの隣に出て、他アプリと位置が食い違う
     *   （ケアプロファイルで実際に食い違い、社長が写真2枚で指摘した）。
     */
    navLeadingActions?: ReactNode;
    /**
     * 作業面の全画面表示の現在値。`MagiAppShell` の `focusMode` と同じ値を渡す。
     */
    focusMode?: boolean;
    /**
     * 全画面の切替（次の状態を受ける）。**これを渡した時だけ** core が右群の先頭へ
     * `FocusToggle` を描く（v0.28.0）。渡さなければ何も描かない＝既存アプリは無風。
     *
     * なぜ core が描くか: 置き場所をアプリ1本ずつの記述に任せると必ずずれる。
     *   「どのアプリも最初からこの形」を型で担保する（2026-09-06 社長裁定）。
     */
    onFocusModeChange?: (next: boolean) => void;
    /** メニュー開閉ボタンのラベル。既定 'メニュー'。 */
    menuLabel?: string;
    className?: string;
}
export declare function BusinessNav({ tabs, activeTab, onNavigate, role, roleTitle, menuItems, menuChildren, menuFooter, navActions, navLeadingActions, focusMode, onFocusModeChange, menuLabel, className, }: BusinessNavProps): import("react").JSX.Element;
//# sourceMappingURL=BusinessNav.d.ts.map