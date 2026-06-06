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

const LOCAL_DEV_EMAIL = 'local-dev';
const JWKS_CACHE_TTL_MS = 30 * 60 * 1000;

type Jwk = JsonWebKey & { kid?: string };

type JwksCache = {
  teamDomain: string;
  fetchedAt: number;
  byKid: Map<string, Jwk>;
};

let jwksCache: JwksCache | null = null;

type AllowlistConfig = {
  allowedEmails: Set<string>;
  adminEmails: Set<string>;
  superAdminEmails: Set<string>;
};

function buildAllowlistConfig(env: Env = {}): AllowlistConfig {
  // D4: resident は ACCESS_ALLOWLIST を使う。omutsu 系アプリは ALLOWED_EMAILS を使うため
  //   両方を許容して結合する（@magi/core は汎用ライブラリのため両命名を吸収）。
  const allow = [...parseCsvEmails(env.ACCESS_ALLOWLIST), ...parseCsvEmails(env.ALLOWED_EMAILS)];
  const admins = parseCsvEmails(env.ADMIN_EMAILS);
  const superAdmins = parseCsvEmails(env.SUPER_ADMIN_EMAIL);
  return {
    allowedEmails: new Set(allow),
    adminEmails: new Set(admins),
    superAdminEmails: new Set(superAdmins),
  };
}

/**
 * JWT 署名検証つきのアクセス文脈解決（本筋・async）。
 * Cf-Access-Jwt-Assertion を RS256 で検証し aud/iss/exp/nbf まで確認する。
 */
export async function resolveVerifiedAccessContext(request: Request, env: Env = {}): Promise<AccessUser> {
  if (isLocalDevRequest(request, env)) {
    return {
      allowed: true,
      email: LOCAL_DEV_EMAIL,
      admin: true,
      role: 'local-dev',
      isSuperAdmin: true,
      source: 'local-dev',
    };
  }

  const jwt = request.headers.get('Cf-Access-Jwt-Assertion')?.trim();
  if (!jwt) return denied('missing_access_jwt');

  const teamDomain = normalizeTeamDomain(env.CF_ACCESS_TEAM_DOMAIN || '');
  const expectedAudiences = parseCsv(env.CF_ACCESS_AUD || env.CF_ACCESS_AUD_TAG || '');
  if (!teamDomain || expectedAudiences.length === 0) return denied('access_verifier_not_configured');

  const payload = await verifyAccessJwt(jwt, teamDomain, expectedAudiences).catch((error) => {
    console.error('access_jwt_verify_failed', safeErrorLog(error));
    return null;
  });
  if (!payload) return denied('invalid_access_jwt');

  return buildAccessContext(typeof payload.email === 'string' ? payload.email : '', env);
}

/**
 * 同期版のアクセス文脈解決（ヘッダ payload デコード）。
 * requireAllowed / requireAdmin の土台。署名検証つきで強制したい場合は
 * resolveVerifiedAccessContext を使うこと（resident 原本と同じ二段構え）。
 */
export function resolveAccessContext(request: Request, env: Env = {}): AccessUser {
  if (isLocalDevRequest(request, env)) {
    return {
      allowed: true,
      email: LOCAL_DEV_EMAIL,
      admin: true,
      role: 'local-dev',
      isSuperAdmin: true,
      source: 'local-dev',
    };
  }

  const email = getAccessEmail(request);
  if (!email) return denied('missing_access_email');

  return buildAccessContext(email, env);
}

function buildAccessContext(email: string, env: Env = {}): AccessUser {
  const { allowedEmails, adminEmails, superAdminEmails } = buildAllowlistConfig(env);
  if (allowedEmails.size === 0) return denied('access_allowlist_not_configured', '');

  const normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail || !allowedEmails.has(normalizedEmail)) {
    return denied('access_email_not_allowed', normalizedEmail);
  }
  const isAdmin = adminEmails.has(normalizedEmail);
  return {
    allowed: true,
    email: normalizedEmail,
    admin: isAdmin,
    role: isAdmin ? 'admin' : 'floor',
    isSuperAdmin: superAdminEmails.has(normalizedEmail),
    source: 'cloudflare-access',
  };
}

/** アクセス拒否時に投げるエラー（status/code/access を持つ） */
export class AccessDeniedError extends Error {
  readonly status = 403;
  readonly code = 'ACCESS_DENIED';
  readonly access: AccessUser;
  constructor(access: AccessUser) {
    super('access_denied');
    this.name = 'AccessDeniedError';
    this.access = access;
  }
}

export function requireAllowed(request: Request, env: Env = {}): AccessUser {
  const access = resolveAccessContext(request, env);
  if (!access.allowed) throw new AccessDeniedError(access);
  return access;
}

export function requireAdmin(request: Request, env: Env = {}): AccessUser {
  const access = requireAllowed(request, env);
  if (!access.admin && access.role !== 'local-dev') throw new AccessDeniedError(access);
  return access;
}

export function requireSuperAdmin(request: Request, env: Env = {}): AccessUser {
  const access = requireAllowed(request, env);
  if (!access.isSuperAdmin && access.role !== 'local-dev') throw new AccessDeniedError(access);
  return access;
}

export function isLocalDevRequest(request: Request, env: Env = {}): boolean {
  if (isProductionLikeEnv(env)) return false;
  const { hostname } = new URL(request.url);
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

export function publicDenyReason(access: AccessUser | null | undefined, env: Env = {}): string {
  if (isProductionLikeEnv(env)) return 'access_denied';
  return access?.denyReason || 'access_denied';
}

function isProductionLikeEnv(env: Env = {}): boolean {
  const explicit = String(env.APP_ENV || '').trim().toLowerCase();
  const branch = String(env.CF_PAGES_BRANCH || '').trim().toLowerCase();
  const productionBranch = String(env.PRODUCTION_BRANCH || 'main').trim().toLowerCase();
  if (explicit && explicit !== 'dev' && explicit !== 'local') return true;
  return Boolean(branch && productionBranch && branch === productionBranch);
}

function getAccessEmail(request: Request): string {
  const jwt = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!jwt) return '';
  const [, payload] = jwt.split('.');
  if (!payload) return '';
  try {
    const decodedPayload = JSON.parse(decodeBase64Url(payload)) as { email?: unknown };
    return typeof decodedPayload.email === 'string' ? decodedPayload.email.trim() : '';
  } catch {
    return '';
  }
}

type AccessJwtPayload = {
  email?: unknown;
  exp?: number;
  nbf?: number;
  iss?: string;
  aud?: string | string[];
};

async function verifyAccessJwt(
  jwt: string,
  teamDomain: string,
  expectedAudiences: string[],
): Promise<AccessJwtPayload> {
  const parts = jwt.split('.');
  if (parts.length !== 3) throw new Error('invalid_jwt_shape');

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = JSON.parse(decodeBase64Url(encodedHeader)) as { alg?: string; kid?: string };
  if (header.alg !== 'RS256' || !header.kid) throw new Error('unsupported_jwt_header');

  const jwk = await findAccessJwk(teamDomain, header.kid);
  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const verified = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    base64UrlToBytes(encodedSignature),
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
  );
  if (!verified) throw new Error('invalid_signature');

  const payload = JSON.parse(decodeBase64Url(encodedPayload)) as AccessJwtPayload;
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === 'number' && payload.exp < now) throw new Error('jwt_expired');
  if (typeof payload.nbf === 'number' && payload.nbf > now) throw new Error('jwt_not_before');
  if (payload.iss !== teamDomain) throw new Error('issuer_mismatch');

  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audiences.some((aud) => expectedAudiences.includes(String(aud)))) {
    throw new Error('audience_mismatch');
  }

  return payload;
}

async function findAccessJwk(teamDomain: string, kid: string): Promise<Jwk> {
  const cached = getCachedJwk(teamDomain, kid);
  if (cached) return cached;

  const response = await fetch(`${teamDomain}/cdn-cgi/access/certs`);
  if (!response.ok) throw new Error('jwks_fetch_failed');
  const jwks = (await response.json()) as { keys?: Jwk[] };
  jwksCache = {
    teamDomain,
    fetchedAt: Date.now(),
    byKid: new Map((jwks.keys || []).map((jwk) => [String(jwk.kid), jwk])),
  };
  const jwk = getCachedJwk(teamDomain, kid);
  if (!jwk) throw new Error('jwk_not_found');
  return jwk;
}

function getCachedJwk(teamDomain: string, kid: string): Jwk | null {
  if (!jwksCache || jwksCache.teamDomain !== teamDomain) return null;
  if (Date.now() - jwksCache.fetchedAt > JWKS_CACHE_TTL_MS) return null;
  return jwksCache.byKid.get(kid) || null;
}

function denied(reason: string, email = ''): AccessUser {
  return {
    allowed: false,
    email,
    admin: false,
    role: 'unknown',
    isSuperAdmin: false,
    source: 'cloudflare-access',
    denyReason: reason,
  };
}

function normalizeTeamDomain(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  return trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
}

function parseCsv(value: string | undefined): string[] {
  if (value == null) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseCsvEmails(value: string | undefined): string[] {
  return parseCsv(value).map((email) => email.toLowerCase());
}

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '='));
  // TS6.0系では crypto.subtle.verify の BufferSource が ArrayBuffer 裏付けを要求する。
  // SharedArrayBuffer 互換の Uint8Array.from を避け、ArrayBuffer 裏付けの buffer に明示コピーする。
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function safeErrorLog(error: unknown): { code: string; message: string } {
  const e = error as { code?: string; message?: string } | undefined;
  return {
    code: e?.code || 'ACCESS_VERIFY_ERROR',
    message: error instanceof Error ? error.message : 'unknown_error',
  };
}
