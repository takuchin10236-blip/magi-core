/**
 * @magi/core — withRetry（新規・最小）
 *
 * v0.1で新規追加する最小リトライ。Sheets API の一時的失敗（429 / 5xx）だけを
 * 最大2回・指数バックオフで再試行する。それ以外（4xx の権限・不正リクエスト等）は
 * 即座に投げ直す（無駄なリトライをしない）。
 *
 * ⚠️ append は冪等でない（同じ追記を2回やると行が重複する）ため、retry の対象外。
 *   createSheetsSource では read / update / batchUpdate / clear / ensureSheet にのみ
 *   withRetry を掛け、append には掛けない（下の createSheetsSource 実装を参照）。
 *
 * 判定は ApiError.status（apiError() が積む HTTP ステータス）を見る。
 *   - 429（レート制限）/ 500..599（サーバ側一時障害）→ retry
 *   - それ以外 → 即 throw
 */
import { ApiError } from './http';
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_BASE_DELAY_MS = 300;
function defaultSleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/** retry 対象の一時的失敗か（429 または 5xx のみ）。 */
function isRetryable(error) {
    if (error instanceof ApiError) {
        return error.status === 429 || (error.status >= 500 && error.status <= 599);
    }
    return false;
}
export async function withRetry(fn, options = {}) {
    const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    const baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
    const sleep = options.sleep ?? defaultSleep;
    let attempt = 0;
    // 初回 + maxRetries 回まで試す。
    for (;;) {
        try {
            return await fn();
        }
        catch (error) {
            if (attempt >= maxRetries || !isRetryable(error))
                throw error;
            // 指数バックオフ: base * 2^attempt（300ms, 600ms, ...）。
            await sleep(baseDelayMs * 2 ** attempt);
            attempt += 1;
        }
    }
}
//# sourceMappingURL=withRetry.js.map