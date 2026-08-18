/** 名簿1行ぶんの内部形。sortOrder は名簿側で未設定なら null（行は捨てない）。 */
export type StaffDirectoryEntry = {
    staffId: string;
    name: string;
    status: string;
    floor: string;
    sortOrder: number | null;
};
export type StaffDirectoryOptions = {
    /** 絞り込むフロア。既定は '2階'（施設運営の全アプリの既定）。 */
    floor?: string;
};
/** 在籍とみなす語彙。ここが唯一の定義で、アプリ側で再定義しない。 */
export declare const STAFF_ACTIVE_STATUSES: readonly ["在籍"];
/**
 * 職員マスタの生データを、指定フロアの在籍者だけへ絞り、名簿の並び順で整列して返す。
 * 並び順が未設定の行は捨てず、末尾に氏名順で並ぶ。
 */
export declare function parseStaffDirectoryRows(rows: unknown[][], options?: StaffDirectoryOptions): StaffDirectoryEntry[];
//# sourceMappingURL=staffDirectory.d.ts.map