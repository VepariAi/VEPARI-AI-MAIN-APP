export interface SaleCreatedEvent {
  businessId: string;
  saleId: string;
  customerId?: string;
  totalPaise: number;
}

export interface SaleCompletedEvent {
  businessId: string;
  saleId: string;
  totalPaise: number;
}

export interface PaymentRecordedEvent {
  businessId: string;
  paymentId: string;
  amountPaise: number;
  direction: 'IN' | 'OUT';
  party?: string;
}

export interface InventoryAdjustedEvent {
  businessId: string;
  productId: string;
  productName: string;
  newStock: number;
  delta: number;
  reason: string;
  lowStockThreshold: number;
}

export interface PurchaseCreatedEvent {
  businessId: string;
  purchaseId: string;
  supplierId?: string;
  totalPaise: number;
}

export interface ExpenseCreatedEvent {
  businessId: string;
  expenseId: string;
  category: string;
  amountPaise: number;
}

export interface CustomerCreatedEvent {
  businessId: string;
  customerId: string;
  name: string;
}

export interface DomainEventMap {
  'sale.created': SaleCreatedEvent;
  'sale.completed': SaleCompletedEvent;
  'payment.recorded': PaymentRecordedEvent;
  'inventory.adjusted': InventoryAdjustedEvent;
  'purchase.created': PurchaseCreatedEvent;
  'expense.created': ExpenseCreatedEvent;
  'customer.created': CustomerCreatedEvent;
}

export type DomainEventName = keyof DomainEventMap;
