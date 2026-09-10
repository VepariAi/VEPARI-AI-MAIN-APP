// Unit tests for ToolCallingService — Prompt 119.
// ProviderGatewayService is mocked — no real AI calls are made.

import { ToolCallingService, ToolDefinition } from '../tool-calling.service';

function makeGateway(replyOverride?: string) {
  return {
    chat: jest.fn().mockResolvedValue({
      reply: replyOverride ?? 'The answer is 42.',
      provider: 'anthropic',
      inputTokens: 100,
      outputTokens: 50,
    }),
  };
}

function makeService(gateway: ReturnType<typeof makeGateway>) {
  return new ToolCallingService(gateway as unknown as ConstructorParameters<typeof ToolCallingService>[0]);
}

// ── registerTool / executeTool ────────────────────────────────────────────────

describe('ToolCallingService.registerTool + executeTool', () => {
  it('executes a registered tool with correct input', async () => {
    const service = makeService(makeGateway());
    service.registerTool({
      name: 'add',
      description: 'Adds two numbers',
      inputSchema: { a: 'number', b: 'number' },
      async execute(input: unknown) {
        const { a, b } = input as { a: number; b: number };
        return { sum: a + b };
      },
    });

    const result = await service.executeTool({ toolName: 'add', input: { a: 3, b: 5 } });
    expect(result.toolName).toBe('add');
    expect(result.output).toEqual({ sum: 8 });
    expect(result.error).toBeUndefined();
  });

  it('returns error for unregistered tool', async () => {
    const service = makeService(makeGateway());
    const result = await service.executeTool({ toolName: 'nonexistent', input: {} });
    expect(result.error).toContain('nonexistent');
    expect(result.output).toBeNull();
  });

  it('captures tool execution errors without throwing', async () => {
    const service = makeService(makeGateway());
    service.registerTool({
      name: 'failing_tool',
      description: 'Always fails',
      inputSchema: {},
      async execute() { throw new Error('Tool exploded'); },
    });

    const result = await service.executeTool({ toolName: 'failing_tool', input: {} });
    expect(result.error).toContain('Tool exploded');
    expect(result.output).toBeNull();
  });
});

// ── getRegisteredTools ────────────────────────────────────────────────────────

describe('ToolCallingService.getRegisteredTools', () => {
  it('lists registered tool names', () => {
    const service = makeService(makeGateway());
    const tool: ToolDefinition = {
      name: 'lookup',
      description: 'Looks something up',
      inputSchema: {},
      async execute() { return {}; },
    };
    service.registerTool(tool);
    expect(service.getRegisteredTools()).toContain('lookup');
  });

  it('returns empty array when no tools registered', () => {
    const service = makeService(makeGateway());
    expect(service.getRegisteredTools()).toHaveLength(0);
  });
});

// ── chatWithTools — no tool call ──────────────────────────────────────────────

describe('ToolCallingService.chatWithTools — plain reply', () => {
  it('returns AI reply when no tool call in response', async () => {
    const gateway = makeGateway('Here is the sales report for April.');
    const service = makeService(gateway);
    const reply = await service.chatWithTools('Show me April sales', 'You are a helpful assistant');
    expect(reply).toBe('Here is the sales report for April.');
    expect(gateway.chat).toHaveBeenCalledTimes(1);
  });
});

// ── chatWithTools — single tool call ─────────────────────────────────────────

describe('ToolCallingService.chatWithTools — with tool call', () => {
  it('executes tool when AI returns a tool_call JSON block', async () => {
    const toolCallJson = JSON.stringify({ tool_call: { name: 'get_sales', input: { month: 'April' } } });
    const gateway = makeGateway();
    let callCount = 0;
    (gateway.chat as jest.Mock).mockImplementation(async () => {
      callCount++;
      if (callCount === 1) return { reply: toolCallJson, provider: 'anthropic' };
      return { reply: 'Sales for April were ₹12,000.', provider: 'anthropic' };
    });

    const service = makeService(gateway);
    const executeSpy = jest.fn().mockResolvedValue({ total: 1200000 });
    service.registerTool({ name: 'get_sales', description: 'Get sales', inputSchema: {}, execute: executeSpy });

    const reply = await service.chatWithTools('Show April sales', 'You are helpful');
    expect(executeSpy).toHaveBeenCalledWith({ month: 'April' });
    expect(reply).toBe('Sales for April were ₹12,000.');
    expect(gateway.chat).toHaveBeenCalledTimes(2);
  });

  it('stops after maxRounds without infinite loop', async () => {
    // AI always returns a tool call — should stop after maxRounds
    const gateway = makeGateway(JSON.stringify({ tool_call: { name: 'noop', input: {} } }));
    const service = makeService(gateway);
    service.registerTool({ name: 'noop', description: 'No-op', inputSchema: {}, async execute() { return null; } });

    const reply = await service.chatWithTools('Test', 'System', { maxRounds: 2 });
    expect(gateway.chat).toHaveBeenCalledTimes(2);
    // Last reply is the (still tool_call) reply from the last round
    expect(reply).toBeDefined();
  });
});

// ── UsageService integration ──────────────────────────────────────────────────

describe('ProviderGatewayService cost tracking', () => {
  it('usageService fields are present on UsageCounter', async () => {
    const { UsageService } = await import('../../usage/usage.service');
    const svc = new UsageService();
    svc.record({ businessId: 'b1', type: 'ai_chat', provider: 'anthropic', inputTokens: 1000, outputTokens: 200 });
    const usage = svc.getUsage('b1');
    expect(usage.inputTokens).toBe(1000);
    expect(usage.outputTokens).toBe(200);
    expect(usage.estimatedAiCostInPaise).toBeGreaterThan(0);
    expect(Number.isInteger(usage.estimatedAiCostInPaise)).toBe(true);
  });

  it('records AI cost with integer arithmetic', async () => {
    const { UsageService } = await import('../../usage/usage.service');
    const svc = new UsageService();
    // 2000 input tokens at anthropic rate (25 paise/1K) = 50 paise
    // 500 output tokens at anthropic rate (126 paise/1K) = 63 paise → Math.round(63) = 63
    svc.record({ businessId: 'b2', type: 'ai_chat', provider: 'anthropic', inputTokens: 2000, outputTokens: 500 });
    const usage = svc.getUsage('b2');
    // 2000 * 25 / 1000 + 500 * 126 / 1000 = 50 + 63 = 113 paise
    expect(usage.estimatedAiCostInPaise).toBe(113);
  });

  it('counts ai_chat requests separately from stt/tts', async () => {
    const { UsageService } = await import('../../usage/usage.service');
    const svc = new UsageService();
    svc.record({ businessId: 'b3', type: 'ai_chat', inputTokens: 100, outputTokens: 50 });
    svc.record({ businessId: 'b3', type: 'stt' });
    svc.record({ businessId: 'b3', type: 'tts' });
    svc.record({ businessId: 'b3', type: 'api' });
    const usage = svc.getUsage('b3');
    expect(usage.aiChatRequests).toBe(1);
    expect(usage.sttRequests).toBe(1);
    expect(usage.ttsRequests).toBe(1);
    expect(usage.totalApiCalls).toBe(4);
  });
});
