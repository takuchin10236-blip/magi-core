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
    /** ロゴの aria-label（施設名）。既定は SgLumenLogo の既定値。 */
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
export declare function MagiAppShell({ facilityName, floorName, appName, logoLabel, logoDark, headerStatus, headerVersion, nav, children, className, }: MagiAppShellProps): import("react").JSX.Element;
//# sourceMappingURL=MagiAppShell.d.ts.map