/**
 * @magi/core — アクセス制御（D4修正・必須）
 *
 * 【D4修正: 署名検証版を採用】
 *   原本 = magi-resident-spine/functions/_shared/access.js（検証版）を TS 化して移植。
 *   omutsu access.ts（18行・Cf-Access-Authenticated-User-Email ヘッダを無検証で信用する版）は
 *   不採用。理由: ヘッダ無検証版は preview 等で偽装ヘッダを付ければなりすませる。
 *   resident 版は Cf-Access-Jwt-Assertion を RS256 署名検証（JWKS 30分キャッシュ）し、
 *   aud / iss / exp / nbf まで確認するため fail-closed が物理的に堅い。
 *
 * 提供する関数（resident 版と同名・同義）:
 *   resolveVerifiedAccessContext(request, env) … JWT 署名検証つきの本筋
 *   requireAllowed(request, env)               … 許可必須（同期・ヘッダ payload デコード版）
 *   requireAdmin(request, env)                 … 管理者必須
 *
 * 注意: resolveVerifiedAccessContext は署名検証のため async。requireAllowed/requireAdmin は
 *   resident 原本の同期版（resolveAccessContext ベース）を踏襲する。署名検証つきで強制したい
 *   場合は resolveVerifiedAccessContext を await してから手で判定する（resident と同じ運用）。
 */
import type { AccessUser, Env } from './types';
/**
 * JWT 署名検証つきのアクセス文脈解決（本筋・async）。
 * Cf-Access-Jwt-Assertion を RS256 で検証し aud/iss/exp/nbf まで確認する。
 */
export declare function resolveVerifiedAccessContext(request: Request, env?: Env): Promise<AccessUser>;
/**
 * 同期版のアクセス文脈解決（ヘッダ payload デコード）。
 * requireAllowed / requireAdmin の土台。署名検証つきで強制したい場合は
 * resolveVerifiedAccessContext を使うこと（resident 原本と同じ二段構え）。
 */
export declare function resolveAccessContext(request: Request, env?: Env): AccessUser;
/** アクセス拒否時に投げるエラー（status/code/access を持つ） */
export declare class AccessDeniedError extends Error {
    readonly status = 403;
    readonly code = "ACCESS_DENIED";
    readonly access: AccessUser;
    constructor(access: AccessUser);
}
export declare function requireAllowed(request: Request, env?: Env): AccessUser;
export declare function requireAdmin(request: Request, env?: Env): AccessUser;
export declare function requireSuperAdmin(request: Request, env?: Env): AccessUser;
export declare function isLocalDevRequest(request: Request, env?: Env): boolean;
export declare function publicDenyReason(access: AccessUser | null | undefined, env?: Env): string;
//# sourceMappingURL=access.d.ts.map