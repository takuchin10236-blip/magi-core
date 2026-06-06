/**
 * @magi/core — HTTP/エラー基盤（v0.1）
 *
 * 原本: magi-omutsu-inventory/functions/_shared/http.ts
 *   ApiError / apiError / json / errorJson / apiResponse / readJsonBody をそのまま移植。
 */
export class ApiError extends Error {
    status;
    code;
    constructor(code, message, status = 500) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.status = status;
    }
}
export function json(data, init) {
    return Response.json(data, {
        ...init,
        headers: {
            'Cache-Control': 'private, no-store',
            'Content-Type': 'application/json; charset=utf-8',
            ...(init?.headers ?? {}),
        },
    });
}
export function errorJson(code, message, status = 500, extra) {
    return json({ success: false, code, message, ...(extra ?? {}) }, { status });
}
export function apiError(code, message, status = 500) {
    return new ApiError(code, message, status);
}
export async function apiResponse(handler) {
    try {
        return await handler();
    }
    catch (error) {
        if (error instanceof ApiError) {
            return errorJson(error.code, error.message, error.status);
        }
        const message = error instanceof Error ? error.message : String(error);
        return errorJson('SERVER_ERROR', message, 500);
    }
}
export async function readJsonBody(request) {
    try {
        return (await request.json());
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=http.js.map