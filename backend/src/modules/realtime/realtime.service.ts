import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { EventsService } from '../../events/events.service';

export interface RealtimeEvent {
  type: string;
  data: unknown;
  ts: number;
}

@Injectable()
export class RealtimeService implements OnModuleInit, OnModuleDestroy {
  private readonly subjects = new Map<string, Subject<RealtimeEvent>>();

  constructor(private readonly events: EventsService) {}

  onModuleInit(): void {
    this.events.on('sale.created', p =>
      this.push(p.businessId, 'sale.created', p));

    this.events.on('payment.recorded', p =>
      this.push(p.businessId, 'payment.recorded', p));

    this.events.on('inventory.adjusted', p =>
      this.push(p.businessId, 'inventory.adjusted', p));

    this.events.on('purchase.created', p =>
      this.push(p.businessId, 'purchase.created', p));

    this.events.on('expense.created', p =>
      this.push(p.businessId, 'expense.created', p));

    this.events.on('customer.created', p =>
      this.push(p.businessId, 'customer.created', p));
  }

  onModuleDestroy(): void {
    for (const subject of this.subjects.values()) subject.complete();
    this.subjects.clear();
  }

  streamForBusiness(businessId: string): Observable<{ data: RealtimeEvent }> {
    return this.getSubject(businessId).asObservable().pipe(
      map(event => ({ data: event })),
    );
  }

  private push(businessId: string, type: string, data: unknown): void {
    this.getSubject(businessId).next({ type, data, ts: Date.now() });
  }

  private getSubject(businessId: string): Subject<RealtimeEvent> {
    if (!this.subjects.has(businessId)) {
      this.subjects.set(businessId, new Subject<RealtimeEvent>());
    }
    return this.subjects.get(businessId)!;
  }
}
