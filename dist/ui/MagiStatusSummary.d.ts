import { type RuntimeDetectorConfig } from './statusDetection';
/** 書込ON/OFF の検出関数。真偽値を直接渡す props は設けない（自己申告を型で塞ぐ）。 */
export type WriteDetector = () => boolean | Promise<boolean>;
export interface MagiStatusSummaryProps {
    /** ランタイム面（local/preview/production）の検出設定。 */
    runtimeDetector?: RuntimeDetectorConfig;
    /** 書込ON/OFF の検出関数。未指定なら「書込確認中」を出す（fail-closed）。 */
    writeDetector?: WriteDetector;
    /**
     * アプリの状態宣言（許可リスト型のみ）。unknown[] を受け、実行時に許可リストへ照合する。
     *   不正な形（本番URL・書込状態を騙る object 等）は拒否してエラー個別表示にする。
     */
    declaredStates?: unknown[];
    /** 状態の説明 details に載せる補助情報（データ接続名・本人確認の状態など・任意）。 */
    detailRows?: Array<{
        label: string;
        value: string;
    }>;
    className?: string;
}
export declare function MagiStatusSummary({ runtimeDetector, writeDetector, declaredStates, detailRows, className, }: MagiStatusSummaryProps): import("react").JSX.Element;
//# sourceMappingURL=MagiStatusSummary.d.ts.map