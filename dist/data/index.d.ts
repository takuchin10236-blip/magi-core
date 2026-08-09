/**
 * @magi/core/data — データ契約エントリ（v0.1）
 *
 * 公開API:
 *   - 型: Env / AccessUser / LoadResult / WriteResult / WriteReason / SheetValues /
 *         MagiDataSource / SheetsSourceConfig / BatchUpdateEntry / AppEnv / AccessSource
 *   - Sheets: createSheetsSource(cfg)
 *   - 書込ゲート: assertWriteAllowed / assertAllowedUser / writeState
 *   - 同時編集の保存時チェック（楽観ロック・opt-in）: snapshotHash / assertFreshSnapshot /
 *         STALE_SNAPSHOT_MESSAGE / STALE_SNAPSHOT_STATUS / ConcurrencyReason
 *   - アクセス制御（D4・署名検証版）: resolveVerifiedAccessContext / resolveAccessContext /
 *         requireAllowed / requireAdmin / requireSuperAdmin / isLocalDevRequest /
 *         publicDenyReason / AccessDeniedError
 *   - リトライ: withRetry
 *   - env/http ヘルパ: appEnv / isTrue / spreadsheetId / googleConfigPresent /
 *         ApiError / apiError / json / errorJson / apiResponse / readJsonBody
 */
export type { AppEnv, Env, AccessSource, AccessUser, SheetValues, LoadResult, WriteReason, WriteResult, BatchUpdateEntry, MagiDataSource, SheetsSourceConfig, } from './types.js';
export { createSheetsSource, alignBatchGet } from './sheets.js';
export { writeState, assertAllowedUser, assertWriteAllowed } from './writeGuard.js';
export type { WriteState } from './writeGuard.js';
export { snapshotHash, assertFreshSnapshot, STALE_SNAPSHOT_MESSAGE, STALE_SNAPSHOT_STATUS, } from './concurrency.js';
export type { ConcurrencyReason } from './concurrency.js';
export { resolveVerifiedAccessContext, resolveAccessContext, requireAllowed, requireAdmin, requireSuperAdmin, isLocalDevRequest, publicDenyReason, AccessDeniedError, } from './access.js';
export { withRetry } from './withRetry.js';
export type { WithRetryOptions } from './withRetry.js';
export { appEnv, isTrue, spreadsheetId, googleConfigPresent } from './env.js';
export { ApiError, apiError, json, errorJson, apiResponse, readJsonBody, } from './http.js';
//# sourceMappingURL=index.d.ts.map