/**
 * ResidentSelector is a presentation component, not an authorization boundary.
 * The server must return only the residents and tabs that the signed-in operator
 * is allowed to see. Create mode adds a fail-closed UI check for the two explicit
 * server decisions (`createAllowed` and `episodeOpen`) before showing a candidate.
 */
export type ResidentSelectorMode = 'create' | 'search';
export interface ResidentSelectorResident {
    /** Five-digit resident ID. Keep this as a string so leading zeroes are preserved. */
    residentId: string;
    name: string;
    kana: string;
    room?: string;
    episodeId: string;
    spineStatus: string;
    locationUnknown?: boolean;
    /** Server decision. Create mode only shows true; search accepts either boolean value. */
    createAllowed: boolean;
    /** Server decision. Create mode only shows true; search accepts either boolean value. */
    episodeOpen: boolean;
}
export interface ResidentSelectorCreateResident extends ResidentSelectorResident {
    /** B2 create contract requires an explicit boolean, including when the value is false. */
    locationUnknown: boolean;
}
export interface ResidentSelectorCreateData {
    /** Already-authorized candidates in the server's canonical display order. */
    residents: readonly ResidentSelectorCreateResident[];
}
export interface ResidentSelectorTab {
    id: string;
    label: string;
    /** Already-authorized residents in the server's canonical display order. */
    residents: readonly ResidentSelectorResident[];
}
export interface ResidentSelectorSearchData {
    /** Only server-authorized scopes/tabs. The component never invents a scope. */
    tabs: readonly ResidentSelectorTab[];
}
export interface ResidentSelectorLoadContext {
    mode: ResidentSelectorMode;
}
interface ResidentSelectorCommonProps {
    value?: ResidentSelectorResident | null;
    onSelect: (resident: ResidentSelectorResident) => void;
    onClear?: () => void;
    /** Optional sanitized loading state for a parent-managed data source. */
    loading?: boolean;
    /** Optional sanitized error text for a parent-managed data source. */
    error?: string | null;
    /** Called by the retry button when the parent owns loading. */
    onRetry?: () => void;
    /** Receives the original loader error for app-side logging. It is not rendered. */
    onLoadError?: (error: unknown) => void;
    searchLabel?: string;
    emptyMessage?: string;
    className?: string;
    disabled?: boolean;
}
export type ResidentSelectorProps = (ResidentSelectorCommonProps & {
    mode: 'create';
    data?: ResidentSelectorCreateData;
    loadData?: (context: ResidentSelectorLoadContext & {
        mode: 'create';
    }) => Promise<ResidentSelectorCreateData>;
}) | (ResidentSelectorCommonProps & {
    mode: 'search';
    data?: ResidentSelectorSearchData;
    loadData?: (context: ResidentSelectorLoadContext & {
        mode: 'search';
    }) => Promise<ResidentSelectorSearchData>;
});
export declare function ResidentSelector(props: ResidentSelectorProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=ResidentSelector.d.ts.map