// Loss Alerts — anomaly detection with cooldown dedup.
// Cooldowns prevent the same alert firing more than once per window.
// All thresholds use paise (integer); no floats.

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type AlertType =
  | 'loss_day'          // today profit is negative
  | 'high_expense'      // expenses > configurable % of sales
  | 'overdue_credit'    // customer credit outstanding > threshold days
  | 'low_sales'         // sales below minimum for the day
  | 'large_payable';    // total payable to suppliers crosses threshold

export interface BusinessAlert {
  type: AlertType;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  amountInPaise?: number;
  party?: string;
  detectedAt: Date;
}

// Cooldown windows (ms): alert won't re-fire within this window
const COOLDOWN_MS: Record<AlertType, number> = {
  loss_day: 6 * 60 * 60 * 1000,         // 6 hours
  high_expense: 4 * 60 * 60 * 1000,     // 4 hours
  overdue_credit: 24 * 60 * 60 * 1000,  // 24 hours
  low_sales: 3 * 60 * 60 * 1000,        // 3 hours
  large_payable: 12 * 60 * 60 * 1000,   // 12 hours
};

@Injectable()
export class AlertsService {
  // In-memory cooldown registry: `${businessId}:${alertType}` → expiry ms
  private readonly cooldowns = new Map<string, number>();

  constructor(private readonly prisma: PrismaService) {}

  async evaluateAlerts(businessId: string): Promise<BusinessAlert[]> {
    const now = Date.now();
    const alerts: BusinessAlert[] = [];
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date();
    dayEnd.setHours(23, 59, 59, 999);

    const [salesAgg, expensesAgg, overdueCustomers, payableAgg] = await Promise.all([
      this.prisma.saleOrder.aggregate({
        where: { businessId, date: { gte: dayStart, lte: dayEnd } },
        _sum: { totalInPaise: true },
      }),
      this.prisma.expense.aggregate({
        where: { businessId, date: { gte: dayStart, lte: dayEnd } },
        _sum: { amountInPaise: true },
      }),
      this.prisma.customer.findMany({
        where: { businessId, isActive: true, creditBalance: { gt: 0 } },
        orderBy: { creditBalance: 'desc' },
        take: 5,
        select: { name: true, creditBalance: true },
      }),
      this.prisma.supplier.aggregate({
        where: { businessId, isActive: true, payableBalance: { gt: 0 } },
        _sum: { payableBalance: true },
      }),
    ]);

    const salesInPaise = salesAgg._sum.totalInPaise ?? 0;
    const expensesInPaise = expensesAgg._sum.amountInPaise ?? 0;
    const profitInPaise = salesInPaise - expensesInPaise;
    const totalPayable = payableAgg._sum.payableBalance ?? 0;

    // Alert: daily loss
    if (profitInPaise < 0 && this.canFire(businessId, 'loss_day', now)) {
      alerts.push({
        type: 'loss_day',
        severity: 'critical',
        message: `Today is at a loss of ₹${Math.abs(profitInPaise / 100).toFixed(0)}`,
        amountInPaise: Math.abs(profitInPaise),
        detectedAt: new Date(now),
      });
      this.setCooldown(businessId, 'loss_day', now);
    }

    // Alert: expenses > 80% of sales (high expense ratio)
    if (salesInPaise > 0) {
      // Use basis points to avoid float: 8000 bps = 80%
      const ratioBps = Math.round((expensesInPaise * 10000) / salesInPaise);
      if (ratioBps > 8000 && this.canFire(businessId, 'high_expense', now)) {
        alerts.push({
          type: 'high_expense',
          severity: 'warning',
          message: `Expenses are ${Math.round(ratioBps / 100)}% of today's sales`,
          amountInPaise: expensesInPaise,
          detectedAt: new Date(now),
        });
        this.setCooldown(businessId, 'high_expense', now);
      }
    }

    // Alert: low sales (< ₹100 by noon)
    const hour = new Date().getHours();
    if (hour >= 12 && salesInPaise < 10000 && this.canFire(businessId, 'low_sales', now)) {
      alerts.push({
        type: 'low_sales',
        severity: 'info',
        message: `Only ₹${(salesInPaise / 100).toFixed(0)} in sales recorded today`,
        amountInPaise: salesInPaise,
        detectedAt: new Date(now),
      });
      this.setCooldown(businessId, 'low_sales', now);
    }

    // Alert: top customer credit overdue
    if (overdueCustomers.length > 0 && this.canFire(businessId, 'overdue_credit', now)) {
      const top = overdueCustomers[0];
      if (top && top.creditBalance > 100000) { // > ₹1000
        alerts.push({
          type: 'overdue_credit',
          severity: 'warning',
          message: `${top.name} owes ₹${(top.creditBalance / 100).toFixed(0)}`,
          amountInPaise: top.creditBalance,
          party: top.name,
          detectedAt: new Date(now),
        });
        this.setCooldown(businessId, 'overdue_credit', now);
      }
    }

    // Alert: large payable to suppliers
    if (totalPayable > 500000 && this.canFire(businessId, 'large_payable', now)) { // > ₹5000
      alerts.push({
        type: 'large_payable',
        severity: 'warning',
        message: `₹${(totalPayable / 100).toFixed(0)} owed to suppliers`,
        amountInPaise: totalPayable,
        detectedAt: new Date(now),
      });
      this.setCooldown(businessId, 'large_payable', now);
    }

    return alerts;
  }

  private canFire(businessId: string, type: AlertType, now: number): boolean {
    const key = `${businessId}:${type}`;
    const expiry = this.cooldowns.get(key);
    return expiry === undefined || now >= expiry;
  }

  private setCooldown(businessId: string, type: AlertType, now: number): void {
    const key = `${businessId}:${type}`;
    this.cooldowns.set(key, now + COOLDOWN_MS[type]);
  }
}
