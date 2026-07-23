export interface MagiVersionChipProps {
    /** 版文字列（例 '1.3.2' / 'v1.3.2-release'）。ビルド時に注入した単一ソースを渡す。 */
    version: string;
    /** ビルド時刻 ISO 文字列（任意）。あればラベルへ 'M/D HH:MM' を併記。 */
    buildTime?: string;
    /** 開いた時に見せる追加詳細（環境名・コミット等）。 */
    details?: Record<string, string>;
    className?: string;
}
export declare function MagiVersionChip({ version, buildTime, details, className }: MagiVersionChipProps): import("react").JSX.Element;
//# sourceMappingURL=MagiVersionChip.d.ts.map