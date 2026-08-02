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
import { useEffect, useRef, useState, type ReactNode } from 'react';
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
export const MENU_STANDARD_KEYS = ['refresh', 'manual'] as const;
export type BusinessNavStandardMenuKey = (typeof MENU_STANDARD_KEYS)[number];

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
  /**
   * メニュー内の**操作項目**（押すと何かが起きるもの）。
   *
   * 標準の中身（フロントページ5層標準 §2-A ／ `01_UI標準` §3-3）:
   *   「今すぐ更新」（key: 'refresh'）・「マニュアル」（key: 'manual'）。キーの目安は
   *   {@link MENU_STANDARD_KEYS}（pilot・強制はしない）。
   * ここに入れないもの: **設定・全画面**はメニューに畳まずナビへ直置きする
   *   （全画面は {@link BusinessNavProps.navFocusToggle}、設定は navActions）。
   */
  menuItems?: BusinessNavMenuItem[];
  /**
   * メニュー内に差し込む追加要素。
   *
   * 標準の中身（フロントページ5層標準 §2-A ／ `01_UI標準` §3-3）: **テーマ切替**
   *   （ColorModeSwitch / DisplaySwitch）。menuItems の後ろ・menuFooter の前に描画する。
   */
  menuChildren?: ReactNode;
  /**
   * メニュー内の最下段に置く要素（更新履歴など、開く頻度が最も低いもの）。
   * menuChildren より後ろに描画する（2026-07-28 社長裁定の並び順）。
   *
   * 標準の中身（フロントページ5層標準 §2-A ／ `01_UI標準` §3-3）: **更新履歴**
   *   （VersionHistoryModal の入口）を**最下部**に置く。
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
   */
  navLeadingActions?: ReactNode;
  /**
   * 全画面（focus）ボタンをナビ右群の**先頭**に自動で置く（既定 false ＝ opt-in）。
   *
   * なぜ opt-in か（2026-08-02 社長裁定・非遡及）:
   *   各アプリが navActions に手で組み込んでいる現状を壊さないため、既定では
   *   **1px も変わらない**。渡していないアプリの DOM は従来どおり。
   *
   * 効くのは `navFocusToggle` が true で、かつ `focusMode` と `onFocusModeChange` の
   *   **両方**が渡っているときだけ。片方でも欠けたら何も描画しない
   *   （押しても何も起きない飾りのボタンを作らないため）。
   *
   * ⚠️ **手動配置との併用は禁止**（二重に出る）。自動側を使うなら、navActions から
   *   `<FocusToggle/>` を外すこと。この部品は重複を検知しない。
   *
   * 並び順の正本（フロントページ5層標準 §2-A ／ `01_UI標準` §3-3）:
   *   全画面 → 操作者 → 職員（ロールチップ） → メニュー（右端）。
   *   自動配置は navActions（操作者）より前に入るので、この並びに一致する。
   *
   * 状態の持ち方: focus 中はナビ自体が隠れるため、ここに出るのは実質「全画面にする」側。
   *   戻り口（focus 中の「戻る」）は MagiAppShell が別に必ず出す。
   *   `onFocusModeChange` を受けたアプリが `focusMode` を更新し、MagiAppShell にも
   *   同じ値を渡す構成（＝制御される側）を前提にしている。
   */
  navFocusToggle?: boolean;
  /** 現在 focus 表示か。`navFocusToggle` を使うときのみ必要（MagiAppShell と同じ値を渡す）。 */
  focusMode?: boolean;
  /** focus 表示の切り替え通知。`navFocusToggle` を使うときのみ必要。 */
  onFocusModeChange?: (next: boolean) => void;
  /** メニュー開閉ボタンのラベル。既定 'メニュー'。 */
  menuLabel?: string;
  className?: string;
}

export function BusinessNav({
  tabs,
  activeTab,
  onNavigate,
  role,
  roleTitle,
  menuItems,
  menuChildren,
  menuFooter,
  navActions,
  navLeadingActions,
  navFocusToggle,
  focusMode,
  onFocusModeChange,
  menuLabel = 'メニュー',
  className,
}: BusinessNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const hasMenu = (menuItems && menuItems.length > 0) || Boolean(menuChildren) || Boolean(menuFooter);
  // 押しても何も起きないボタンを出さないため、状態と通知が揃っているときだけ描く。
  const showFocusToggle =
    navFocusToggle === true && typeof focusMode === 'boolean' && typeof onFocusModeChange === 'function';

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current || menuRef.current.contains(event.target as Node)) return;
      // メニューから開いたモーダルは portal で body 直下へ出るため、DOM上は「外側」に見える。
      // そこを外側扱いで閉じると menuChildren（例: ManualEntry）ごと unmount され、
      // 開いていたマニュアルが消える（2026-07-30 shift-v4 実機で再現）。
      if (isInsideOpenModal(event.target)) return;
      setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      // モーダルが開いている間の Esc は、そのモーダルを閉じる操作。ここで奪わない
      // （奪うとメニューごと畳まれ、閉じた先の部品まで消える）。
      // キー操作は焦点が body にあることもあるので、target ではなく画面全体で見る。
      if (hasOpenModal()) return;
      setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  return (
    <nav className={`magi-appshell-nav no-print${className ? ` ${className}` : ''}`} aria-label="メインメニュー">
      <div className="magi-appshell-nav-tabs" role="tablist" aria-label="表示内容">
        {tabs.map((tab) => {
          const active = activeTab === tab.value;
          return (
            <button
              aria-label={tab.description ? `${tab.label}: ${tab.description}` : tab.label}
              aria-pressed={active}
              className={`magi-appshell-nav-tab${active ? ' active' : ''}`}
              key={tab.value}
              onClick={() => onNavigate(tab.value)}
              title={tab.description}
              type="button"
            >
              {tab.icon ? <span aria-hidden>{tab.icon}</span> : null}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {navLeadingActions ? (
        <div className="magi-appshell-nav-leading">{navLeadingActions}</div>
      ) : null}

      <div className="magi-appshell-nav-right">
        {/* 並び順は 全画面 → 操作者(navActions) → 職員(ロールチップ) → メニュー（右端）。 */}
        {showFocusToggle ? (
          <FocusToggle
            className="magi-appshell-nav-focus-toggle"
            focusMode={focusMode as boolean}
            onFocusModeChange={onFocusModeChange as (next: boolean) => void}
          />
        ) : null}

        {navActions}

        {role ? (
          <span className="magi-appshell-role-chip" title={roleTitle ?? `権限: ${role}`}>
            <ShieldCheck size={16} aria-hidden />
            <span>{role}</span>
          </span>
        ) : null}

        {hasMenu ? (
          <div className="magi-appshell-menu" ref={menuRef}>
            <button
              aria-expanded={menuOpen}
              aria-haspopup="true"
              className={`magi-appshell-nav-tab magi-appshell-menu-toggle${menuOpen ? ' active' : ''}`}
              onClick={() => setMenuOpen((value) => !value)}
              title="表示テーマ・メニューを開きます"
              type="button"
            >
              <Settings2 size={16} aria-hidden />
              <span>{menuLabel}</span>
              <ChevronDown size={14} aria-hidden className={`magi-appshell-menu-caret${menuOpen ? ' open' : ''}`} />
            </button>

            {menuOpen ? (
              <div className="magi-appshell-menu-panel" role="menu" aria-label="補助メニュー">
                {(menuItems ?? []).map((item) =>
                  item.href ? (
                    <a
                      className="magi-appshell-menu-item"
                      href={item.href}
                      key={item.key}
                      onClick={() => setMenuOpen(false)}
                      title={item.description}
                    >
                      {item.icon ? <span aria-hidden>{item.icon}</span> : null}
                      <span>{item.label}</span>
                    </a>
                  ) : (
                    <button
                      className="magi-appshell-menu-item"
                      key={item.key}
                      onClick={() => {
                        setMenuOpen(false);
                        item.onSelect?.();
                      }}
                      title={item.description}
                      type="button"
                    >
                      {item.icon ? <span aria-hidden>{item.icon}</span> : null}
                      <span>{item.label}</span>
                    </button>
                  ),
                )}
                {menuChildren}
                {menuFooter}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </nav>
  );
}
