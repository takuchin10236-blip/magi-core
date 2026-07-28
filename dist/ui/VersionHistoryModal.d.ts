export interface VersionHistoryEntry {
    version: string;
    date: string;
    summary: string;
}
export interface VersionHistoryModalProps {
    entries: VersionHistoryEntry[];
    onClose: () => void;
    /** 見出し。既定「これまでの更新履歴」。 */
    title?: string;
    /** 副題。既定はアプリ名を入れる想定。 */
    subtitle?: string;
}
export declare function VersionHistoryModal({ entries, onClose, title, subtitle, }: VersionHistoryModalProps): import("react").JSX.Element;
//# sourceMappingURL=VersionHistoryModal.d.ts.map