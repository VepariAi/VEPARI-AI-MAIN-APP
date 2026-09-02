/**
 * @vepari/validation — shared Zod schemas used by mobile and backend.
 * Ensures consistent validation rules at every boundary.
 */

import { z } from 'zod';

// ── Primitives ───────────────────────────────────────────────────────────────

export const uuidSchema = z.string().uuid();

/** INR amount in paise — must be non-negative integer. */
export const inrAmountSchema = z.number().int().nonnegative();

export const phoneSchema = z
  .string()
  .regex(/^\d{10}$/, 'Phone must be 10 digits');

export const gstSchema = z
  .string()
  .regex(
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    'Invalid GST number',
  )
  .optional();

export const pincodeSchema = z
  .string()
  .regex(/^\d{6}$/, 'Pincode must be 6 digits');

// ── Auth ─────────────────────────────────────────────────────────────────────

export const sendOtpSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: z.string().length(6),
});

export const setPinSchema = z.object({
  pin: z.string().length(6).regex(/^\d{6}$/, 'PIN must be 6 digits'),
});

// ── Business setup ───────────────────────────────────────────────────────────

export const businessSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.enum([
    'retail',
    'restaurant',
    'services',
    'manufacturing',
    'distribution',
    'other',
  ]),
  gstNumber: gstSchema,
  phone: phoneSchema,
});

// ── Transaction ──────────────────────────────────────────────────────────────

export const transactionSchema = z.object({
  type: z.enum(['sale', 'expense', 'purchase', 'payment']),
  amount: inrAmountSchema,
  description: z.string().max(500).optional(),
  date: z.string().datetime(),
  paymentMethod: z.enum(['cash', 'upi', 'card', 'bank_transfer', 'credit']),
  contactId: uuidSchema.optional(),
  items: z
    .array(
      z.object({
        productId: uuidSchema,
        quantity: z.number().positive(),
        unitPrice: inrAmountSchema,
      }),
    )
    .optional(),
});

// ── Product ──────────────────────────────────────────────────────────────────

export const productSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().max(50).optional(),
  price: inrAmountSchema,
  stock: z.number().int().nonnegative(),
  unit: z.string().min(1).max(20),
  lowStockThreshold: z.number().int().nonnegative().optional(),
});

// ── Contact (customer / supplier) ────────────────────────────────────────────

export const contactSchema = z.object({
  type: z.enum(['customer', 'supplier']),
  name: z.string().min(1).max(200),
  phone: phoneSchema.optional(),
  email: z.string().email().optional(),
});

// ── Pagination ───────────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
