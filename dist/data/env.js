export function appEnv(env) {
    const raw = String(env.APP_ENV || '').trim().toLowerCase();
    if (raw === 'production' || raw === 'prod')
        return 'production';
    if (raw === 'dev' || raw === 'local')
        return 'dev';
    return 'preview';
}
export function isTrue(value) {
    return String(value || '').trim().toLowerCase() === 'true';
}
/**
 * SpreadsheetID を解決する。
 * 優先順: SPREADSHEET_ID → APP_ENV 別（production なら PROD_SPREADSHEET_ID、それ以外は DEV_SPREADSHEET_ID）。
 * createSheetsSource(cfg) に明示の spreadsheetId が渡された場合はそちらが優先（呼び出し側で解決）。
 */
export function spreadsheetId(env) {
    return (env.SPREADSHEET_ID ||
        (appEnv(env) === 'production' ? env.PROD_SPREADSHEET_ID : env.DEV_SPREADSHEET_ID) ||
        '').trim();
}
export function googleConfigPresent(env) {
    return Boolean(env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() && env.GOOGLE_PRIVATE_KEY?.trim());
}
//# sourceMappingURL=env.js.map