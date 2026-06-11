/**
 * @magi/core/data — データ契約エントリ（v0.1）
 *
 * 公開API:
 *   - 型: Env / AccessUser / LoadResult / WriteResult / WriteReason / SheetValues /
 *         MagiDataSource / SheetsSourceConfig / BatchUpdateEntry / AppEnv / AccessSource
 *   - Sheets: createSheetsSource(cfg)
 *   - 書込ゲート: assertWriteAllowed / assertAllowedUser / writeState
 *   - アクセス制御（D4・署名検証版）: resolveVerifiedAccessContext / resolveAccessContext /
 *         requireAllowed / requireAdmin / requireSuperAdmin / isLocalDevRequest /
 *         publicDenyReason / AccessDeniedError
 *   - リトライ: withRetry
 *   - env/http ヘルパ: appEnv / isTrue / spreadsheetId / googleConfigPresent /
 *         ApiError / apiError / json / errorJson / apiResponse / readJsonBody
 */
export { createSheetsSource, alignBatchGet } from './sheets';
export { writeState, assertAllowedUser, assertWriteAllowed } from './writeGuard';
export { resolveVerifiedAccessContext, resolveAccessContext, requireAllowed, requireAdmin, requireSuperAdmin, isLocalDevRequest, publicDenyReason, AccessDeniedError, } from './access';
export { withRetry } from './withRetry';
export { appEnv, isTrue, spreadsheetId, googleConfigPresent } from './env';
export { ApiError, apiError, json, errorJson, apiResponse, readJsonBody, } from './http';
//# sourceMappingURL=index.js.map