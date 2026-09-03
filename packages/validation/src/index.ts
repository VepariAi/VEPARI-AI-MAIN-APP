/**
 * @vepari/validation — shared Zod schemas for runtime validation.
 * Used by both mobile (API request/response) and backend (body validation).
 * All monetary amounts validated as integers (paise, not rupees).
 */

import { z } from 'zod';

// ── Primitives ─────────────────────────────────────────────────────────────

export const IndianPhone = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number');

export const E164Phone = z
  .string()
  .regex(/^\+91[6-9]\d{9}$/, 'Must be a valid E.164 Indian number');

export const UUID = z.string().uuid('Must be a valid UUID');

export const ISODate = z.string().datetime({ offset: true });

// Paise: must be non-negative integer
export const Paise = z
  .number()
  .int('Amount must be an integer (paise, not rupees)')
  .nonnegative('Amount must be non-negative');

// Signed paise (for balances)
export const SignedPaise = z.number().int('Amount must be an integer (paise)');

// ── Auth schemas ──────────────────────────────────────────────────────────

export const SendOtpSchema = z.object({
  phone: IndianPhone,
  purpose: z.enum(['LOGIN', 'REGISTER', 'CHANGE_PHONE']),
});

export const RegisterSchema = z.object({
  phone: IndianPhone,
  code: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

export const LoginSchema = z.object({
  phone: IndianPhone,
  code: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

// ── User schemas ──────────────────────────────────────────────────────────

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  language: z.string().min(2).max(10).optional(),
});

// ── Business schemas ──────────────────────────────────────────────────────

export const BusinessTypeEnum = z.enum([
  'RETAIL', 'RESTAURANT', 'SERVICES', 'MANUFACTURING', 'DISTRIBUTION', 'OTHER',
]);

export const CreateBusinessSchema = z.object({
  name: z.string().min(2, 'Business name too short').max(200),
  type: BusinessTypeEnum.default('RETAIL'),
  phone: IndianPhone,
  gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number').optional(),
});

export const UpdateBusinessSchema = CreateBusinessSchema.partial().extend({
  addressLine1: z.string().max(200).optional(),
  addressLine2: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits').optional(),
});

// ── Customer / Supplier schemas ───────────────────────────────────────────

export const CreateContactSchema = z.object({
  name: z.string().min(1).max(200),
  phone: IndianPhone.optional(),
  email: z.string().email().optional(),
  notes: z.string().max(500).optional(),
});

export const UpdateContactSchema = CreateContactSchema.partial();

// ── Product schemas ───────────────────────────────────────────────────────

export const CreateProductSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().max(100).optional(),
  priceInPaise: Paise,
  costPriceInPaise: Paise.optional().default(0),
  stock: z.number().int().nonnegative().default(0),
  unit: z.string().max(20).default('unit'),
  lowStockThreshold: z.number().int().nonnegative().optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial();

// ── Transaction schemas ───────────────────────────────────────────────────

export const TransactionTypeEnum = z.enum([
  'SALE', 'EXPENSE', 'PURCHASE', 'PAYMENT', 'CREDIT_ISSUED', 'CREDIT_RECEIVED',
]);

export const PaymentMethodEnum = z.enum([
  'CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CREDIT',
]);

export const CreateTransactionSchema = z.object({
  type: TransactionTypeEnum,
  amountInPaise: Paise,
  description: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  date: ISODate,
  paymentMethod: PaymentMethodEnum.default('CASH'),
  customerId: UUID.optional(),
  supplierId: UUID.optional(),
  referenceId: z.string().optional(),
});

// ── Sale Order schemas ────────────────────────────────────────────────────

export const SaleOrderItemSchema = z.object({
  productId: UUID,
  quantity: z.number().int().positive(),
  unitPriceInPaise: Paise,
});

export const CreateSaleOrderSchema = z.object({
  customerId: UUID.optional(),
  items: z.array(SaleOrderItemSchema).min(1, 'At least one item required'),
  discountInPaise: Paise.optional().default(0),
  taxInPaise: Paise.optional().default(0),
  paymentMethod: PaymentMethodEnum.default('CASH'),
  notes: z.string().max(500).optional(),
  date: ISODate,
});

// ── Expense schemas ───────────────────────────────────────────────────────

export const ExpenseCategories = [
  'rent',
  'utilities',
  'salaries',
  'raw_materials',
  'transport',
  'marketing',
  'maintenance',
  'taxes',
  'insurance',
  'other',
] as const;

export const ExpenseCategoryEnum = z.enum(ExpenseCategories);

export const CreateExpenseSchema = z.object({
  category: z.string().min(1).max(100),
  amountInPaise: Paise,
  description: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  date: ISODate,
  paymentMethod: PaymentMethodEnum.default('CASH'),
});

// ── Pagination ────────────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const DateRangeSchema = z.object({
  from: ISODate,
  to: ISODate,
}).refine((d: { from: string; to: string }) => new Date(d.from) <= new Date(d.to), {
  message: 'from must be before or equal to to',
});

// ── Type exports (inferred from schemas) ─────────────────────────────────

export type SendOtpInput = z.infer<typeof SendOtpSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateBusinessInput = z.infer<typeof CreateBusinessSchema>;
export type UpdateBusinessInput = z.infer<typeof UpdateBusinessSchema>;
export type CreateContactInput = z.infer<typeof CreateContactSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type CreateSaleOrderInput = z.infer<typeof CreateSaleOrderSchema>;
export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
export type DateRangeInput = z.infer<typeof DateRangeSchema>;
