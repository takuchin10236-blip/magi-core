export type ResidentDirectoryEntry = {
    residentId: string;
    name: string;
    status: string;
    /** 居室番号（`201-1` のような枝番つき文字列）。名簿側が未入力なら空。 */
    room: string;
};
/** 在籍（入所中）とみなす語彙。ここが唯一の定義で、アプリ側で再定義しない。 */
export declare const RESIDENT_ACTIVE_STATUSES: readonly ["入所中", "転入"];
/**
 * 利用者背骨の生データを、入所中の人だけへ絞り、居室番号の自然順で整列して返す。
 * 居室番号が未入力の行は捨てず、末尾に氏名順で並ぶ。
 */
export declare function parseResidentDirectoryRows(rows: unknown[][]): ResidentDirectoryEntry[];
//# sourceMappingURL=residentDirectory.d.ts.map