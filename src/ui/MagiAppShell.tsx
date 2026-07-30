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
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { FocusToggle } from './FocusToggle';
import { SgLumenLogo } from './SgLumenLogo';

export interface MagiAppShellProps {
  facilityName: string;
  floorName?: string;
  appName: string;
  /**
   * ロゴスロット。未指定なら従来どおり SgLumenLogo（SVG）を出す＝既存アプリは無改修のまま。
   * 正式ブランドロゴ（絵）へ差し替えるアプリは <SgBrandLogo /> を渡す。
   *
   * 注意2点:
   *   - logo を指定すると logoLabel / logoDark は**効かない**（渡したノード側の責務になる）。
   *   - シェルの中で使うときは <SgBrandLogo alt="" /> を推奨。すぐ隣の kicker が施設名を
   *     読み上げるため、ロゴにも施設名を入れると読み上げが二重になる。
   */
  logo?: ReactNode;
  /** ロゴの aria-label（施設名）。既定は SgLumenLogo の既定値。logo 指定時は無効。 */
  logoLabel?: string;
  logoDark?: boolean;
  /** ヘッダー右の状態要約スロット（<MagiStatusSummary/> を想定）。視覚順は右から1番目と3番目。 */
  headerStatus?: ReactNode;
  /** ヘッダー右の版チップスロット（<MagiVersionChip/> を想定）。視覚順は右から2番目。 */
  headerVersion?: ReactNode;
  /** トップメニュースロット（<BusinessNav/> を想定）。 */
  nav?: ReactNode;
  /**
   * 作業面だけを全面表示にする（既定 false）。true でヘッダー・ナビ・
   * `.magi-appshell-focus-hidden` の帯が隠れ、children が全高になる。
   *
   * 受け渡しは「渡した値を初期値として同期し、Esc・戻るボタンは内部でも必ず効く」方式。
   * onFocusModeChange を実装していないアプリでも Esc で戻れる（戻れない画面を作らないため）。
   */
  focusMode?: boolean;
  /** focus 表示の切り替え通知（全画面ボタン・戻るボタン・Esc のいずれでも呼ばれる）。 */
  onFocusModeChange?: (next: boolean) => void;
  children: ReactNode;
  className?: string;
}

export function MagiAppShell({
  facilityName,
  floorName,
  appName,
  logo,
  logoLabel,
  logoDark,
  headerStatus,
  headerVersion,
  nav,
  focusMode,
  onFocusModeChange,
  children,
  className,
}: MagiAppShellProps) {
  // props を初期値として持ちつつ、内部でも状態を持つ（Esc を確実に効かせるため）。
  const [focusActive, setFocusActive] = useState(focusMode ?? false);
  useEffect(() => {
    setFocusActive(focusMode ?? false);
  }, [focusMode]);

  const changeFocus = useCallback(
    (next: boolean) => {
      setFocusActive(next);
      onFocusModeChange?.(next);
    },
    [onFocusModeChange],
  );

  useEffect(() => {
    if (!focusActive) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      // モーダルが開いている間は、その Esc（閉じる操作）を横取りしない。
      if (document.querySelector('[role="dialog"][aria-modal="true"], dialog[open]')) return;
      changeFocus(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [focusActive, changeFocus]);

  return (
    <div
      className={`magi-appshell${focusActive ? ' magi-appshell-focus-mode' : ''}${className ? ` ${className}` : ''}`}
      data-focus-mode={focusActive ? 'on' : 'off'}
    >
      <header className="magi-appshell-header">
        <div className="magi-appshell-brand">
          {logo ?? <SgLumenLogo className="magi-appshell-logo" dark={logoDark} label={logoLabel} />}
          <div className="magi-appshell-titles">
            <p className="magi-appshell-kicker">
              {facilityName}
              {/* 区切りは中黒（・）でなく半角スペース。基準実体（利用者マスタ）は
                  「第二湘南グリーン 2F」と1つの文字列で名乗っており、中黒を挟まない。
                  2026-07-26 社長裁定「利用者マスタの形を正とする」。 */}
              {floorName ? <span className="magi-appshell-floor">{` ${floorName}`}</span> : null}
            </p>
            <h1 className="magi-appshell-title">{appName}</h1>
          </div>
        </div>
        {/* 状態・版はアプリ名と同じ行の右端に置く（2026-07-28 社長裁定）。
            ここに置いてよいのは「環境」と「版」だけ。名簿・保存先などの詳細は
            版チップを開いた時に見せる＝ヘッダーに情報を積み上げない。
            並び（右端から 状態の説明→版→その他）は CSS の order で作る。 */}
        {(headerStatus || headerVersion) ? (
          <div className="magi-appshell-header-right">
            {headerStatus}
            {headerVersion}
          </div>
        ) : null}
      </header>
      {nav}
      <main className="magi-appshell-main">{children}</main>
      {/* focus 中の戻り口。アプリが FocusToggle をどこに置いていても、
          ここが必ず出るので「戻れない」が起きない。 */}
      {focusActive ? (
        <FocusToggle className="magi-appshell-focus-exit" focusMode onFocusModeChange={changeFocus} />
      ) : null}
    </div>
  );
}
