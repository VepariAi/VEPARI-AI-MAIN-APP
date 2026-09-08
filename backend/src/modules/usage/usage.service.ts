// Usage tracking — in-process counters for API calls and AI token usage.
// Phase 16 will persist these to a database table.

import { Injectable } from '@nestjs/common';

export interface UsageCounter {
  businessId: string;
  aiChatRequests: number;
  sttRequests: number;
  ttsRequests: number;
  totalApiCalls: number;
  resetAt: Date; // start of current billing period (month)
}

export interface RecordUsageInput {
  businessId: string;
  type: 'ai_chat' | 'stt' | 'tts' | 'api';
}

const store = new Map<string, UsageCounter>();

function monthStart(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function getCounter(businessId: string): UsageCounter {
  if (!store.has(businessId)) {
    store.set(businessId, {
      businessId,
      aiChatRequests: 0,
      sttRequests: 0,
      ttsRequests: 0,
      totalApiCalls: 0,
      resetAt: monthStart(),
    });
  }
  const counter = store.get(businessId)!;
  // Reset at start of each month
  const ms = monthStart();
  if (counter.resetAt.getTime() < ms.getTime()) {
    counter.aiChatRequests = 0;
    counter.sttRequests = 0;
    counter.ttsRequests = 0;
    counter.totalApiCalls = 0;
    counter.resetAt = ms;
  }
  return counter;
}

@Injectable()
export class UsageService {
  record(input: RecordUsageInput): void {
    const counter = getCounter(input.businessId);
    counter.totalApiCalls++;
    if (input.type === 'ai_chat') counter.aiChatRequests++;
    else if (input.type === 'stt') counter.sttRequests++;
    else if (input.type === 'tts') counter.ttsRequests++;
  }

  getUsage(businessId: string): UsageCounter {
    return getCounter(businessId);
  }

  findAll(): UsageCounter[] {
    return Array.from(store.values());
  }
}
