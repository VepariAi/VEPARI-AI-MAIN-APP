// Connection adapter registry — PROMPT 231.
//
// Central lookup that the sync engine, webhook processor, and health monitor
// use to resolve a provider's adapter by id. Adapters register themselves at
// module init; nothing else needs to know which concrete adapters exist.

import { Injectable, NotFoundException } from '@nestjs/common';
import type { ConnectionAdapter } from './adapter.interface';

@Injectable()
export class AdapterRegistry {
  private readonly adapters = new Map<string, ConnectionAdapter>();

  register(adapter: ConnectionAdapter): void {
    this.adapters.set(adapter.providerId, adapter);
  }

  has(providerId: string): boolean {
    return this.adapters.has(providerId);
  }

  get(providerId: string): ConnectionAdapter {
    const adapter = this.adapters.get(providerId);
    if (!adapter) throw new NotFoundException(`No adapter registered for provider "${providerId}"`);
    return adapter;
  }

  list(): ConnectionAdapter[] {
    return Array.from(this.adapters.values());
  }
}
