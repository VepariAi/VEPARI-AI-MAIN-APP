// AI provider abstraction layer — PROMPT 114.
// Every concrete AI provider implements AiProvider so the gateway
// can route and fall back without coupling to vendor SDKs.

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatOptions {
  maxTokens?: number;
  temperature?: number;
}

export interface ChatResult {
  reply: string;
  /** Provider that served the request */
  provider: string;
  /** Input tokens consumed (approximate); undefined when provider does not report */
  inputTokens?: number | undefined;
  /** Output tokens consumed (approximate); undefined when provider does not report */
  outputTokens?: number | undefined;
}

export interface ExtractionResult<T> {
  data: T;
  provider: string;
}

export interface AiProvider {
  readonly name: string;
  /** Returns true when the provider is configured and ready. */
  isAvailable(): boolean;
  /** Send a chat completion request. Throws on hard failure (network, auth). */
  chat(messages: ChatMessage[], systemPrompt: string, opts?: ChatOptions): Promise<ChatResult>;
}
