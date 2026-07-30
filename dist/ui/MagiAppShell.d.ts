/**
 * MagiAppShell — ヘッダー・トップメニュー・本文の骨格（v0.5・AppShell）。
 *
 * 骨格: ヘッダー（SgLumenLogo＋施設名/フロア名/アプリ名 ＋ 右側に状態/版）→ BusinessNav → children。
 *   状態要約・版チップ・ナビは合成済みノードで受ける（headerStatus/headerVersion/nav スロット）。
 *   各部品の props を透過的に MagiAppShell へ重複展開すると結合が強くなるため、
 *   合成した部品ノードを差し込む slot 方式を採る（アプリ側で <MagiStatusSummary/> 等を組む）。
 */
import type { ReactNode } from 'react';
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
export declare function MagiAppShell({ facilityName, floorName, appName, logo, logoLabel, logoDark, headerStatus, headerVersion, nav, children, className, }: MagiAppShellProps): import("react").JSX.Element;
//# sourceMappingURL=MagiAppShell.d.ts.map