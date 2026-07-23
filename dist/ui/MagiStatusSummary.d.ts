import { type DeclarableState, type RuntimeDetectorConfig, type WriteDetector } from './statusDetection';
export interface MagiStatusSummaryProps {
    /** ランタイム面（local/preview/production）の検出設定。 */
    runtimeDetector?: RuntimeDetectorConfig;
    /**
     * 書込ON/OFF の検出関数。未指定なら「書込確認中」を出す（fail-closed）。
     *   Core提供ファクトリ（createEnvWriteDetector / createEndpointWriteDetector）が返す
     *   TrustedWriteDetector を渡すと信頼済み扱い。生関数を渡すと結果は「無検証」併記＋集約除外。
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
    className?: string;
}
export declare function MagiStatusSummary({ runtimeDetector, writeDetector, declaredStates, unsafeDeclaredStates, detailRows, className, }: MagiStatusSummaryProps): import("react").JSX.Element;
//# sourceMappingURL=MagiStatusSummary.d.ts.map