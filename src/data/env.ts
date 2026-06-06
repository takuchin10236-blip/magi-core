/**
 * @magi/core — 環境変数の読み（v0.1）
 *
 * 原本: magi-omutsu-inventory/functions/_shared/env.ts
 *   appEnv / isTrue / spreadsheetId / googleConfigPresent を移植。
 *   allowedEmails / adminEmails は D4（access）側の検証版実装に統合したため
 *   ここでは「書込ゲートと SpreadsheetID 解決」に必要なものだけを置く。
 *
 * 注意: omutsu env.ts は ALLOWED_EMAILS / ADMIN_EMAILS のデフォルト値（施設メール）を
 *   ハードコードしていたが、@magi/core は汎用ライブラリなので施設固有メールは持たない
 *   （採用側アプリが env で注入する）。これは仕様の範囲内の汎用化。
 */
import type { AppEnv, Env } from './types';

export function appEnv(env: Env): AppEnv {
  const raw = String(env.APP_ENV || '').trim().toLowerCase();
  if (raw === 'production' || raw === 'prod') return 'production';
  if (raw === 'dev' || raw === 'local') return 'dev';
  return 'preview';
}

export function isTrue(value: string | undefined): boolean {
  return String(value || '').trim().toLowerCase() === 'true';
}

/**
 * SpreadsheetID を解決する。
 * 優先順: SPREADSHEET_ID → APP_ENV 別（production なら PROD_SPREADSHEET_ID、それ以外は DEV_SPREADSHEET_ID）。
 * createSheetsSource(cfg) に明示の spreadsheetId が渡された場合はそちらが優先（呼び出し側で解決）。
 */
export function spreadsheetId(env: Env): string {
  return (
    env.SPREADSHEET_ID ||
    (appEnv(env) === 'production' ? env.PROD_SPREADSHEET_ID : env.DEV_SPREADSHEET_ID) ||
    ''
  ).trim();
}

export function googleConfigPresent(env: Env): boolean {
  return Boolean(env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() && env.GOOGLE_PRIVATE_KEY?.trim());
}
