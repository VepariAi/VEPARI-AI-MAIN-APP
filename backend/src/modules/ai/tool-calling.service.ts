// AI tool/function-calling layer — PROMPT 119.
// Enables the AI gateway to invoke server-side tools when structured
// extraction is needed beyond raw chat completions.
//
// Tools are pure functions: (input: unknown) => Promise<unknown>.
// No direct DB access from tools — they call domain services instead.

import { Injectable, Logger } from '@nestjs/common';
import { ProviderGatewayService } from './provider-gateway.service';

// ── Tool registry ─────────────────────────────────────────────────────────────

export interface ToolDefinition<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  /** JSON Schema for the input parameters */
  inputSchema: Record<string, unknown>;
  execute(input: TInput): Promise<TOutput>;
}

export interface ToolCall {
  toolName: string;
  input: unknown;
}

export interface ToolResult {
  toolName: string;
  output: unknown;
  error?: string;
}

export interface ToolChatOptions {
  maxTokens?: number;
  maxRounds?: number;  // max tool-call rounds before forced stop
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class ToolCallingService {
  private readonly logger = new Logger(ToolCallingService.name);
  private readonly tools = new Map<string, ToolDefinition>();

  constructor(private readonly gateway: ProviderGatewayService) {}

  /** Register a tool. Must be called before chatWithTools. */
  registerTool<TInput, TOutput>(tool: ToolDefinition<TInput, TOutput>): void {
    this.tools.set(tool.name, tool as ToolDefinition);
  }

  /** Execute one tool call by name. */
  async executeTool(call: ToolCall): Promise<ToolResult> {
    const tool = this.tools.get(call.toolName);
    if (!tool) {
      return { toolName: call.toolName, output: null, error: `Tool "${call.toolName}" not registered` };
    }
    try {
      const output = await tool.execute(call.input);
      return { toolName: call.toolName, output };
    } catch (err) {
      this.logger.error(`Tool ${call.toolName} failed: ${String(err)}`);
      return { toolName: call.toolName, output: null, error: String(err) };
    }
  }

  /**
   * Run a multi-round chat where the AI can request tool calls.
   * The AI signals tool usage by returning JSON blocks:
   *   {"tool_call": {"name": "toolName", "input": {...}}}
   * We execute the tool and feed the result back.
   */
  async chatWithTools(
    userMessage: string,
    systemPrompt: string,
    opts: ToolChatOptions = {},
  ): Promise<string> {
    const maxRounds = opts.maxRounds ?? 3;
    const maxTokens = opts.maxTokens ?? 512;

    const toolDocs = this.buildToolDocumentation();
    const fullSystem = `${systemPrompt}

Available tools (respond with a JSON tool_call object to use one):
${toolDocs}

When done, respond with plain text (no JSON tool_call).`;

    let conversationContext = userMessage;
    let lastReply = '';

    for (let round = 0; round < maxRounds; round++) {
      const result = await this.gateway.chat(
        [{ role: 'user', content: conversationContext }],
        fullSystem,
        { maxTokens },
      );
      lastReply = result.reply;

      const toolCall = this.parseToolCall(lastReply);
      if (!toolCall) break;

      // AI is requesting a tool call
      const toolResult = await this.executeTool(toolCall);
      this.logger.log(`Tool ${toolCall.toolName} executed: ${JSON.stringify(toolResult).slice(0, 200)}`);

      // Feed result back into context
      conversationContext += `\n\nTool ${toolCall.toolName} result:\n${JSON.stringify(toolResult.output)}`;
      if (toolResult.error) {
        conversationContext += `\n\nTool error: ${toolResult.error}`;
      }
    }

    return lastReply;
  }

  private parseToolCall(text: string): ToolCall | null {
    try {
      const start = text.indexOf('{"tool_call"');
      if (start === -1) return null;
      let depth = 0;
      let end = -1;
      for (let i = start; i < text.length; i++) {
        if (text[i] === '{') depth++;
        else if (text[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
      }
      if (end === -1) return null;
      const parsed = JSON.parse(text.slice(start, end + 1)) as { tool_call?: { name?: string; input?: unknown } };
      if (!parsed.tool_call?.name) return null;
      return { toolName: parsed.tool_call.name, input: parsed.tool_call.input ?? {} };
    } catch {
      return null;
    }
  }

  private buildToolDocumentation(): string {
    if (this.tools.size === 0) return '(none)';
    return Array.from(this.tools.values())
      .map(t => `- ${t.name}: ${t.description}`)
      .join('\n');
  }

  /** Return names of all registered tools. */
  getRegisteredTools(): string[] {
    return Array.from(this.tools.keys());
  }
}
