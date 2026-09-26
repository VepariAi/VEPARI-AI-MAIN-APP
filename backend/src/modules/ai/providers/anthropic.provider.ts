// Anthropic (Claude) provider implementation — PROMPT 114.
// Implements AiProvider using the Messages API.

import { Logger } from '@nestjs/common';
import type { AiProvider, ChatMessage, ChatOptions, ChatResult } from '../provider.interface';

export class AnthropicProvider implements AiProvider {
  readonly name = 'anthropic';
  private readonly logger = new Logger(AnthropicProvider.name);
  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey: string, model = 'claude-haiku-4-5-20251001') {
    this.apiKey = apiKey;
    this.model = model;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  async chat(messages: ChatMessage[], systemPrompt: string, opts: ChatOptions = {}): Promise<ChatResult> {
    const userMessages = messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: opts.maxTokens ?? 256,
        system: systemPrompt,
        messages: userMessages,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Anthropic API ${response.status}: ${body}`);
      throw new Error(`Anthropic API error ${response.status}`);
    }

    const data = await response.json() as {
      content: Array<{ type: string; text: string }>;
      usage?: { input_tokens?: number; output_tokens?: number };
    };

    const reply = data.content.find(c => c.type === 'text')?.text ?? '';
    const inputTokens = data.usage?.input_tokens;
    const outputTokens = data.usage?.output_tokens;
    return {
      reply,
      provider: this.name,
      ...(inputTokens !== undefined ? { inputTokens } : {}),
      ...(outputTokens !== undefined ? { outputTokens } : {}),
    };
  }
}
