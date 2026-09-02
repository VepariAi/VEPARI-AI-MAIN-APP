/**
 * @vepari/types — shared TypeScript type definitions.
 * Used by both mobile and backend. Contains no runtime code.
 */

// ── Common ─────────────────────────────────────────────────────────────────

export type UUID = string;
export type ISODate = string;
export type INRAmount = number; // paise (integer)

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// ── User & Auth ─────────────────────────────────────────────────────────────

export interface User {
  id: UUID;
  phone: string;
  name: string;
  businessId: UUID;
  role: UserRole;
  language: string;
  createdAt: ISODate;
}

export type UserRole = 'owner' | 'manager' | 'staff';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ── Business ────────────────────────────────────────────────────────────────

export interface Business {
  id: UUID;
  name: string;
  type: BusinessType;
  gstNumber?: string;
  phone: string;
  address?: Address;
  createdAt: ISODate;
}

export type BusinessType =
  | 'retail'
  | 'restaurant'
  | 'services'
  | 'manufacturing'
  | 'distribution'
  | 'other';

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

// ── Finance ─────────────────────────────────────────────────────────────────

export interface Transaction {
  id: UUID;
  businessId: UUID;
  type: TransactionType;
  amount: INRAmount;
  description?: string;
  date: ISODate;
  paymentMethod: PaymentMethod;
  createdAt: ISODate;
  syncedAt?: ISODate;
}

export type TransactionType = 'sale' | 'expense' | 'purchase' | 'payment';
export type PaymentMethod = 'cash' | 'upi' | 'card' | 'bank_transfer' | 'credit';

// ── Products & Inventory ────────────────────────────────────────────────────

export interface Product {
  id: UUID;
  businessId: UUID;
  name: string;
  sku?: string;
  price: INRAmount;
  stock: number;
  unit: string;
  lowStockThreshold?: number;
  createdAt: ISODate;
}

// ── Customers & Suppliers ───────────────────────────────────────────────────

export interface Contact {
  id: UUID;
  businessId: UUID;
  type: 'customer' | 'supplier';
  name: string;
  phone?: string;
  email?: string;
  balance: INRAmount;
  createdAt: ISODate;
}

// ── AI / Voice ──────────────────────────────────────────────────────────────

export interface VoiceQuery {
  id: UUID;
  transcript: string;
  language: string;
  intent?: string;
  response?: string;
  timestamp: ISODate;
}

export interface AIAction {
  id: UUID;
  type: string;
  description: string;
  payload: Record<string, unknown>;
  approved?: boolean;
  executedAt?: ISODate;
}
