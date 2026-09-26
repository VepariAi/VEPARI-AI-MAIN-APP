// OpenAI provider implementation — PROMPT 114.
// Implements AiProvider using the Chat Completions API.

import { Logger } from '@nestjs/common';
import type { AiProvider, ChatMessage, ChatOptions, ChatResult } from '../provider.interface';

export class OpenAiProvider implements AiProvider {
  readonly name = 'openai';
  private readonly logger = new Logger(OpenAiProvider.name);
  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey: string, model = 'gpt-4o-mini') {
    this.apiKey = apiKey;
    this.model = model;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  async chat(messages: ChatMessage[], systemPrompt: string, opts: ChatOptions = {}): Promise<ChatResult> {
    const allMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: opts.maxTokens ?? 256,
        messages: allMessages,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`OpenAI API ${response.status}: ${body}`);
      throw new Error(`OpenAI API error ${response.status}`);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    const reply = data.choices[0]?.message.content ?? '';
    const inputTokens = data.usage?.prompt_tokens;
    const outputTokens = data.usage?.completion_tokens;
    return {
      reply,
      provider: this.name,
      ...(inputTokens !== undefined ? { inputTokens } : {}),
      ...(outputTokens !== undefined ? { outputTokens } : {}),
    };
  }
}
