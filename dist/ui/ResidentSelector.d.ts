export type ResidentSelectorMode = 'search' | 'create';
export interface ResidentSelectorResident {
    residentId: string;
    name: string;
    kana: string;
    room: string;
    episodeId: string;
    spineStatus: string;
    episodeOpen: boolean;
    createAllowed: boolean;
    locationUnknown: boolean;
}
export interface ResidentSelectorProps {
    /** searchは過去利用者を含む検索、createは新規記録作成可能な利用者だけを表示する。 */
    mode: ResidentSelectorMode;
    /** 認可済みB2配列、または { residents: [...] }。不正な形は空配列へ倒す。 */
    data?: unknown;
    /** 親側の読取関数。失敗時は生エラーを出さず候補0件へ倒す。 */
    loadData?: () => Promise<unknown>;
    onSelect: (resident: ResidentSelectorResident) => void;
    selectedResidentId?: string;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}
export declare function normalizeResidentSelectorData(data: unknown): ResidentSelectorResident[];
export declare function filterResidentSelectorCandidates(residents: ResidentSelectorResident[], mode: ResidentSelectorMode, query?: string): ResidentSelectorResident[];
export declare function resolveResidentSelectorLoad(loadData: () => Promise<unknown>): Promise<{
    residents: ResidentSelectorResident[];
    failed: boolean;
}>;
export declare function ResidentSelector({ mode, data, loadData, onSelect, selectedResidentId, label, placeholder, disabled, className, }: ResidentSelectorProps): import("react").JSX.Element;
//# sourceMappingURL=ResidentSelector.d.ts.map