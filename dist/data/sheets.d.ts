import type { MagiDataSource, SheetsSourceConfig, SheetValues } from './types';
/**
 * Sheets を読み書きする MagiDataSource を生成する。
 * spreadsheetId は cfg.spreadsheetId（明示）→ env からの解決の順。
 */
export declare function createSheetsSource(cfg: SheetsSourceConfig): MagiDataSource;
/**
 * values:batchGet のレスポンス（valueRanges）を、リクエスト ranges と同じ順序・同じ長さに
 * 並べ替えて返す（index 依存を排除）。
 *
 * Sheets API は各 valueRanges[i].range に実A1表記（例 "席配置!A1:H30"）を返す。
 * これを「シート名」で取り出しキーにし、リクエスト range のシート名と突合する。
 *   - シート名で対応付けるのは、リクエスト "席配置!A:H" と レスポンス "席配置!A1:H30" のように
 *     列・行表記が変わる（API が実データ範囲に丸める）ため。シート名は不変なので安定キーになる。
 *   - 同一シートに複数 range を要求するケースは現状の呼び出しに無いが、その場合に備えて
 *     「同名シートは登場順で順送り」するフォールバックを持つ（キー衝突で取り違えない）。
 * 長さ不一致（valueRanges.length !== ranges.length）は沈黙ズレの兆候として throw する。
 */
export declare function alignBatchGet(ranges: string[], valueRanges: Array<{
    range?: string;
    values?: SheetValues;
}>): SheetValues[];
//# sourceMappingURL=sheets.d.ts.map