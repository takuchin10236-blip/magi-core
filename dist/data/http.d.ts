/**
 * @magi/core — HTTP/エラー基盤（v0.1）
 *
 * 原本: magi-omutsu-inventory/functions/_shared/http.ts
 *   ApiError / apiError / json / errorJson / apiResponse / readJsonBody をそのまま移植。
 */
export declare class ApiError extends Error {
    readonly status: number;
    readonly code: string;
    constructor(code: string, message: string, status?: number);
}
export declare function json(data: unknown, init?: ResponseInit): Response;
export declare function errorJson(code: string, message: string, status?: number, extra?: Record<string, unknown>): Response;
export declare function apiError(code: string, message: string, status?: number): ApiError;
export declare function apiResponse(handler: () => Promise<Response> | Response): Promise<Response>;
export declare function readJsonBody<T>(request: Request): Promise<T | null>;
//# sourceMappingURL=http.d.ts.map