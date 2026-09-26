import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentMethod } from '@prisma/client';

export const EXPENSE_CATEGORIES = [
  'rent',
  'salary',
  'utilities',
  'purchase',
  'marketing',
  'transport',
  'maintenance',
  'other',
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

export interface CreateExpenseDto {
  businessId: string;
  category: ExpenseCategory;
  amountInPaise: number;
  description?: string;
  notes?: string;
  paymentMethod?: PaymentMethod;
  date?: Date;
}

export interface ExpenseSummary {
  id: string;
  businessId: string;
  category: string;
  amountInPaise: number;
  description: string | null;
  notes: string | null;
  paymentMethod: PaymentMethod;
  date: Date;
  createdAt: Date;
}

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async createExpense(dto: CreateExpenseDto): Promise<ExpenseSummary> {
    const { businessId, category, amountInPaise, description, notes, paymentMethod, date } = dto;

    if (amountInPaise <= 0) throw new BadRequestException('Amount must be positive');
    if (!EXPENSE_CATEGORIES.includes(category)) {
      throw new BadRequestException(`Invalid category. Must be one of: ${EXPENSE_CATEGORIES.join(', ')}`);
    }

    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    const expenseDate = date ?? new Date();

    const [expense] = await this.prisma.$transaction([
      this.prisma.expense.create({
        data: {
          businessId,
          category,
          amountInPaise,
          description: description ?? null,
          notes: notes ?? null,
          paymentMethod: paymentMethod ?? PaymentMethod.CASH,
          date: expenseDate,
        },
      }),
      this.prisma.transaction.create({
        data: {
          businessId,
          type: 'EXPENSE',
          amountInPaise,
          description: description ?? category,
          notes: notes ?? null,
          date: expenseDate,
          paymentMethod: paymentMethod ?? PaymentMethod.CASH,
        },
      }),
    ]);

    return expense;
  }

  async getExpenseById(businessId: string, expenseId: string): Promise<ExpenseSummary> {
    const expense = await this.prisma.expense.findFirst({ where: { id: expenseId, businessId } });
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  async listExpenses(businessId: string, limit = 50, offset = 0): Promise<ExpenseSummary[]> {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    return this.prisma.expense.findMany({
      where: { businessId },
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async getExpensesTodayTotal(businessId: string): Promise<number> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const result = await this.prisma.expense.aggregate({
      where: { businessId, date: { gte: startOfDay, lt: endOfDay } },
      _sum: { amountInPaise: true },
    });
    return result._sum.amountInPaise ?? 0;
  }

  async getCategoryBreakdown(businessId: string, from: Date, to: Date) {
    const expenses = await this.prisma.expense.findMany({
      where: { businessId, date: { gte: from, lt: to } },
      select: { category: true, amountInPaise: true },
    });

    const breakdown: Record<string, number> = {};
    for (const e of expenses) {
      breakdown[e.category] = (breakdown[e.category] ?? 0) + e.amountInPaise;
    }
    return breakdown;
  }
}
