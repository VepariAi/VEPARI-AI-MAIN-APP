// All stock quantities in whole units; monetary amounts in paise.
// StockMovement records are stored in-memory for Phase 15.
// When the DB migration runs (Phase 16), replace the in-memory store with Prisma calls.

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type StockMovementReason =
  | 'PURCHASE'
  | 'SALE'
  | 'ADJUSTMENT'
  | 'RETURN_IN'
  | 'RETURN_OUT'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'OPENING_STOCK';

export interface StockMovementDto {
  productId: string;
  quantity: number;          // positive = in, negative = out
  reason: StockMovementReason;
  referenceId?: string;
  notes?: string;
}

export interface StockAdjustmentDto {
  productId: string;
  newQuantity: number;
  notes?: string;
}

interface InMemoryMovement {
  id: string;
  businessId: string;
  productId: string;
  quantity: number;
  reason: StockMovementReason;
  referenceId: string | null;
  notes: string | null;
  createdAt: Date;
}

const movementStore: InMemoryMovement[] = [];

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async listProducts(businessId: string): Promise<Array<{
    id: string; name: string; sku: string | null; stock: number;
    unit: string; lowStockThreshold: number | null; priceInPaise: number;
    costPriceInPaise: number; isActive: boolean;
  }>> {
    return this.prisma.product.findMany({
      where: { businessId, isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, sku: true, stock: true, unit: true,
        lowStockThreshold: true, priceInPaise: true, costPriceInPaise: true, isActive: true,
      },
    });
  }

  async getLowStockProducts(businessId: string): Promise<Array<{
    id: string; name: string; sku: string | null; stock: number;
    unit: string; lowStockThreshold: number | null;
  }>> {
    const products = await this.prisma.product.findMany({
      where: { businessId, isActive: true, lowStockThreshold: { not: null } },
      select: { id: true, name: true, sku: true, stock: true, unit: true, lowStockThreshold: true },
    });
    return products.filter(p => p.lowStockThreshold !== null && p.stock <= p.lowStockThreshold);
  }

  async recordMovement(businessId: string, dto: StockMovementDto): Promise<{
    movementId: string; newStock: number;
  }> {
    if (dto.quantity === 0) throw new BadRequestException('Quantity cannot be zero');

    const product = await this.prisma.product.findFirst({ where: { id: dto.productId, businessId } });
    if (!product) throw new NotFoundException('Product not found');

    const newStock = product.stock + dto.quantity;
    if (newStock < 0) throw new BadRequestException(`Insufficient stock: current ${product.stock}, requested ${Math.abs(dto.quantity)}`);

    const movement: InMemoryMovement = {
      id: `mov_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      businessId,
      productId: dto.productId,
      quantity: dto.quantity,
      reason: dto.reason,
      referenceId: dto.referenceId ?? null,
      notes: dto.notes ?? null,
      createdAt: new Date(),
    };
    movementStore.push(movement);

    await this.prisma.product.update({
      where: { id: dto.productId },
      data: { stock: newStock, syncStatus: 'PENDING' },
    });

    return { movementId: movement.id, newStock };
  }

  async adjustStock(businessId: string, dto: StockAdjustmentDto): Promise<{
    movementId: string; previousStock: number; newStock: number;
  }> {
    if (dto.newQuantity < 0) throw new BadRequestException('Stock quantity cannot be negative');

    const product = await this.prisma.product.findFirst({ where: { id: dto.productId, businessId } });
    if (!product) throw new NotFoundException('Product not found');

    const delta = dto.newQuantity - product.stock;
    const movement: InMemoryMovement = {
      id: `mov_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      businessId,
      productId: dto.productId,
      quantity: delta,
      reason: 'ADJUSTMENT',
      referenceId: null,
      notes: dto.notes ?? `Manual adjustment to ${dto.newQuantity}`,
      createdAt: new Date(),
    };
    movementStore.push(movement);

    await this.prisma.product.update({
      where: { id: dto.productId },
      data: { stock: dto.newQuantity, syncStatus: 'PENDING' },
    });

    return { movementId: movement.id, previousStock: product.stock, newStock: dto.newQuantity };
  }

  async getMovementHistory(businessId: string, productId: string, limit = 50): Promise<Array<{
    id: string; quantity: number; reason: string;
    referenceId: string | null; notes: string | null; createdAt: Date;
  }>> {
    const product = await this.prisma.product.findFirst({ where: { id: productId, businessId } });
    if (!product) throw new NotFoundException('Product not found');

    return movementStore
      .filter(m => m.businessId === businessId && m.productId === productId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getInventoryValue(businessId: string): Promise<{
    totalValueAtCost: number;
    totalValueAtPrice: number;
    productCount: number;
    lowStockCount: number;
  }> {
    const products = await this.prisma.product.findMany({
      where: { businessId, isActive: true },
      select: { stock: true, priceInPaise: true, costPriceInPaise: true, lowStockThreshold: true },
    });

    return {
      totalValueAtCost: products.reduce((s, p) => s + p.stock * p.costPriceInPaise, 0),
      totalValueAtPrice: products.reduce((s, p) => s + p.stock * p.priceInPaise, 0),
      productCount: products.length,
      lowStockCount: products.filter(p => p.lowStockThreshold !== null && p.stock <= p.lowStockThreshold).length,
    };
  }
}
