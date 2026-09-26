// Inbound provider webhook endpoint — PROMPT 234.
//
// Unauthenticated by JWT (external providers have no session); authenticity is
// proven by the per-provider signature the adapter verifies. The raw body is
// read from Fastify's rawBody so HMAC runs over the exact bytes. The webhook
// secret is resolved server-side per provider from the environment.

import { Controller, Post, Param, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { WebhookProcessorService } from './webhook-processor.service';

interface RawBodyRequest extends FastifyRequest {
  rawBody?: Buffer | string;
}

@ApiTags('connections')
@Controller('webhooks/connections')
export class ConnectionWebhookController {
  constructor(private readonly processor: WebhookProcessorService) {}

  @Post(':providerId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive and verify an inbound provider webhook' })
  async receive(@Param('providerId') providerId: string, @Req() req: RawBodyRequest) {
    const raw = req.rawBody;
    const rawBody = raw ? (Buffer.isBuffer(raw) ? raw.toString('utf8') : raw) : '';
    const headers = (req.headers ?? {}) as Record<string, string | undefined>;

    // Per-provider webhook secret from the server-side environment.
    const secret = process.env[`WEBHOOK_SECRET_${providerId.toUpperCase()}`] ?? '';

    const outcome = await this.processor.process({ providerId, rawBody, headers, secret });

    // Always 200 with an accepted flag: providers retry on non-2xx, so we ack
    // receipt and report acceptance in the body rather than leaking detail via status.
    return { accepted: outcome.accepted, recordCount: outcome.records.length };
  }
}
