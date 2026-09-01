import { type DeclarableState, type RuntimeDetectorConfig, type WriteDetector } from './statusDetection';
export interface MagiStatusSummaryProps {
    /** ランタイム面（local/preview/production）の検出設定。 */
    runtimeDetector?: RuntimeDetectorConfig;
    /**
     * 書込ON/OFF の検出関数。未指定なら「書込確認中」を出す（fail-closed）。
     *   **信頼済み扱い（安全側集約に入る）は createHealthWriteDetector() が返す TrustedWriteDetector だけ**
     *   （固定 /api/health を GET 観測）。createEnvWriteDetector・生関数・任意コールバックは無検証扱いで、
     *   結果に「無検証」を併記し集約から除外する（v0.5.3・R1-C2）。
     */
    writeDetector?: WriteDetector;
    /**
     * アプリの状態宣言（許可リスト型・TypeScript 経路）。型で businessLive のみに縛られる
     *   ＝本番URL・書込状態を騙る kind はコンパイルエラー（R1-C2-PROP-TYPE-BYPASS）。
     */
    declaredStates?: readonly DeclarableState[];
    /**
     * JS・外部入力境界用の状態宣言。unknown[] を受け、実行時に許可リストへ照合する。
     *   不正な形（本番URL・書込状態を騙る object 等）は拒否してエラー個別表示にする。
     */
    unsafeDeclaredStates?: unknown[];
    /** 状態の説明 details に載せる補助情報（データ接続名・本人確認の状態など・任意）。 */
    detailRows?: Array<{
        label: string;
        value: string;
    }>;
    /**
     * 危険側1枚化（2026-08-27 社長裁定A-2 → 2026-09-01 裁定で**既定ON**へ昇格）:
     *   環境と書込状態が**両方とも機械検出で確定**している時だけ、バッジ群を1枚
     *   （例「本番・書込ON」）へ畳む。fail-closed——確認中・検出失敗・無検証の申告・
     *   申告エラーが1つでもあれば畳まず、従来どおり個別バッジへ自動展開する。
     *   内訳は従来どおり「状態の説明」プルダウンで全部見える。
     *
     *   **既定 `true`**。`compact={false}` を渡すと従来の個別バッジ表示へ戻せる（opt-out）。
     *   既定にできる理由は2つ——①不確定なら自動で個別展開する fail-closed が内側にあり、
     *   1枚化が「見えなくする」方向へ倒れない ②各アプリは core の版をピンで固定しており、
     *   見た目が変わるのは各アプリが版を上げると決めた時点だけ（勝手に本番へ流れ込まない）。
     */
    compact?: boolean;
    className?: string;
}
export declare function MagiStatusSummary({ runtimeDetector, writeDetector, declaredStates, unsafeDeclaredStates, detailRows, compact, className, }: MagiStatusSummaryProps): import("react").JSX.Element;
//# sourceMappingURL=MagiStatusSummary.d.ts.map