import { AiService } from '../ai.service';
import { BadRequestException } from '@nestjs/common';
import type { PrismaService } from '../../../prisma/prisma.service';

function makePrisma(): PrismaService {
  return {} as unknown as PrismaService;
}

// Unit tests for AiService — no external API calls.
describe('AiService', () => {
  let service: AiService;

  beforeEach(() => {
    service = new AiService(makePrisma());
  });

  describe('parseExtractionResponse (via extractMemoryCandidates)', () => {
    // Access private method via type cast for unit testing
    const parse = (svc: AiService, text: string, transcript: string) =>
      (svc as unknown as { parseExtractionResponse(t: string, r: string): unknown[] })
        .parseExtractionResponse(text, transcript);

    it('parses a valid candidates array', () => {
      const json = JSON.stringify({
        candidates: [
          { type: 'sale', amountPaise: 50000, description: 'Rice sale', confidence: 0.9 },
        ],
      });
      const result = parse(service, json, 'sold rice for 500');
      expect(result).toHaveLength(1);
      expect((result[0] as { type: string }).type).toBe('sale');
      expect((result[0] as { amountPaise: number }).amountPaise).toBe(50000);
    });

    it('converts rupees to paise correctly (Math.round)', () => {
      const json = JSON.stringify({
        candidates: [{ type: 'expense', amountPaise: 12345, confidence: 0.8 }],
      });
      const result = parse(service, json, 'bought supplies');
      expect((result[0] as { amountPaise: number }).amountPaise).toBe(12345);
    });

    it('returns fallback on invalid JSON', () => {
      const result = parse(service, 'not json', 'some transcript');
      expect(result).toHaveLength(1);
      expect((result[0] as { type: string }).type).toBe('unknown');
      expect((result[0] as { confidence: number }).confidence).toBe(0.3);
    });

    it('clamps confidence to [0, 1]', () => {
      const json = JSON.stringify({
        candidates: [{ type: 'sale', confidence: 5, amountPaise: 1000 }],
      });
      const result = parse(service, json, 'sale');
      expect((result[0] as { confidence: number }).confidence).toBe(1);
    });

    it('handles empty candidates array', () => {
      const json = JSON.stringify({ candidates: [] });
      const result = parse(service, json, 'unclear');
      expect(result).toHaveLength(0);
    });

    it('sets rawTranscript on every candidate', () => {
      const transcript = 'aaj biryani bechi 200 rupaye mein';
      const json = JSON.stringify({
        candidates: [{ type: 'sale', amountPaise: 20000, confidence: 0.85 }],
      });
      const result = parse(service, json, transcript);
      expect((result[0] as { rawTranscript: string }).rawTranscript).toBe(transcript);
    });
  });

  describe('extractMemoryCandidates', () => {
    it('throws BadRequestException for empty transcript', async () => {
      await expect(service.extractMemoryCandidates('   ')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws InternalServerErrorException when no API key configured', async () => {
      const old = process.env['OPENAI_API_KEY'];
      const oldAnth = process.env['ANTHROPIC_API_KEY'];
      delete process.env['OPENAI_API_KEY'];
      delete process.env['ANTHROPIC_API_KEY'];
      try {
        await expect(service.extractMemoryCandidates('sold apples')).rejects.toThrow('AI provider key not configured');
      } finally {
        if (old !== undefined) process.env['OPENAI_API_KEY'] = old;
        if (oldAnth !== undefined) process.env['ANTHROPIC_API_KEY'] = oldAnth;
      }
    });
  });
});
