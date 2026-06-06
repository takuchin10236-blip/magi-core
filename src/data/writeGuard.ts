/**
 * @magi/core — 書込ゲート（多重 fail-closed）
 *
 * 原本: magi-omutsu-inventory/functions/_shared/writeGuard.ts
 *   writeState / assertWriteAllowed / assertAllowedUser を移植。
 *   ブロック理由は WriteReason（7コード）を正典として型付け。
 *
 * 思想（業務システム保全・規約4 ENV物理ガード）:
 *   書込は「許可される理由が1つも欠けていない」ときだけ通す。
 *   どれか1つでも欠ければ blocks に積み、空でない限り書込を止める（fail-closed）。
 */
import { appEnv, googleConfigPresent, isTrue, spreadsheetId } from './env';
import { apiError } from './http';
import type { AccessUser, Env, WriteReason } from './types';

export type WriteState = {
  allowed: boolean;
  blocks: WriteReason[];
};

export function writeState(env: Env, user: AccessUser, requireAdmin = false): WriteState {
  const blocks: WriteReason[] = [];
  const currentEnv = appEnv(env);

  if (!user.allowed) blocks.push('USER_NOT_ALLOWED');
  if (requireAdmin && !user.admin) blocks.push('ADMIN_REQUIRED');
  if (!isTrue(env.ALLOW_WRITES)) blocks.push('ALLOW_WRITES_FALSE');
  if (currentEnv === 'production' && !isTrue(env.PRODUCTION_WRITE_APPROVED)) {
    blocks.push('PRODUCTION_WRITE_NOT_APPROVED');
  }
  if (currentEnv === 'preview' && !isTrue(env.ALLOW_PREVIEW_WRITES)) {
    blocks.push('PREVIEW_WRITE_NOT_ALLOWED');
  }
  if (!spreadsheetId(env)) blocks.push('SPREADSHEET_ID_MISSING');
  if (!googleConfigPresent(env)) blocks.push('GOOGLE_SERVICE_ACCOUNT_MISSING');

  return {
    allowed: blocks.length === 0,
    blocks,
  };
}

export function assertAllowedUser(user: AccessUser): void {
  if (!user.allowed) {
    throw apiError('AUTH_ERROR', 'このアプリを使う権限がありません。', 403);
  }
}

export function assertWriteAllowed(env: Env, user: AccessUser, requireAdmin = false): void {
  const state = writeState(env, user, requireAdmin);
  if (state.allowed) return;
  // ユーザ起因（権限）なら 403 AUTH_ERROR、それ以外（設定・環境）なら 423 WRITE_BLOCKED。
  const code =
    state.blocks.includes('USER_NOT_ALLOWED') || state.blocks.includes('ADMIN_REQUIRED')
      ? 'AUTH_ERROR'
      : 'WRITE_BLOCKED';
  throw apiError(
    code,
    `書込は許可されていません: ${state.blocks.join(', ')}`,
    code === 'AUTH_ERROR' ? 403 : 423,
  );
}
