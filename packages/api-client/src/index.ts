/**
 * @vepari/api-client — typed HTTP client for the Vepari backend.
 * All requests go to BACKEND_API_URL; tokens are injected by the
 * auth interceptor. No secrets are stored in this package.
 */

export type { ApiResponse, ApiError, PaginatedResponse } from '@vepari/types';

// ── Client configuration ─────────────────────────────────────────────────────

export interface ApiClientConfig {
  baseUrl: string;
  /** Called to retrieve the current access token (never the secret itself). */
  getAccessToken: () => Promise<string | null>;
  /** Called when a 401 is received so the auth layer can refresh. */
  onUnauthorized: () => Promise<void>;
}

// ── HTTP verb helpers (thin wrappers — business logic lives in features/) ────

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  params?: Record<string, string | number | boolean>;
}

// Placeholder — real implementation wired up inside mobile/src/services/
export type ApiClient = {
  get<T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  put<T>(path: string, body?: unknown): Promise<T>;
  patch<T>(path: string, body?: unknown): Promise<T>;
  del<T>(path: string): Promise<T>;
};

export function createApiClient(_config: ApiClientConfig): ApiClient {
  throw new Error('createApiClient: implement in mobile/src/services/api.ts');
}

// ── Endpoint constants (single source of truth) ───────────────────────────────

export const ENDPOINTS = {
  auth: {
    sendOtp: '/v1/auth/otp/send',
    verifyOtp: '/v1/auth/otp/verify',
    setPin: '/v1/auth/pin',
    refresh: '/v1/auth/refresh',
    logout: '/v1/auth/logout',
  },
  business: {
    create: '/v1/businesses',
    me: '/v1/businesses/me',
    update: '/v1/businesses/me',
  },
  transactions: {
    list: '/v1/transactions',
    create: '/v1/transactions',
    get: (id: string) => `/v1/transactions/${id}`,
  },
  products: {
    list: '/v1/products',
    create: '/v1/products',
    get: (id: string) => `/v1/products/${id}`,
    update: (id: string) => `/v1/products/${id}`,
  },
  contacts: {
    list: '/v1/contacts',
    create: '/v1/contacts',
    get: (id: string) => `/v1/contacts/${id}`,
  },
  ai: {
    voice: '/v1/ai/voice',
    action: '/v1/ai/action',
    approve: (id: string) => `/v1/ai/action/${id}/approve`,
  },
  health: '/health',
} as const;
