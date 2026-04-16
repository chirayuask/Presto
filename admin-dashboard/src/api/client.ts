import type { ApiError } from '@/types/api';

const BASE = '/api/v1';

export class ApiRequestError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, payload: ApiError) {
    super(payload.message);
    this.status = status;
    this.code = payload.code;
    this.details = payload.details;
  }
}

export interface ApiResponse<T> {
  data: T;
}

export const api = async <T>(
  path: string,
  init: RequestInit = {},
): Promise<T> => {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers || {}),
    },
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const json = text ? JSON.parse(text) : {};

  if (!res.ok) {
    const err: ApiError = json.error || { code: 'UNKNOWN', message: `HTTP ${res.status}` };
    throw new ApiRequestError(res.status, err);
  }

  return (json as ApiResponse<T>).data;
};

export const apiRaw = async <T>(
  path: string,
  init: RequestInit = {},
): Promise<{ status: number; data: T }> => {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (res.status >= 400 && res.status !== 207 && res.status !== 422) {
    throw new ApiRequestError(res.status, json.error || { code: 'UNKNOWN', message: `HTTP ${res.status}` });
  }
  return { status: res.status, data: json.data as T };
};
