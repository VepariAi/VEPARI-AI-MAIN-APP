import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessType, UserRole } from '@prisma/client';

@Injectable()
export class BusinessesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: {
    name: string;
    type?: BusinessType;
    phone: string;
    gstNumber?: string;
  }) {
    const business = await this.prisma.business.create({
      data: {
        ...data,
        members: {
          create: { userId, role: UserRole.OWNER },
        },
      },
    });
    return business;
  }

  async findById(id: string) {
    const business = await this.prisma.business.findUnique({ where: { id } });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  async findByUser(userId: string) {
    return this.prisma.business.findMany({
      where: {
        members: { some: { userId } },
        isActive: true,
      },
      include: {
        members: {
          where: { userId },
          select: { role: true },
        },
      },
    });
  }

  async update(businessId: string, userId: string, data: Partial<{
    name: string;
    type: BusinessType;
    gstNumber: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;
  }>) {
    await this.requireRole(businessId, userId, [UserRole.OWNER, UserRole.MANAGER]);
    return this.prisma.business.update({ where: { id: businessId }, data });
  }

  async getDashboardSummary(businessId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todaySales, todayExpenses, totalReceivable, totalPayable] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { businessId, type: 'SALE', date: { gte: today, lt: tomorrow } },
        _sum: { amountInPaise: true },
      }),
      this.prisma.transaction.aggregate({
        where: { businessId, type: 'EXPENSE', date: { gte: today, lt: tomorrow } },
        _sum: { amountInPaise: true },
      }),
      this.prisma.customer.aggregate({
        where: { businessId, creditBalance: { gt: 0 } },
        _sum: { creditBalance: true },
      }),
      this.prisma.supplier.aggregate({
        where: { businessId, payableBalance: { gt: 0 } },
        _sum: { payableBalance: true },
      }),
    ]);

    const salesPaise = todaySales._sum.amountInPaise ?? 0;
    const expensesPaise = todayExpenses._sum.amountInPaise ?? 0;

    return {
      today: {
        salesInPaise: salesPaise,
        expensesInPaise: expensesPaise,
        profitInPaise: salesPaise - expensesPaise,
      },
      credit: {
        receivableInPaise: totalReceivable._sum.creditBalance ?? 0,
        payableInPaise: totalPayable._sum.payableBalance ?? 0,
      },
    };
  }

  private async requireRole(businessId: string, userId: string, roles: UserRole[]): Promise<void> {
    const member = await this.prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId, userId } },
    });
    if (!member || !roles.includes(member.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }
}
