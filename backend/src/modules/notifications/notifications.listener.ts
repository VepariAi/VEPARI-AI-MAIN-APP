import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventsService } from '../../events/events.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsListener implements OnModuleInit {
  constructor(
    private readonly events: EventsService,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit(): void {
    this.events.on('inventory.adjusted', payload => {
      if (payload.lowStockThreshold > 0 && payload.newStock <= payload.lowStockThreshold) {
        this.notifications.create(payload.businessId, {
          category: 'LOW_STOCK',
          title: 'Low Stock Alert',
          body: `${payload.productName} is running low (${payload.newStock} units remaining)`,
          deepLink: `vepari://inventory/product/${payload.productId}`,
        });
      }
    });

    this.events.on('payment.recorded', payload => {
      const amountRs = (payload.amountPaise / 100).toFixed(2);
      const directionText = payload.direction === 'IN' ? 'received' : 'paid';
      this.notifications.create(payload.businessId, {
        category: 'PAYMENT',
        title: `Payment ${directionText}`,
        body: `₹${amountRs} ${directionText}${payload.party ? ` — ${payload.party}` : ''}`,
        deepLink: `vepari://payments/${payload.paymentId}`,
      });
    });

    this.events.on('sale.created', payload => {
      const amountRs = (payload.totalPaise / 100).toFixed(2);
      this.notifications.create(payload.businessId, {
        category: 'ALERT',
        title: 'New Sale',
        body: `Sale of ₹${amountRs} recorded`,
        deepLink: `vepari://sales/${payload.saleId}`,
      });
    });
  }
}
