import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter } from 'events';
import type { DomainEventMap, DomainEventName } from './domain-events';

@Injectable()
export class EventsService implements OnModuleDestroy {
  private readonly emitter = new EventEmitter();
  private readonly logger = new Logger(EventsService.name);

  constructor() {
    this.emitter.setMaxListeners(50);
  }

  emit<K extends DomainEventName>(event: K, payload: DomainEventMap[K]): void {
    // Fire-and-forget — never throws, never delays the caller
    setImmediate(() => {
      try {
        this.emitter.emit(event, payload);
      } catch (err) {
        this.logger.error(`Event handler threw for "${event}"`, err);
      }
    });
  }

  on<K extends DomainEventName>(
    event: K,
    handler: (payload: DomainEventMap[K]) => void | Promise<void>,
  ): void {
    this.emitter.on(event, (payload: DomainEventMap[K]) => {
      Promise.resolve(handler(payload)).catch(err =>
        this.logger.error(`Async handler threw for "${event}"`, err),
      );
    });
  }

  onModuleDestroy(): void {
    this.emitter.removeAllListeners();
  }
}
