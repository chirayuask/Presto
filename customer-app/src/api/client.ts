const BASE = '/api/v1';

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const api = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(init.headers || {}) },
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const e = json.error ?? { code: 'UNKNOWN', message: `HTTP ${res.status}` };
    throw new ApiError(res.status, e.code, e.message);
  }
  return json.data as T;
};
