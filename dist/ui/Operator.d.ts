export type OperatorStaff = {
    id: string;
    /** 表示名。アプリ側で名簿の氏名を渡す。 */
    name: string;
};
export interface OperatorChipProps {
    /** 選択済みの操作者名。未選択なら null。 */
    operatorName: string | null;
    onClick: () => void;
    /** 未選択時のラベル。既定「未選択」。 */
    unsetLabel?: string;
    className?: string;
}
export declare function OperatorChip({ operatorName, onClick, unsetLabel, className }: OperatorChipProps): import("react").JSX.Element;
export interface OperatorSelectModalProps {
    open: boolean;
    onClose: () => void;
    onSelect: (staffId: string) => void;
    staff: OperatorStaff[];
    selectedOperatorId: string;
    /** 名簿が空のときの案内。アプリの事情（名簿の取り方）に合わせて差し替え可。 */
    emptyMessage?: string;
    /**
     * 注意文（本人認証ではない旨）を折りたたむ（既定 false ＝ 従来どおり全文を常時表示）。
     *
     * 2026-08-02 社長裁定。毎日何度も開くアプリでは全文が場所を取るため、要旨だけを
     *   常時見せ、詳しい説明は開いて読む形にできるようにした。**opt-in なので
     *   渡さないアプリの見た目は変わらない**。
     *
     * ⚠️ **注意文を消す prop は作らない**（型の要件「本人認証ではないと画面に明示する」は不変）。
     *   畳んだ形でも要旨「これは本人認証ではありません」は summary として常に画面に出る。
     */
    disclaimerCollapsible?: boolean;
}
export declare function OperatorSelectModal({ open, onClose, onSelect, staff, selectedOperatorId, emptyMessage, disclaimerCollapsible, }: OperatorSelectModalProps): import("react").JSX.Element | null;
//# sourceMappingURL=Operator.d.ts.map