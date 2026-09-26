import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateDocumentDto {
  type: string;   // invoice | receipt | purchase_order | expense_receipt | other
  title: string;
  url?: string;
  metadata?: Record<string, unknown>;
  date: string;   // ISO date
  referenceId?: string;  // saleOrderId, purchaseId, etc.
}

export interface DocumentResponse {
  id: string;
  businessId: string;
  type: string;
  title: string;
  url: string | null;
  metadata: Record<string, unknown> | null;
  date: Date;
  createdAt: Date;
}

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(businessId: string, dto: CreateDocumentDto): Promise<DocumentResponse> {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    const createData: Parameters<typeof this.prisma.document.create>[0]['data'] = {
      businessId,
      type: dto.type,
      title: dto.title,
      date: new Date(dto.date),
    };
    if (dto.url !== undefined) createData['url'] = dto.url;
    if (dto.metadata !== undefined) createData['metadata'] = dto.metadata as object;

    const doc = await this.prisma.document.create({ data: createData });

    return this.toDto(doc);
  }

  async list(businessId: string, type?: string): Promise<DocumentResponse[]> {
    const docs = await this.prisma.document.findMany({
      where: { businessId, ...(type ? { type } : {}) },
      orderBy: { date: 'desc' },
    });
    return docs.map(d => this.toDto(d));
  }

  async getById(businessId: string, documentId: string): Promise<DocumentResponse> {
    const doc = await this.prisma.document.findFirst({ where: { id: documentId, businessId } });
    if (!doc) throw new NotFoundException('Document not found');
    return this.toDto(doc);
  }

  async delete(businessId: string, documentId: string): Promise<void> {
    const doc = await this.prisma.document.findFirst({ where: { id: documentId, businessId } });
    if (!doc) throw new NotFoundException('Document not found');
    await this.prisma.document.delete({ where: { id: documentId } });
  }

  private toDto(doc: {
    id: string; businessId: string; type: string; title: string;
    url: string | null; metadata: unknown; date: Date; createdAt: Date;
  }): DocumentResponse {
    return {
      id: doc.id,
      businessId: doc.businessId,
      type: doc.type,
      title: doc.title,
      url: doc.url,
      metadata: (doc.metadata as Record<string, unknown> | null) ?? null,
      date: doc.date,
      createdAt: doc.createdAt,
    };
  }
}
