// AI Gateway service — routes structured extraction through the AI provider.
// Provider API keys stay server-side; no key ever reaches the mobile client.

import { Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';

export type MemoryCandidateType =
  | 'sale'
  | 'expense'
  | 'credit_given'
  | 'credit_received'
  | 'stock_update'
  | 'customer_note'
  | 'supplier_note'
  | 'unknown';

export interface MemoryCandidate {
  type: MemoryCandidateType;
  amountPaise?: number;    // Always paise (integer), never float rupees
  description?: string;
  party?: string;          // Customer or supplier name
  itemName?: string;
  quantity?: number;
  rawTranscript: string;
  confidence: number;      // 0-1
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  async extractMemoryCandidates(transcript: string): Promise<MemoryCandidate[]> {
    if (!transcript.trim()) throw new BadRequestException('transcript is required');

    const apiKey = process.env['OPENAI_API_KEY'] ?? process.env['ANTHROPIC_API_KEY'];
    if (!apiKey) {
      throw new InternalServerErrorException('AI provider key not configured');
    }

    const isAnthropic = Boolean(process.env['ANTHROPIC_API_KEY']);
    if (isAnthropic) {
      return this.extractViaAnthropic(transcript, apiKey);
    }
    return this.extractViaOpenAI(transcript, apiKey);
  }

  private async extractViaAnthropic(transcript: string, apiKey: string): Promise<MemoryCandidate[]> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: EXTRACTION_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Transcript: "${transcript}"` }],
      }),
    });

    if (!response.ok) {
      this.logger.error(`Anthropic API error: ${response.status}`);
      throw new InternalServerErrorException('AI extraction service error');
    }

    const data = await response.json() as {
      content: Array<{ type: string; text: string }>;
    };
    const text = data.content.find(c => c.type === 'text')?.text ?? '[]';
    return this.parseExtractionResponse(text, transcript);
  }

  private async extractViaOpenAI(transcript: string, apiKey: string): Promise<MemoryCandidate[]> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
          { role: 'user', content: `Transcript: "${transcript}"` },
        ],
      }),
    });

    if (!response.ok) {
      this.logger.error(`OpenAI API error: ${response.status}`);
      throw new InternalServerErrorException('AI extraction service error');
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
    };
    const text = data.choices[0]?.message.content ?? '[]';
    return this.parseExtractionResponse(text, transcript);
  }

  private parseExtractionResponse(text: string, transcript: string): MemoryCandidate[] {
    try {
      const parsed = JSON.parse(text) as { candidates?: unknown[] };
      const candidates = Array.isArray(parsed.candidates) ? parsed.candidates : (Array.isArray(parsed) ? parsed : []);
      return (candidates as Array<Record<string, unknown>>).map(c => {
        const candidate: MemoryCandidate = {
          type: (c['type'] as MemoryCandidateType) ?? 'unknown',
          rawTranscript: transcript,
          confidence: Math.min(1, Math.max(0, Number(c['confidence'] ?? 0.8))),
        };
        if (c['amountPaise'] !== undefined) candidate.amountPaise = Math.round(Number(c['amountPaise']));
        if (c['description'] !== undefined) candidate.description = c['description'] as string;
        if (c['party'] !== undefined) candidate.party = c['party'] as string;
        if (c['itemName'] !== undefined) candidate.itemName = c['itemName'] as string;
        if (c['quantity'] !== undefined) candidate.quantity = Number(c['quantity']);
        return candidate;
      });
    } catch {
      this.logger.warn('Failed to parse AI extraction response');
      return [{
        type: 'unknown',
        rawTranscript: transcript,
        confidence: 0.3,
        description: transcript,
      }];
    }
  }
}

const EXTRACTION_SYSTEM_PROMPT = `
You are a business intelligence extractor for Indian MSMEs. Extract structured business events from voice transcripts (Hindi, English, or mixed).

Return JSON: { "candidates": [ { "type": "sale|expense|credit_given|credit_received|stock_update|customer_note|supplier_note|unknown", "amountPaise": <integer paise, 100 paise = 1 rupee>, "description": "<short description>", "party": "<customer/supplier name if mentioned>", "itemName": "<product/service name>", "quantity": <number>, "confidence": <0-1> } ] }

Rules:
- amountPaise is ALWAYS an integer (paise). Convert rupees: ₹500 = 50000 paise.
- Extract one candidate per business event mentioned.
- If amount is ambiguous, omit amountPaise.
- Respond ONLY with valid JSON.
`.trim();
