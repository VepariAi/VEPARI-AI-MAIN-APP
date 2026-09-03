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
    credit: (bizId: string, id: string) => `/businesses/${bizId}/customers/${id}/credit`,
  },
  suppliers: {
    list: (bizId: string) => `/businesses/${bizId}/suppliers`,
    create: (bizId: string) => `/businesses/${bizId}/suppliers`,
    byId: (bizId: string, id: string) => `/businesses/${bizId}/suppliers/${id}`,
    payable: (bizId: string, supplierId: string) => `/businesses/${bizId}/suppliers/${supplierId}/payable`,
  },
  transactions: {
    list: (bizId: string) => `/businesses/${bizId}/transactions`,
    create: (bizId: string) => `/businesses/${bizId}/transactions`,
  },
  payments: {
    list: (bizId: string) => `/businesses/${bizId}/payments`,
    create: (bizId: string) => `/businesses/${bizId}/payments`,
    byId: (bizId: string, id: string) => `/businesses/${bizId}/payments/${id}`,
  },
  sales: {
    create: (bizId: string) => `/businesses/${bizId}/sales`,
    list: (bizId: string) => `/businesses/${bizId}/sales`,
    byId: (bizId: string, id: string) => `/businesses/${bizId}/sales/${id}`,
    todayTotal: (bizId: string) => `/businesses/${bizId}/sales/today-total`,
  },
  expenses: {
    create: (bizId: string) => `/businesses/${bizId}/expenses`,
    list: (bizId: string) => `/businesses/${bizId}/expenses`,
    byId: (bizId: string, id: string) => `/businesses/${bizId}/expenses/${id}`,
    todayTotal: (bizId: string) => `/businesses/${bizId}/expenses/today-total`,
  },
  products: {
    list: (bizId: string) => `/businesses/${bizId}/products`,
    create: (bizId: string) => `/businesses/${bizId}/products`,
    byId: (bizId: string, id: string) => `/businesses/${bizId}/products/${id}`,
  },
  voice: {
    stt: '/voice/stt',
    tts: '/voice/tts',
  },
  ai: {
    memoryExtract: '/ai/memory/extract',
    chat: '/ai/chat',
  },
  salesForBiz: (bizId: string) => `/businesses/${bizId}/sales`,
  salesTodayTotal: (bizId: string) => `/businesses/${bizId}/sales/today-total`,
  purchases: {
    create: (bizId: string) => `/businesses/${bizId}/purchases`,
    list: (bizId: string) => `/businesses/${bizId}/purchases`,
    byId: (bizId: string, id: string) => `/businesses/${bizId}/purchases/${id}`,
  },
  analytics: {
    snapshot: (bizId: string) => `/businesses/${bizId}/analytics/snapshot`,
    healthScore: (bizId: string) => `/businesses/${bizId}/analytics/health-score`,
    insights: (bizId: string) => `/businesses/${bizId}/analytics/insights`,
    briefing: (bizId: string) => `/businesses/${bizId}/analytics/briefing`,
  },
  finance: {
    profitToday: (bizId: string) => `/businesses/${bizId}/finance/profit/today`,
    profitWeek: (bizId: string) => `/businesses/${bizId}/finance/profit/week`,
    profitMonth: (bizId: string) => `/businesses/${bizId}/finance/profit/month`,
    profitSeries: (bizId: string) => `/businesses/${bizId}/finance/profit/series`,
    cashFlowToday: (bizId: string) => `/businesses/${bizId}/finance/cashflow/today`,
    cashFlowMonth: (bizId: string) => `/businesses/${bizId}/finance/cashflow/month`,
    receivablesPayables: (bizId: string) => `/businesses/${bizId}/finance/receivables-payables`,
  },
  team: {
    list: (bizId: string) => `/businesses/${bizId}/team`,
    invite: (bizId: string) => `/businesses/${bizId}/team/invite`,
    updateRole: (bizId: string, memberId: string) => `/businesses/${bizId}/team/${memberId}/role`,
    remove: (bizId: string, memberId: string) => `/businesses/${bizId}/team/${memberId}`,
  },
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

  async updateBusiness(id: string, data: { name?: string; phone?: string; gstNumber?: string; type?: string }) {
    return this.request<Business>('PATCH', ENDPOINTS.businesses.byId(id), data);
  }

  async getBusinessDashboard(id: string) {
    return this.request<{
      today: { salesInPaise: number; expensesInPaise: number; profitInPaise: number };
      credit: { receivableInPaise: number; payableInPaise: number };
    }>('GET', ENDPOINTS.businesses.dashboard(id));
  }

  // ── Customers ─────────────────────────────────────────────────────────────

  async listCustomers(businessId: string) {
    return this.request<Array<{
      id: string;
      name: string;
      phone: string | null;
      email: string | null;
      creditBalance: number;
      isActive: boolean;
    }>>('GET', ENDPOINTS.customers.list(businessId));
  }

  async createCustomer(businessId: string, data: { name: string; phone?: string; email?: string; notes?: string }) {
    return this.request<{ id: string; name: string; phone: string | null; creditBalance: number }>(
      'POST', ENDPOINTS.customers.create(businessId), data,
    );
  }

  async getCustomerById(businessId: string, customerId: string) {
    return this.request<{
      id: string;
      name: string;
      phone: string | null;
      email: string | null;
      creditBalance: number;
      notes: string | null;
      isActive: boolean;
    }>('GET', ENDPOINTS.customers.byId(businessId, customerId));
  }

  async adjustCustomerCredit(businessId: string, customerId: string, amountInPaise: number, description?: string) {
    return this.request<{ id: string; creditBalance: number }>(
      'PATCH', ENDPOINTS.customers.credit(businessId, customerId), { amountInPaise, description },
    );
  }

  async updateCustomer(businessId: string, customerId: string, data: { name?: string; phone?: string; email?: string; notes?: string }) {
    return this.request<{
      id: string;
      name: string;
      phone: string | null;
      email: string | null;
      creditBalance: number;
      notes: string | null;
      isActive: boolean;
    }>('PATCH', ENDPOINTS.customers.byId(businessId, customerId), data);
  }

  // ── Suppliers ─────────────────────────────────────────────────────────────

  async listSuppliers(businessId: string) {
    return this.request<Array<{
      id: string;
      name: string;
      phone: string | null;
      email: string | null;
      payableBalance: number;
      isActive: boolean;
    }>>('GET', ENDPOINTS.suppliers.list(businessId));
  }

  async createSupplier(businessId: string, data: { name: string; phone?: string; email?: string; notes?: string }) {
    return this.request<{ id: string; name: string; phone: string | null; payableBalance: number }>(
      'POST', ENDPOINTS.suppliers.create(businessId), data,
    );
  }

  async getSupplierById(businessId: string, supplierId: string) {
    return this.request<{
      id: string;
      name: string;
      phone: string | null;
      email: string | null;
      payableBalance: number;
      notes: string | null;
      isActive: boolean;
    }>('GET', ENDPOINTS.suppliers.byId(businessId, supplierId));
  }

  async updateSupplier(businessId: string, supplierId: string, data: { name?: string; phone?: string; email?: string; notes?: string }) {
    return this.request<{
      id: string;
      name: string;
      phone: string | null;
      email: string | null;
      payableBalance: number;
      notes: string | null;
      isActive: boolean;
    }>('PATCH', ENDPOINTS.suppliers.byId(businessId, supplierId), data);
  }

  async listPurchases(businessId: string, options?: { limit?: number; offset?: number; supplierId?: string }) {
    const { limit = 50, offset = 0, supplierId } = options ?? {};
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (supplierId) params.set('supplierId', supplierId);
    return this.request<Array<{
      id: string;
      supplierId: string | null;
      supplierName: string | null;
      totalInPaise: number;
      paymentMethod: string;
      notes: string | null;
      date: string;
      itemCount: number;
    }>>('GET', `${ENDPOINTS.purchases.list(businessId)}?${params.toString()}`);
  }

  async adjustSupplierPayable(
    businessId: string,
    supplierId: string,
    amountInPaise: number,
    description?: string,
    paymentMethod?: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT',
  ) {
    return this.request<{
      id: string;
      name: string;
      payableBalance: number;
    }>('PATCH', ENDPOINTS.suppliers.payable(businessId, supplierId), {
      amountInPaise,
      ...(description ? { description } : {}),
      ...(paymentMethod ? { paymentMethod } : {}),
    });
  }

  // ── Payments ─────────────────────────────────────────────────────────────────

  async listPayments(businessId: string, options?: { limit?: number; offset?: number; customerId?: string; supplierId?: string }) {
    const { limit = 50, offset = 0, customerId, supplierId } = options ?? {};
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (customerId) params.set('customerId', customerId);
    if (supplierId) params.set('supplierId', supplierId);
    return this.request<Array<{
      id: string;
      type: string;
      amountInPaise: number;
      paymentMethod: string;
      customerId: string | null;
      customerName: string | null;
      supplierId: string | null;
      supplierName: string | null;
      description: string | null;
      notes: string | null;
      date: string;
      createdAt: string;
    }>>('GET', `${ENDPOINTS.payments.list(businessId)}?${params.toString()}`);
  }

  async getPaymentById(businessId: string, paymentId: string) {
    return this.request<{
      id: string;
      type: string;
      amountInPaise: number;
      paymentMethod: string;
      customerId: string | null;
      customerName: string | null;
      supplierId: string | null;
      supplierName: string | null;
      description: string | null;
      notes: string | null;
      date: string;
      createdAt: string;
    }>('GET', ENDPOINTS.payments.byId(businessId, paymentId));
  }

  async recordPayment(businessId: string, data: {
    amountInPaise: number;
    paymentMethod?: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT';
    customerId?: string;
    supplierId?: string;
    description?: string;
    notes?: string;
    date?: string;
  }) {
    return this.request<{ id: string; amountInPaise: number; type: string; date: string }>(
      'POST', ENDPOINTS.payments.create(businessId), data,
    );
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

  async listSales(businessId: string, options?: { limit?: number; offset?: number; customerId?: string }) {
    const { limit = 50, offset = 0, customerId } = options ?? {};
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (customerId) params.set('customerId', customerId);
    return this.request<Array<{
      id: string;
      totalInPaise: number;
      date: string;
      itemCount: number;
      paymentMethod: string;
      notes: string | null;
    }>>('GET', `${ENDPOINTS.salesForBiz(businessId)}?${params.toString()}`);
  }

  async getSalesTodayTotal(businessId: string) {
    return this.request<number>('GET', ENDPOINTS.salesTodayTotal(businessId));
  }

  async getSaleById(businessId: string, saleId: string) {
    return this.request<{
      id: string;
      businessId: string;
      customerId: string | null;
      customerName: string | null;
      totalInPaise: number;
      taxInPaise: number;
      discountInPaise: number;
      paymentMethod: string;
      status: string;
      notes: string | null;
      date: string;
      createdAt: string;
      itemCount: number;
      items: Array<{
        id: string;
        productId: string;
        productName: string;
        quantity: number;
        unitPriceInPaise: number;
        totalInPaise: number;
      }>;
    }>('GET', ENDPOINTS.sales.byId(businessId, saleId));
  }

  // ── Finance / Profit ─────────────────────────────────────────────────────

  private profitRequest(path: string) {
    return this.request<{
      salesInPaise: number;
      expensesInPaise: number;
      profitInPaise: number;
      grossMarginBps: number;
      periodStart: string;
      periodEnd: string;
    }>('GET', path);
  }

  async listTransactions(businessId: string, limit = 50, offset = 0) {
    return this.request<Array<{
      id: string;
      type: 'SALE' | 'EXPENSE' | 'PURCHASE' | 'PAYMENT_IN' | 'PAYMENT_OUT' | 'CREDIT_GIVEN' | 'CREDIT_RECEIVED' | 'ADJUSTMENT';
      amountInPaise: number;
      description: string | null;
      date: string;
      paymentMethod: string;
      referenceId: string | null;
    }>>('GET', `${ENDPOINTS.transactions.list(businessId)}?limit=${limit}&offset=${offset}`);
  }

  getProfitToday(businessId: string) { return this.profitRequest(ENDPOINTS.finance.profitToday(businessId)); }
  getProfitWeek(businessId: string) { return this.profitRequest(ENDPOINTS.finance.profitWeek(businessId)); }
  getProfitMonth(businessId: string) { return this.profitRequest(ENDPOINTS.finance.profitMonth(businessId)); }

  getCashFlowToday(businessId: string) {
    return this.request<{
      cashInflowInPaise: number;
      cashOutflowInPaise: number;
      netCashFlowInPaise: number;
      periodStart: string;
      periodEnd: string;
    }>('GET', ENDPOINTS.finance.cashFlowToday(businessId));
  }

  getCashFlowMonth(businessId: string) {
    return this.request<{
      cashInflowInPaise: number;
      cashOutflowInPaise: number;
      netCashFlowInPaise: number;
      periodStart: string;
      periodEnd: string;
    }>('GET', ENDPOINTS.finance.cashFlowMonth(businessId));
  }

  getReceivablesPayables(businessId: string) {
    return this.request<{
      totalReceivablesInPaise: number;
      totalPayablesInPaise: number;
      customersWithBalance: number;
      suppliersWithBalance: number;
    }>('GET', ENDPOINTS.finance.receivablesPayables(businessId));
  }

  getProfitSeries(businessId: string, days = 30) {
    return this.request<Array<{
      date: string;
      salesInPaise: number;
      expensesInPaise: number;
      profitInPaise: number;
      grossMarginBps: number;
    }>>('GET', `${ENDPOINTS.finance.profitSeries(businessId)}?days=${days}`);
  }

  // ── Expenses ──────────────────────────────────────────────────────────────

  async createExpense(businessId: string, data: {
    category: string;
    amountInPaise: number;
    description?: string;
    notes?: string;
    paymentMethod?: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT';
    date?: string;
  }) {
    return this.request<{
      id: string;
      category: string;
      amountInPaise: number;
      description: string | null;
      paymentMethod: string;
      date: string;
    }>('POST', ENDPOINTS.expenses.create(businessId), data);
  }

  async listExpenses(businessId: string, limit = 50, offset = 0) {
    return this.request<Array<{
      id: string;
      category: string;
      amountInPaise: number;
      description: string | null;
      notes: string | null;
      paymentMethod: string;
      date: string;
    }>>('GET', `${ENDPOINTS.expenses.list(businessId)}?limit=${limit}&offset=${offset}`);
  }

  async getExpensesTodayTotal(businessId: string) {
    return this.request<number>('GET', ENDPOINTS.expenses.todayTotal(businessId));
  }

  async getExpenseById(businessId: string, expenseId: string) {
    return this.request<{
      id: string;
      businessId: string;
      category: string;
      amountInPaise: number;
      description: string | null;
      notes: string | null;
      paymentMethod: string;
      date: string;
      createdAt: string;
    }>('GET', ENDPOINTS.expenses.byId(businessId, expenseId));
  }

  async getPurchaseById(businessId: string, purchaseId: string) {
    return this.request<{
      id: string;
      businessId: string;
      supplierId: string | null;
      supplierName: string | null;
      totalInPaise: number;
      paymentMethod: string;
      status: string;
      notes: string | null;
      date: string;
      createdAt: string;
      itemCount: number;
      items: Array<{
        id: string;
        productId: string;
        productName: string;
        quantity: number;
        unitCostInPaise: number;
        totalInPaise: number;
      }>;
    }>('GET', ENDPOINTS.purchases.byId(businessId, purchaseId));
  }

  // ── Products ──────────────────────────────────────────────────────────────

  async createProduct(businessId: string, data: {
    name: string;
    sku?: string;
    priceInPaise: number;
    costPriceInPaise?: number;
    stock?: number;
    unit?: string;
    lowStockThreshold?: number;
  }) {
    return this.request<{
      id: string;
      name: string;
      sku: string | null;
      priceInPaise: number;
      costPriceInPaise: number;
      stock: number;
      unit: string;
      lowStockThreshold: number | null;
    }>('POST', ENDPOINTS.products.create(businessId), data);
  }

  async listProducts(businessId: string) {
    return this.request<Array<{
      id: string;
      name: string;
      sku: string | null;
      priceInPaise: number;
      costPriceInPaise: number;
      stock: number;
      unit: string;
      lowStockThreshold: number | null;
      isActive: boolean;
    }>>('GET', ENDPOINTS.products.list(businessId));
  }

  async getProductById(businessId: string, productId: string) {
    return this.request<{
      id: string;
      name: string;
      sku: string | null;
      priceInPaise: number;
      costPriceInPaise: number;
      stock: number;
      unit: string;
      lowStockThreshold: number | null;
      isActive: boolean;
    }>('GET', ENDPOINTS.products.byId(businessId, productId));
  }

  async updateProduct(businessId: string, productId: string, data: {
    name?: string;
    sku?: string | null;
    priceInPaise?: number;
    costPriceInPaise?: number;
    unit?: string;
    lowStockThreshold?: number | null;
    isActive?: boolean;
  }) {
    return this.request<{
      id: string;
      name: string;
      sku: string | null;
      priceInPaise: number;
      costPriceInPaise: number;
      stock: number;
      unit: string;
      lowStockThreshold: number | null;
      isActive: boolean;
    }>('PATCH', ENDPOINTS.products.byId(businessId, productId), data);
  }

  async updateProductStock(businessId: string, productId: string, adjustment: number) {
    return this.request<{ id: string; stock: number }>(
      'PATCH', `${ENDPOINTS.products.byId(businessId, productId)}/stock`, { adjustment },
    );
  }

  // ── Team ─────────────────────────────────────────────────────────────────

  async listTeamMembers(businessId: string) {
    return this.request<Array<{
      memberId: string;
      userId: string;
      name: string;
      phone: string;
      role: 'OWNER' | 'MANAGER' | 'STAFF';
      joinedAt: string;
    }>>('GET', ENDPOINTS.team.list(businessId));
  }

  async inviteTeamMember(businessId: string, phone: string, role?: 'MANAGER' | 'STAFF') {
    const body: { phone: string; role?: string } = { phone };
    if (role) body.role = role;
    return this.request<{
      memberId: string;
      userId: string;
      name: string;
      phone: string;
      role: 'OWNER' | 'MANAGER' | 'STAFF';
      joinedAt: string;
    }>('POST', ENDPOINTS.team.invite(businessId), body);
  }

  async updateTeamMemberRole(businessId: string, memberId: string, role: 'MANAGER' | 'STAFF') {
    return this.request<{
      memberId: string;
      userId: string;
      name: string;
      phone: string;
      role: 'OWNER' | 'MANAGER' | 'STAFF';
      joinedAt: string;
    }>('PATCH', ENDPOINTS.team.updateRole(businessId, memberId), { role });
  }

  async removeTeamMember(businessId: string, memberId: string) {
    return this.request<{ message: string }>('DELETE', ENDPOINTS.team.remove(businessId, memberId));
  }

  // ── Alerts ───────────────────────────────────────────────────────────────

  async getAlerts(businessId: string) {
    return this.request<Array<{
      type: string;
      severity: 'info' | 'warning' | 'critical';
      message: string;
      amountInPaise?: number;
      party?: string;
      detectedAt: string;
    }>>('GET', `/businesses/${businessId}/alerts`);
  }

  // ── Search ───────────────────────────────────────────────────────────────

  async search(businessId: string, q: string) {
    const encoded = encodeURIComponent(q);
    return this.request<Array<{
      type: 'customer' | 'supplier' | 'product' | 'sale' | 'expense';
      id: string;
      title: string;
      subtitle: string;
      amountInPaise?: number;
    }>>('GET', `/businesses/${businessId}/search?q=${encoded}`);
  }

  // ── Analytics: Snapshot + Health Score ───────────────────────────────────

  async getInsights(businessId: string) {
    return this.request<{
      businessId: string;
      generatedAt: string;
      trends: Array<{ type: string; severity: string; title: string; description: string }>;
      anomalies: Array<{ type: string; severity: string; title: string; description: string }>;
      opportunities: Array<{ type: string; severity: string; title: string; description: string }>;
      risks: Array<{ type: string; severity: string; title: string; description: string }>;
    }>('GET', ENDPOINTS.analytics.insights(businessId));
  }

  async getHealthScore(businessId: string) {
    return this.request<{
      businessId: string;
      overallScore: number;
      grade: 'healthy' | 'good' | 'fair' | 'at_risk' | 'critical';
      dimensions: Array<{
        dimension: string;
        score: number;
        grade: 'healthy' | 'good' | 'fair' | 'at_risk' | 'critical';
        insightCount: number;
      }>;
      criticalInsightCount: number;
      opportunityCount: number;
      generatedAt: string;
    }>('GET', ENDPOINTS.analytics.healthScore(businessId));
  }

  async getBusinessSnapshot(businessId: string) {
    return this.request<{
      today: { salesInPaise: number; expensesInPaise: number; profitInPaise: number; grossMarginBps: number };
      receivableInPaise: number;
      payableInPaise: number;
      alertCount: number;
    }>('GET', `/businesses/${businessId}/analytics/snapshot`);
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

  async chatWithBusiness(businessId: string, transcript: string) {
    return this.request<{ reply: string }>('POST', ENDPOINTS.ai.chat, { businessId, transcript });
  }

  async createPurchase(businessId: string, data: {
    supplierId?: string;
    items: Array<{ productId: string; quantity: number; unitCostInPaise: number }>;
    paymentMethod?: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT';
    notes?: string;
    date?: string;
    totalInPaise?: number;
  }) {
    return this.request<{
      id: string;
      businessId: string;
      supplierId: string | null;
      supplierName: string | null;
      totalInPaise: number;
      paymentMethod: string;
      status: string;
      notes: string | null;
      date: string;
      createdAt: string;
      itemCount: number;
    }>('POST', ENDPOINTS.purchases.create(businessId), data);
  }

  // listPurchases overload consolidated above — removed duplicate

  async getBriefing(businessId: string, since?: Date) {
    const url = since
      ? `${ENDPOINTS.analytics.briefing(businessId)}?since=${encodeURIComponent(since.toISOString())}`
      : ENDPOINTS.analytics.briefing(businessId);
    return this.request<{
      businessId: string;
      since: string;
      generatedAt: string;
      items: Array<{
        priority: 'critical' | 'important' | 'actionable' | 'informational';
        category: 'sales' | 'expenses' | 'new_customers' | 'payments' | 'supplier_bills' | 'stock_alerts' | 'opportunities';
        title: string;
        description: string;
        evidence: Record<string, unknown>;
      }>;
      summary: {
        totalItems: number;
        criticalCount: number;
        importantCount: number;
        actionableCount: number;
        informationalCount: number;
      };
    }>('GET', url);
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
