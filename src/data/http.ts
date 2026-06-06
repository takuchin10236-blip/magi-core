/**
 * @magi/core — HTTP/エラー基盤（v0.1）
 *
 * 原本: magi-omutsu-inventory/functions/_shared/http.ts
 *   ApiError / apiError / json / errorJson / apiResponse / readJsonBody をそのまま移植。
 */

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(code: string, message: string, status = 500) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

export function json(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, {
    ...init,
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Type': 'application/json; charset=utf-8',
      ...(init?.headers ?? {}),
    },
  });
}

export function errorJson(
  code: string,
  message: string,
  status = 500,
  extra?: Record<string, unknown>,
): Response {
  return json({ success: false, code, message, ...(extra ?? {}) }, { status });
}

export function apiError(code: string, message: string, status = 500): ApiError {
  return new ApiError(code, message, status);
}

export async function apiResponse(handler: () => Promise<Response> | Response): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof ApiError) {
      return errorJson(error.code, error.message, error.status);
    }
    const message = error instanceof Error ? error.message : String(error);
    return errorJson('SERVER_ERROR', message, 500);
  }
}

export async function readJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
