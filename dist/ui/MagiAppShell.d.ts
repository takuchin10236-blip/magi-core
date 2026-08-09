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
import { type ReactNode } from 'react';
export interface MagiAppShellProps {
    facilityName: string;
    floorName?: string;
    appName: string;
    /**
     * ロゴスロット。未指定なら **SgBrandLogo（正式ブランドロゴ・絵画調PNG・3モード連動）** を出す
     * （2026-08-09 社長裁定でロゴを1本に統一。旧既定の SgLumenLogo〈SVG〉は廃止＝新規に選ばない）。
     * 別の絵を出すアプリだけがこのスロットへノードを渡す。
     *
     * 注意2点:
     *   - logo を指定すると logoLabel / logoDark は**効かない**（渡したノード側の責務になる）。
     *   - 既定では alt="" で出す。すぐ隣の kicker が施設名を読み上げるため、
     *     ロゴにも施設名を入れると読み上げが二重になる。
     */
    logo?: ReactNode;
    /**
     * ロゴの読み上げ名（施設名）。既定は空＝装飾扱い（施設名は kicker が読む）。
     * logo 指定時は無効。
     */
    logoLabel?: string;
    /**
     * @deprecated 2026-08-09 の既定ロゴ統一で無効になった。既定の SgBrandLogo は
     *   `<html data-color-mode>` を購読して陽光/残照/月光の絵柄を自分で選ぶ（明暗を外から渡さない）。
     *   受け口だけ残してあるのは、渡している既存アプリの型を壊さないため。
     */
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
export declare function MagiAppShell({ facilityName, floorName, appName, logo, logoLabel, headerStatus, headerVersion, nav, focusMode, onFocusModeChange, children, className, }: MagiAppShellProps): import("react").JSX.Element;
//# sourceMappingURL=MagiAppShell.d.ts.map