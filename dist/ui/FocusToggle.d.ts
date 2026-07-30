export interface FocusToggleProps {
    /** 現在 focus 表示かどうか。 */
    focusMode: boolean;
    /** 押されたときに呼ばれる（次の状態を渡す）。 */
    onFocusModeChange: (next: boolean) => void;
    /** 文言の差し替え（既定「全画面」/「戻る」）。 */
    enterLabel?: string;
    exitLabel?: string;
    className?: string;
}
export declare function FocusToggle({ focusMode, onFocusModeChange, enterLabel, exitLabel, className, }: FocusToggleProps): import("react").JSX.Element;
//# sourceMappingURL=FocusToggle.d.ts.map