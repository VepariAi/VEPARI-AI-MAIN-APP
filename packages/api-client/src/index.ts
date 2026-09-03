/**
 * @vepari/api-client — typed HTTP client for the Vepari AI backend.
 * Used by the mobile app. Never stores secrets; auth tokens stored by caller.
 */

import type { ApiResponse, ApiError, AuthTokens, User, Business } from '@vepari/types';

// ── Endpoints ────────────────────────────────────────────────────────────────

export const ENDPOINTS = {
  auth: {
    sendOtp: '/auth/otp/send',
    register: '/auth/register',
    login: '/auth/login',
    refresh: '/auth/token/refresh',
    logout: '/auth/logout',
  },
  users: {
    me: '/users/me',
    byId: (id: string) => `/users/${id}`,
  },
  businesses: {
    create: '/businesses',
    list: '/businesses',
    byId: (id: string) => `/businesses/${id}`,
    dashboard: (id: string) => `/businesses/${id}/dashboard`,
  },
  customers: {
    list: (bizId: string) => `/businesses/${bizId}/customers`,
    create: (bizId: string) => `/businesses/${bizId}/customers`,
    byId: (bizId: string, id: string) => `/businesses/${bizId}/customers/${id}`,
  },
  suppliers: {
    list: (bizId: string) => `/businesses/${bizId}/suppliers`,
    create: (bizId: string) => `/businesses/${bizId}/suppliers`,
  },
  transactions: {
    list: (bizId: string) => `/businesses/${bizId}/transactions`,
    create: (bizId: string) => `/businesses/${bizId}/transactions`,
  },
  sales: {
    create: (bizId: string) => `/businesses/${bizId}/sales`,
    list: (bizId: string) => `/businesses/${bizId}/sales`,
  },
  expenses: {
    create: (bizId: string) => `/businesses/${bizId}/expenses`,
    list: (bizId: string) => `/businesses/${bizId}/expenses`,
  },
  products: {
    list: (bizId: string) => `/businesses/${bizId}/products`,
    create: (bizId: string) => `/businesses/${bizId}/products`,
  },
  voice: {
    stt: '/voice/stt',
    tts: '/voice/tts',
  },
  ai: {
    memoryExtract: '/ai/memory/extract',
  },
  salesForBiz: (bizId: string) => `/businesses/${bizId}/sales`,
  salesTodayTotal: (bizId: string) => `/businesses/${bizId}/sales/today-total`,
} as const;

// ── Client config ─────────────────────────────────────────────────────────────

export interface ApiClientConfig {
  baseUrl: string;
  getAccessToken: () => string | null;
  onUnauthorized: () => void;
}

// ── Error types ───────────────────────────────────────────────────────────────

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

// ── HTTP client ───────────────────────────────────────────────────────────────

export class VepariApiClient {
  private baseUrl: string;
  private getAccessToken: () => string | null;
  private onUnauthorized: () => void;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.getAccessToken = config.getAccessToken;
    this.onUnauthorized = config.onUnauthorized;
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    path: string,
    body?: unknown,
    requiresAuth = true,
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (requiresAuth) {
      const token = this.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const fetchInit: RequestInit = { method, headers };
    if (body !== undefined) {
      fetchInit.body = JSON.stringify(body);
    }
    const response = await fetch(`${this.baseUrl}/v1${path}`, fetchInit);

    if (response.status === 401) {
      this.onUnauthorized();
      throw new ApiClientError('UNAUTHORIZED', 'Session expired. Please log in again.', 401);
    }

    let data: ApiResponse<T> | ApiError;
    try {
      data = await response.json() as ApiResponse<T> | ApiError;
    } catch {
      throw new ApiClientError('PARSE_ERROR', 'Invalid response from server', response.status);
    }

    if (!response.ok) {
      const err = data as ApiError;
      throw new ApiClientError(
        err.error?.code ?? 'SERVER_ERROR',
        err.error?.message ?? 'An error occurred',
        response.status,
      );
    }

    return (data as ApiResponse<T>).data;
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  async sendOtp(phone: string, purpose: 'LOGIN' | 'REGISTER' | 'CHANGE_PHONE') {
    return this.request<{ message: string }>('POST', ENDPOINTS.auth.sendOtp, { phone, purpose }, false);
  }

  async register(phone: string, code: string, name: string) {
    return this.request<{ user: User; tokens: AuthTokens }>(
      'POST', ENDPOINTS.auth.register, { phone, code, name }, false,
    );
  }

  async login(phone: string, code: string) {
    return this.request<{ user: User; tokens: AuthTokens }>(
      'POST', ENDPOINTS.auth.login, { phone, code }, false,
    );
  }

  async refreshToken(refreshToken: string) {
    return this.request<AuthTokens>(
      'POST', ENDPOINTS.auth.refresh, { refreshToken }, false,
    );
  }

  async logout(refreshToken: string) {
    return this.request<void>('POST', ENDPOINTS.auth.logout, { refreshToken });
  }

  // ── Users ─────────────────────────────────────────────────────────────────

  async getMe() {
    return this.request<User>('GET', ENDPOINTS.users.me);
  }

  async updateMe(data: { name?: string; language?: string }) {
    return this.request<User>('PATCH', ENDPOINTS.users.me, data);
  }

  // ── Businesses ────────────────────────────────────────────────────────────

  async createBusiness(data: { name: string; type?: string; phone: string; gstNumber?: string }) {
    return this.request<Business>('POST', ENDPOINTS.businesses.create, data);
  }

  async getMyBusinesses() {
    return this.request<Business[]>('GET', ENDPOINTS.businesses.list);
  }

  async getBusiness(id: string) {
    return this.request<Business>('GET', ENDPOINTS.businesses.byId(id));
  }

  async getBusinessDashboard(id: string) {
    return this.request<{
      today: { salesInPaise: number; expensesInPaise: number; profitInPaise: number };
      credit: { receivableInPaise: number; payableInPaise: number };
    }>('GET', ENDPOINTS.businesses.dashboard(id));
  }

  // ── Voice (AI Gateway — Sarvam STT/TTS, server-side only) ────────────────────

  async transcribe(audioBase64: string, languageCode?: string) {
    return this.request<{ transcript: string; languageCode: string; confidence?: number }>(
      'POST', ENDPOINTS.voice.stt, { audioBase64, languageCode },
    );
  }

  async synthesise(text: string, languageCode?: string) {
    return this.request<{ audioBase64: string; durationSeconds: number }>(
      'POST', ENDPOINTS.voice.tts, { text, languageCode },
    );
  }

  // ── Sales ─────────────────────────────────────────────────────────────────

  async createSale(businessId: string, data: {
    items: Array<{ productId?: string; description: string; quantity: number; unitPriceInPaise: number }>;
    customerId?: string;
    paymentMethod?: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT';
    notes?: string;
    totalInPaise?: number;
    date?: string;
  }) {
    return this.request<{
      id: string;
      totalInPaise: number;
      date: string;
      itemCount: number;
      paymentMethod: string;
    }>('POST', ENDPOINTS.salesForBiz(businessId), data);
  }

  async listSales(businessId: string, limit = 50, offset = 0) {
    return this.request<Array<{
      id: string;
      totalInPaise: number;
      date: string;
      itemCount: number;
      paymentMethod: string;
      notes: string | null;
    }>>('GET', `${ENDPOINTS.salesForBiz(businessId)}?limit=${limit}&offset=${offset}`);
  }

  async getSalesTodayTotal(businessId: string) {
    return this.request<number>('GET', ENDPOINTS.salesTodayTotal(businessId));
  }

  // ── AI (Memory extraction via AI Gateway) ────────────────────────────────

  async extractMemoryCandidates(transcript: string) {
    return this.request<Array<{
      type: 'sale' | 'expense' | 'credit_given' | 'credit_received' | 'stock_update' | 'customer_note' | 'supplier_note' | 'unknown';
      amountPaise?: number;
      description?: string;
      party?: string;
      itemName?: string;
      quantity?: number;
      rawTranscript: string;
      confidence: number;
    }>>('POST', ENDPOINTS.ai.memoryExtract, { transcript });
  }

// ── Generic helpers ───────────────────────────────────────────────────────

  get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

let _client: VepariApiClient | null = null;

export function initApiClient(config: ApiClientConfig): VepariApiClient {
  _client = new VepariApiClient(config);
  return _client;
}

export function getApiClient(): VepariApiClient {
  if (!_client) {
    throw new Error('API client not initialized. Call initApiClient() first.');
  }
  return _client;
}
