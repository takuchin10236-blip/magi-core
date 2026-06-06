export type WithRetryOptions = {
    /** 最大リトライ回数（初回を除く再試行数）。既定2回。 */
    maxRetries?: number;
    /** 初回バックオフ(ms)。既定300ms → 600ms と指数で伸びる。 */
    baseDelayMs?: number;
    /** テスト用の sleep 差し替え（既定は setTimeout）。 */
    sleep?: (ms: number) => Promise<void>;
};
export declare function withRetry<T>(fn: () => Promise<T>, options?: WithRetryOptions): Promise<T>;
//# sourceMappingURL=withRetry.d.ts.map