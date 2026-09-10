// AI provider gateway — PROMPTS 114 + 125.
//
// Routes requests through available providers with retry and cross-provider
// fallback.  Provider priority: Anthropic → OpenAI.  Each provider gets
// up to MAX_RETRIES attempts before the next provider is tried.
//
// Usage + cost tracking (Prompt 124) is handled here via UsageService so
// every call is accounted for regardless of which provider served it.

import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import type { AiProvider, ChatMessage, ChatOptions, ChatResult } from './provider.interface';
import { AnthropicProvider } from './providers/anthropic.provider';
import { OpenAiProvider } from './providers/openai.provider';
import { UsageService } from '../usage/usage.service';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

async function sleep(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}

@Injectable()
export class ProviderGatewayService {
  private readonly logger = new Logger(ProviderGatewayService.name);
  private readonly providers: AiProvider[];

  constructor(private readonly usageService: UsageService) {
    const anthropicKey = process.env['ANTHROPIC_API_KEY'];
    const openaiKey = process.env['OPENAI_API_KEY'];

    this.providers = [
      ...(anthropicKey ? [new AnthropicProvider(anthropicKey)] : []),
      ...(openaiKey ? [new OpenAiProvider(openaiKey)] : []),
    ];
  }

  get hasProvider(): boolean {
    return this.providers.some(p => p.isAvailable());
  }

  /**
   * Send a chat request through the provider chain.
   * Tries Anthropic first, falls back to OpenAI on failure.
   * Retries each provider up to MAX_RETRIES times with exponential delay.
   * Records usage (tokens + estimated cost) via UsageService after every
   * successful call.
   */
  async chat(
    messages: ChatMessage[],
    systemPrompt: string,
    opts?: ChatOptions & { businessId?: string },
  ): Promise<ChatResult> {
    if (!this.hasProvider) {
      throw new InternalServerErrorException('No AI provider configured');
    }

    const errors: string[] = [];

    for (const provider of this.providers) {
      if (!provider.isAvailable()) continue;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const result = await provider.chat(messages, systemPrompt, opts);
          if (attempt > 1 || errors.length > 0) {
            this.logger.log(`Provider ${provider.name} succeeded on attempt ${attempt}`);
          }

          // Record usage so every AI call is cost-accounted
          if (opts?.businessId) {
            this.usageService.record({
              businessId: opts.businessId,
              type: 'ai_chat',
              provider: result.provider,
              ...(result.inputTokens !== undefined ? { inputTokens: result.inputTokens } : {}),
              ...(result.outputTokens !== undefined ? { outputTokens: result.outputTokens } : {}),
            });
          }

          return result;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`${provider.name}[${attempt}]: ${msg}`);
          this.logger.warn(`Provider ${provider.name} attempt ${attempt} failed: ${msg}`);

          // Don't retry on auth errors — they won't self-heal
          if (msg.includes('401') || msg.includes('403')) break;

          if (attempt < MAX_RETRIES) {
            await sleep(RETRY_DELAY_MS * attempt);
          }
        }
      }
    }

    this.logger.error(`All providers failed: ${errors.join(' | ')}`);
    throw new InternalServerErrorException('AI service temporarily unavailable');
  }
}
