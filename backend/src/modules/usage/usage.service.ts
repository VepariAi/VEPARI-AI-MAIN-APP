// Usage tracking — persisted per business per billing month in MySQL (DL-011).
//
// Cost rates (PROMPT 124):
//   Anthropic Claude Sonnet  — input: $3/M tokens, output: $15/M tokens
//   OpenAI GPT-4o-mini       — input: $0.15/M tokens, output: $0.60/M tokens
// Rates stored in paise per 1,000 tokens (integer arithmetic).
//
// Each billing month is its own row (unique businessId+periodStart), so counters
// "reset" automatically at month boundaries — no mutation of prior periods.
// record() is fire-and-forget from hot paths and never throws into the caller.

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// ── Cost table (paise per 1 000 input/output tokens) ─────────────────────────
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
  inputTokens: number;
  outputTokens: number;
  estimatedAiCostInPaise: number;
  resetAt: Date; // start of the current billing period (month)
}

export interface RecordUsageInput {
  businessId: string;
  type: 'ai_chat' | 'stt' | 'tts' | 'api';
  provider?: string;
  inputTokens?: number;
  outputTokens?: number;
}

function monthStart(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function zeroed(businessId: string, periodStart: Date): UsageCounter {
  return {
    businessId,
    aiChatRequests: 0,
    sttRequests: 0,
    ttsRequests: 0,
    totalApiCalls: 0,
    inputTokens: 0,
    outputTokens: 0,
    estimatedAiCostInPaise: 0,
    resetAt: periodStart,
  };
}

@Injectable()
export class UsageService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record one usage event with atomic increments. Never throws into the
   * caller — usage accounting must not break the operation being measured.
   */
  async record(input: RecordUsageInput): Promise<void> {
    const periodStart = monthStart();

    const isChat = input.type === 'ai_chat';
    const inTok = isChat ? input.inputTokens ?? 0 : 0;
    const outTok = isChat ? input.outputTokens ?? 0 : 0;

    let cost = 0;
    if (isChat) {
      const rates = COST_RATES_PAISE_PER_1K[(input.provider ?? 'default').toLowerCase()]
        ?? COST_RATES_PAISE_PER_1K['default']!;
      cost = Math.round((inTok * rates.input + outTok * rates.output) / 1000);
    }

    const aiChatDelta = isChat ? 1 : 0;
    const sttDelta = input.type === 'stt' ? 1 : 0;
    const ttsDelta = input.type === 'tts' ? 1 : 0;

    try {
      await this.prisma.usageCounter.upsert({
        where: { businessId_periodStart: { businessId: input.businessId, periodStart } },
        create: {
          businessId: input.businessId,
          periodStart,
          totalApiCalls: 1,
          aiChatRequests: aiChatDelta,
          sttRequests: sttDelta,
          ttsRequests: ttsDelta,
          inputTokens: inTok,
          outputTokens: outTok,
          estimatedAiCostInPaise: cost,
        },
        update: {
          totalApiCalls: { increment: 1 },
          aiChatRequests: { increment: aiChatDelta },
          sttRequests: { increment: sttDelta },
          ttsRequests: { increment: ttsDelta },
          inputTokens: { increment: inTok },
          outputTokens: { increment: outTok },
          estimatedAiCostInPaise: { increment: cost },
        },
      });
    } catch {
      // Usage accounting is best-effort; swallow to protect the hot path.
    }
  }

  async getUsage(businessId: string): Promise<UsageCounter> {
    const periodStart = monthStart();
    const row = await this.prisma.usageCounter.findUnique({
      where: { businessId_periodStart: { businessId, periodStart } },
    });
    if (!row) return zeroed(businessId, periodStart);
    return {
      businessId: row.businessId,
      aiChatRequests: row.aiChatRequests,
      sttRequests: row.sttRequests,
      ttsRequests: row.ttsRequests,
      totalApiCalls: row.totalApiCalls,
      inputTokens: row.inputTokens,
      outputTokens: row.outputTokens,
      estimatedAiCostInPaise: row.estimatedAiCostInPaise,
      resetAt: row.periodStart,
    };
  }

  async findAll(): Promise<UsageCounter[]> {
    const periodStart = monthStart();
    const rows = await this.prisma.usageCounter.findMany({ where: { periodStart } });
    return rows.map(row => ({
      businessId: row.businessId,
      aiChatRequests: row.aiChatRequests,
      sttRequests: row.sttRequests,
      ttsRequests: row.ttsRequests,
      totalApiCalls: row.totalApiCalls,
      inputTokens: row.inputTokens,
      outputTokens: row.outputTokens,
      estimatedAiCostInPaise: row.estimatedAiCostInPaise,
      resetAt: row.periodStart,
    }));
  }
}
