import type { MagiDataSource, SheetsSourceConfig } from './types';
/**
 * Sheets を読み書きする MagiDataSource を生成する。
 * spreadsheetId は cfg.spreadsheetId（明示）→ env からの解決の順。
 */
export declare function createSheetsSource(cfg: SheetsSourceConfig): MagiDataSource;
//# sourceMappingURL=sheets.d.ts.map