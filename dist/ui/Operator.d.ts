export type OperatorStaff = {
    id: string;
    /** 表示名。アプリ側で名簿の氏名を渡す。 */
    name: string;
};
export interface OperatorChipProps {
    /** 選択済みの操作者名。未選択なら null。 */
    operatorName: string | null;
    onClick: () => void;
    /** 未選択時のラベル。既定「未選択」。**従来表示（`fixedWidth={false}`）でのみ使う**。 */
    unsetLabel?: string;
    /**
     * 2026-08-27 社長裁定の表示形（2026-09-01 裁定で**既定ON**へ昇格）:
     *   未選択＝アイコン＋「操作者」（赤枠）／選択済み＝アイコン＋名前だけ（「操作者:」接頭辞なし）。
     *   チップ幅は固定し、収まらない名前は文字を縮小して全文表示する（省略記号にしない）。
     *
     *   **既定 `true`**（幅は CSS の既定に従う）。数値を渡すとその px で幅を固定する。
     *   `fixedWidth={false}` で従来表示（「操作者: 名前」／未選択は `unsetLabel`）へ戻せる（opt-out）。
     *   既定にできる理由は、各アプリが core の版をピンで固定しているため——文言が変わるのは
     *   各アプリが版を上げると決めた時点だけで、その卓が検査文字列も一緒に直せる。
     */
    fixedWidth?: number | boolean;
    className?: string;
}
export declare function OperatorChip({ operatorName, onClick, unsetLabel, fixedWidth, className }: OperatorChipProps): import("react").JSX.Element;
export interface OperatorSelectModalProps {
    open: boolean;
    onClose: () => void;
    onSelect: (staffId: string) => void;
    staff: OperatorStaff[];
    selectedOperatorId: string;
    /** 名簿が空のときの案内。アプリの事情（名簿の取り方）に合わせて差し替え可。 */
    emptyMessage?: string;
}
export declare function OperatorSelectModal({ open, onClose, onSelect, staff, selectedOperatorId, emptyMessage, }: OperatorSelectModalProps): import("react").JSX.Element | null;
//# sourceMappingURL=Operator.d.ts.map