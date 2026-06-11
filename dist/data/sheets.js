/**
 * @magi/core — Sheets データソース実装（createSheetsSource）
 *
 * 原本: magi-omutsu-inventory/functions/_shared/google.ts
 *   Sheets 値の読書き（read/update/append/batchUpdate/clear/ensureSheet）＋
 *   サービスアカウント JWT 自己署名（WebCrypto RS256）＋ token メモリキャッシュ。
 *
 * 【D1修正: RAW固定】
 *   omutsu 原本は書込の valueInputOption に USER_ENTERED を使っていたが、ここでは RAW に統一する。
 *   理由: USER_ENTERED は「ユーザが手入力した値」として Sheets 側が型推論し、
 *     "007" の先頭ゼロ落ち・"2026-06-05" の日付シリアル化（数値化）事故を招く。
 *     resident / staff は RAW で安定運用しており、それに合わせる。
 *     （2026-06-05 resident 事故の横展開・先頭ゼロ落ち/日付シリアル化の根絶）
 *   対象: updateRange / appendValues / batchUpdateValues の3つ全て。
 *
 * リトライ方針（withRetry）:
 *   read / update / batchUpdate / clear / ensureSheet … 429/5xx を最大2回リトライ。
 *   append … 冪等でない（再試行で行が重複しうる）ため withRetry を掛けない。
 */
import { spreadsheetId as resolveSpreadsheetIdFromEnv } from './env';
import { apiError } from './http';
import { withRetry } from './withRetry';
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
// token はモジュールスコープでメモリキャッシュ（omutsu 原本と同じ。Worker isolate 内で共有）。
let cachedToken = null;
/**
 * Sheets を読み書きする MagiDataSource を生成する。
 * spreadsheetId は cfg.spreadsheetId（明示）→ env からの解決の順。
 */
export function createSheetsSource(cfg) {
    const { env } = cfg;
    const resolvedId = (cfg.spreadsheetId || resolveSpreadsheetIdFromEnv(env) || '').trim();
    function spreadsheetId() {
        if (!resolvedId)
            throw apiError('CONFIG_ERROR', 'スプレッドシートIDが未設定です。', 500);
        return resolvedId;
    }
    function sheetsUrl(path) {
        return `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId()}${path}`;
    }
    async function read(range) {
        const url = sheetsUrl(`/values/${encodeURIComponent(range)}`);
        const data = await withRetry(() => googleJson(env, url));
        return {
            values: data.values ?? [],
            storage: 'sheets',
            readAt: new Date().toISOString(),
        };
    }
    // 複数 range を 1リクエスト（values:batchGet・GETのみ）でまとめ読みする（v0.3.3 追加）。
    // 戻りは引数 ranges と同じ順序・同じ長さ（該当 range が空なら []）。
    // 目的: 読取APIのリクエスト数削減（SA単位の読取クォータ節約）。書込ゼロ。
    async function batchRead(ranges) {
        if (ranges.length === 0)
            return [];
        const query = ranges.map((range) => `ranges=${encodeURIComponent(range)}`).join('&');
        const url = sheetsUrl(`/values:batchGet?${query}`);
        const data = await withRetry(() => googleJson(env, url));
        const valueRanges = data.valueRanges ?? [];
        // valueRanges は Sheets API がリクエスト ranges 順を保証する。長さを ranges に揃えて返す。
        return ranges.map((_, index) => valueRanges[index]?.values ?? []);
    }
    async function update(range, values) {
        // D1修正: RAW固定（旧 USER_ENTERED）。
        const url = sheetsUrl(`/values/${encodeURIComponent(range)}?valueInputOption=RAW`);
        await withRetry(() => googleJson(env, url, { method: 'PUT', body: JSON.stringify({ values }) }));
    }
    async function append(range, values) {
        if (values.length === 0)
            return;
        // D1修正: RAW固定（旧 USER_ENTERED）。
        // 注意: append は冪等でないので withRetry を掛けない（再試行で行重複の恐れ）。
        const url = sheetsUrl(`/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`);
        await googleJson(env, url, { method: 'POST', body: JSON.stringify({ values }) });
    }
    async function batchUpdate(data) {
        if (data.length === 0)
            return;
        const url = sheetsUrl('/values:batchUpdate');
        // D1修正: RAW固定（旧 USER_ENTERED）。
        await withRetry(() => googleJson(env, url, {
            method: 'POST',
            body: JSON.stringify({ valueInputOption: 'RAW', data }),
        }));
    }
    async function clear(range) {
        const url = sheetsUrl(`/values/${encodeURIComponent(range)}:clear`);
        await withRetry(() => googleJson(env, url, { method: 'POST', body: JSON.stringify({}) }));
    }
    async function ensureSheet(title) {
        const meta = await withRetry(() => spreadsheetMeta(env, spreadsheetId()));
        if (meta.sheets?.some((sheet) => sheet.properties?.title === title))
            return;
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId()}:batchUpdate`;
        await withRetry(() => googleJson(env, url, {
            method: 'POST',
            body: JSON.stringify({ requests: [{ addSheet: { properties: { title } } }] }),
        }));
    }
    return { read, batchRead, update, append, batchUpdate, clear, ensureSheet };
}
async function spreadsheetMeta(env, id) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${id}?fields=sheets.properties(sheetId,title)`;
    return googleJson(env, url);
}
async function googleJson(env, url, init) {
    const token = await getServiceAccountToken(env);
    const response = await fetch(url, {
        ...init,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...(init?.headers ?? {}),
        },
    });
    if (!response.ok) {
        const text = await response.text();
        throw apiError('SHEETS_API_ERROR', `Sheets API error (${response.status}): ${text.slice(0, 300)}`, 
        // status をそのまま載せ、withRetry が 429/5xx を判定できるようにする
        // （omutsu 原本は一律 502 にしていたが、ここでは生 status を保持して retry 判定に使う）。
        response.status);
    }
    return (await response.json().catch(() => ({})));
}
async function getServiceAccountToken(env) {
    const email = env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
    const privateKey = env.GOOGLE_PRIVATE_KEY?.trim();
    if (!email || !privateKey) {
        throw apiError('CONFIG_ERROR', 'Google service account env is not configured.', 500);
    }
    if (cachedToken && cachedToken.email === email && cachedToken.expiresAt > Date.now() + 60_000) {
        return cachedToken.token;
    }
    const now = Math.floor(Date.now() / 1000);
    const assertion = await signJwt({ alg: 'RS256', typ: 'JWT' }, {
        iss: email,
        scope: SHEETS_SCOPE,
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
    }, privateKey);
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion,
        }),
    });
    if (!response.ok) {
        const text = await response.text();
        throw apiError('GOOGLE_TOKEN_ERROR', `Google token request failed (${response.status}): ${text.slice(0, 300)}`, 502);
    }
    const data = (await response.json());
    if (!data.access_token) {
        throw apiError('GOOGLE_TOKEN_ERROR', 'Google token response did not include access_token.', 502);
    }
    cachedToken = {
        email,
        token: data.access_token,
        expiresAt: Date.now() + Math.max(60, data.expires_in ?? 3600) * 1000,
    };
    return cachedToken.token;
}
async function signJwt(header, payload, privateKey) {
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const key = await crypto.subtle.importKey('pkcs8', pemToArrayBuffer(privateKey), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput));
    return `${signingInput}.${base64UrlEncode(signature)}`;
}
function pemToArrayBuffer(pem) {
    const normalized = pem.replace(/\\n/g, '\n');
    const body = normalized
        .replace('-----BEGIN PRIVATE KEY-----', '')
        .replace('-----END PRIVATE KEY-----', '')
        .replace(/\s/g, '');
    const binary = atob(body);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }
    return bytes.buffer;
}
function base64UrlEncode(input) {
    const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
    let binary = '';
    for (const byte of bytes)
        binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
//# sourceMappingURL=sheets.js.map