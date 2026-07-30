/**
 * MagiAppShell — ヘッダー・トップメニュー・本文の骨格（v0.5・AppShell）。
 *
 * 骨格: ヘッダー（SgLumenLogo＋施設名/フロア名/アプリ名 ＋ 右側に状態/版）→ BusinessNav → children。
 *   状態要約・版チップ・ナビは合成済みノードで受ける（headerStatus/headerVersion/nav スロット）。
 *   各部品の props を透過的に MagiAppShell へ重複展開すると結合が強くなるため、
 *   合成した部品ノードを差し込む slot 方式を採る（アプリ側で <MagiStatusSummary/> 等を組む）。
 */
import type { ReactNode } from 'react';
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
  /** ヘッダー右の状態要約スロット（<MagiStatusSummary/> を想定）。 */
  headerStatus?: ReactNode;
  /** ヘッダー右の版チップスロット（<MagiVersionChip/> を想定）。 */
  headerVersion?: ReactNode;
  /** トップメニュースロット（<BusinessNav/> を想定）。 */
  nav?: ReactNode;
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
  children,
  className,
}: MagiAppShellProps) {
  return (
    <div className={`magi-appshell${className ? ` ${className}` : ''}`}>
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
            版チップを開いた時に見せる＝ヘッダーに情報を積み上げない。 */}
        {(headerStatus || headerVersion) ? (
          <div className="magi-appshell-header-right">
            {headerStatus}
            {headerVersion}
          </div>
        ) : null}
      </header>
      {nav}
      <main className="magi-appshell-main">{children}</main>
    </div>
  );
}
