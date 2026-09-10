// Usage tracking — in-process counters for API calls, AI token usage, and estimated costs.
// Phase 16 will persist these to a database table.
//
// Cost rates (PROMPT 124):
//   Anthropic Claude Sonnet  — input: $3/M tokens, output: $15/M tokens
//   OpenAI GPT-4o-mini       — input: $0.15/M tokens, output: $0.60/M tokens
// Rates stored in paise per 1,000 tokens (integer arithmetic).

import { Injectable } from '@nestjs/common';

// ── Cost table (paise per 1 000 input/output tokens) ─────────────────────────
// 1 USD = ~8,400 paise (₹84 × 100) — hardcoded reference rate for estimation
const COST_RATES_PAISE_PER_1K: Record<string, { input: number; output: number }> = {
  anthropic: { input: 25, output: 126 },   // $3/M → 25 paise/1K; $15/M → 126 paise/1K
  openai:    { input: 1,  output: 5  },    // $0.15/M → 1 paise/1K; $0.60/M → 5 paise/1K
  default:   { input: 25, output: 126 },
};

export interface UsageCounter {
  businessId: string;
  aiChatRequests: number;
  sttRequests: number;
  ttsRequests: number;
  totalApiCalls: number;
  /** Cumulative input tokens consumed this billing period */
  inputTokens: number;
  /** Cumulative output tokens consumed this billing period */
  outputTokens: number;
  /** Estimated AI cost in paise this billing period */
  estimatedAiCostInPaise: number;
  resetAt: Date; // start of current billing period (month)
}

export interface RecordUsageInput {
  businessId: string;
  type: 'ai_chat' | 'stt' | 'tts' | 'api';
  /** Provider name (anthropic | openai) — used for cost estimation */
  provider?: string;
  inputTokens?: number;
  outputTokens?: number;
}

@Injectable()
export class UsageService {
  private readonly store = new Map<string, UsageCounter>();

  private monthStart(): Date {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  private getCounter(businessId: string): UsageCounter {
    if (!this.store.has(businessId)) {
      this.store.set(businessId, {
        businessId,
        aiChatRequests: 0,
        sttRequests: 0,
        ttsRequests: 0,
        totalApiCalls: 0,
        inputTokens: 0,
        outputTokens: 0,
        estimatedAiCostInPaise: 0,
        resetAt: this.monthStart(),
      });
    }
    const counter = this.store.get(businessId)!;
    // Reset at start of each month
    const ms = this.monthStart();
    if (counter.resetAt.getTime() < ms.getTime()) {
      counter.aiChatRequests = 0;
      counter.sttRequests = 0;
      counter.ttsRequests = 0;
      counter.totalApiCalls = 0;
      counter.inputTokens = 0;
      counter.outputTokens = 0;
      counter.estimatedAiCostInPaise = 0;
      counter.resetAt = ms;
    }
    return counter;
  }

  record(input: RecordUsageInput): void {
    const counter = this.getCounter(input.businessId);
    counter.totalApiCalls++;

    if (input.type === 'ai_chat') {
      counter.aiChatRequests++;
      const inTok = input.inputTokens ?? 0;
      const outTok = input.outputTokens ?? 0;
      counter.inputTokens += inTok;
      counter.outputTokens += outTok;

      const providerKey = (input.provider ?? 'default').toLowerCase();
      const rates = COST_RATES_PAISE_PER_1K[providerKey] ?? COST_RATES_PAISE_PER_1K['default']!;
      // Integer arithmetic: tokens * rate / 1000 rounded
      const costInPaise = Math.round((inTok * rates.input + outTok * rates.output) / 1000);
      counter.estimatedAiCostInPaise += costInPaise;
    } else if (input.type === 'stt') {
      counter.sttRequests++;
    } else if (input.type === 'tts') {
      counter.ttsRequests++;
    }
  }

  getUsage(businessId: string): UsageCounter {
    return this.getCounter(businessId);
  }

  findAll(): UsageCounter[] {
    return Array.from(this.store.values());
  }
}
