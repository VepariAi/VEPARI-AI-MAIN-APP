import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateProductDto {
  businessId: string;
  name: string;
  sku?: string;
  priceInPaise: number;
  costPriceInPaise?: number;
  stock?: number;
  unit?: string;
  lowStockThreshold?: number;
}

export interface UpdateProductDto {
  name?: string;
  sku?: string | null;
  priceInPaise?: number;
  costPriceInPaise?: number;
  unit?: string;
  lowStockThreshold?: number | null;
  isActive?: boolean;
}

export interface ProductSummary {
  id: string;
  businessId: string;
  name: string;
  sku: string | null;
  priceInPaise: number;
  costPriceInPaise: number;
  stock: number;
  unit: string;
  lowStockThreshold: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async createProduct(dto: CreateProductDto): Promise<ProductSummary> {
    const { businessId, name, sku, priceInPaise, costPriceInPaise, stock, unit, lowStockThreshold } = dto;

    if (priceInPaise < 0) throw new BadRequestException('Price must be non-negative');
    if (costPriceInPaise !== undefined && costPriceInPaise < 0) throw new BadRequestException('Cost price must be non-negative');

    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    // Prevent duplicate SKU within same business
    if (sku) {
      const existing = await this.prisma.product.findFirst({ where: { businessId, sku } });
      if (existing) throw new BadRequestException(`Product with SKU '${sku}' already exists`);
    }

    return this.prisma.product.create({
      data: {
        businessId,
        name,
        priceInPaise,
        ...(sku !== undefined && { sku }),
        ...(costPriceInPaise !== undefined && { costPriceInPaise }),
        ...(stock !== undefined && { stock }),
        ...(unit !== undefined && { unit }),
        ...(lowStockThreshold !== undefined && { lowStockThreshold }),
      },
    });
  }

  async listProducts(businessId: string, activeOnly = true): Promise<ProductSummary[]> {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    return this.prisma.product.findMany({
      where: activeOnly ? { businessId, isActive: true } : { businessId },
      orderBy: { name: 'asc' },
    });
  }

  async adjustStock(businessId: string, productId: string, adjustment: number): Promise<{ id: string; stock: number }> {
    const product = await this.prisma.product.findFirst({ where: { id: productId, businessId } });
    if (!product) throw new NotFoundException('Product not found');

    const newStock = product.stock + adjustment;
    if (newStock < 0) throw new BadRequestException('Stock cannot go below zero');

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: { stock: newStock },
      select: { id: true, stock: true },
    });
    return updated;
  }

  async getProductById(businessId: string, productId: string): Promise<ProductSummary> {
    const product = await this.prisma.product.findFirst({ where: { id: productId, businessId } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async updateProduct(businessId: string, productId: string, dto: UpdateProductDto): Promise<ProductSummary> {
    const product = await this.prisma.product.findFirst({ where: { id: productId, businessId } });
    if (!product) throw new NotFoundException('Product not found');

    if (dto.priceInPaise !== undefined && dto.priceInPaise < 0) throw new BadRequestException('Price must be non-negative');
    if (dto.costPriceInPaise !== undefined && dto.costPriceInPaise !== null && dto.costPriceInPaise < 0) throw new BadRequestException('Cost price must be non-negative');

    if (dto.sku && dto.sku !== product.sku) {
      const existing = await this.prisma.product.findFirst({ where: { businessId, sku: dto.sku } });
      if (existing) throw new BadRequestException(`Product with SKU '${dto.sku}' already exists`);
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.sku !== undefined && { sku: dto.sku }),
        ...(dto.priceInPaise !== undefined && { priceInPaise: dto.priceInPaise }),
        ...(dto.costPriceInPaise !== undefined && { costPriceInPaise: dto.costPriceInPaise }),
        ...(dto.unit !== undefined && { unit: dto.unit }),
        ...(dto.lowStockThreshold !== undefined && { lowStockThreshold: dto.lowStockThreshold }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async getLowStockProducts(businessId: string): Promise<ProductSummary[]> {
    const products = await this.prisma.product.findMany({
      where: { businessId, isActive: true, lowStockThreshold: { not: null } },
    });
    return products.filter(p => p.lowStockThreshold !== null && p.stock <= p.lowStockThreshold);
  }
}
