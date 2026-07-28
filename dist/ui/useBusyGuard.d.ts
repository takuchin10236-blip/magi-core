export interface BusyGuard {
    /** 処理中か。ボタンの disabled / LoadingState の出し分けに使う。 */
    busy: boolean;
    /**
     * 処理を1本だけ通す。処理中の再呼び出しは無視して false を返す。
     * 戻り値は「実際に実行したか」。
     */
    run: (task: () => Promise<unknown>) => Promise<boolean>;
}
export declare function useBusyGuard(): BusyGuard;
//# sourceMappingURL=useBusyGuard.d.ts.map