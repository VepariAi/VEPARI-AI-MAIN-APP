// OAuth / credential flow — PROMPT 232.
//
// Manages the authorization-code handshake for OAUTH providers without leaking
// credentials to the client. Two responsibilities:
//   1. Build the provider authorize URL with a signed, single-use `state` token
//      that binds the callback to this business + connection (CSRF defense).
//   2. Validate the callback `state` before any code→token exchange.
//
// The signing secret and provider client secrets stay server-side. This service
// never returns a client secret to a caller.

import { Injectable, BadRequestException } from '@nestjs/common';
import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';

export interface AuthorizeUrlInput {
  providerId: string;
  businessId: string;
  connectionId: string;
  clientId: string;
  authorizeEndpoint: string;
  redirectUri: string;
  scopes: string[];
  /** Max age of the state token, seconds. Default 600 (10 min). */
  stateTtlSeconds?: number;
}

export interface StatePayload {
  providerId: string;
  businessId: string;
  connectionId: string;
  nonce: string;
  issuedAt: number;
}

const DEFAULT_STATE_TTL = 600;

@Injectable()
export class OAuthFlowService {
  private readonly signingSecret =
    process.env['OAUTH_STATE_SECRET'] ?? process.env['JWT_SECRET'] ?? '';

  /** Build the provider authorize URL and the signed state to round-trip. */
  buildAuthorizeUrl(input: AuthorizeUrlInput): { url: string; state: string } {
    if (!this.signingSecret) {
      throw new BadRequestException('OAuth state signing secret not configured');
    }
    const payload: StatePayload = {
      providerId: input.providerId,
      businessId: input.businessId,
      connectionId: input.connectionId,
      nonce: randomBytes(8).toString('hex'),
      issuedAt: Math.floor(Date.now() / 1000),
    };
    const state = this.signState(payload);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: input.clientId,
      redirect_uri: input.redirectUri,
      scope: input.scopes.join(' '),
      state,
    });
    const sep = input.authorizeEndpoint.includes('?') ? '&' : '?';
    return { url: `${input.authorizeEndpoint}${sep}${params.toString()}`, state };
  }

  /** Validate a callback state token; returns the bound payload or throws. */
  validateState(state: string, ttlSeconds = DEFAULT_STATE_TTL): StatePayload {
    const parts = state.split('.');
    if (parts.length !== 2) throw new BadRequestException('Malformed OAuth state');
    const [body, sig] = parts as [string, string];

    const expectedSig = this.hmac(body);
    if (!this.safeEqual(expectedSig, sig)) {
      throw new BadRequestException('Invalid OAuth state signature');
    }

    let payload: StatePayload;
    try {
      payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as StatePayload;
    } catch {
      throw new BadRequestException('Corrupt OAuth state');
    }

    const age = Math.floor(Date.now() / 1000) - payload.issuedAt;
    if (age > ttlSeconds) throw new BadRequestException('Expired OAuth state');

    return payload;
  }

  private signState(payload: StatePayload): string {
    const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
    return `${body}.${this.hmac(body)}`;
  }

  private hmac(body: string): string {
    return createHmac('sha256', this.signingSecret).update(body).digest('hex');
  }

  private safeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    try {
      return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
    } catch {
      return false;
    }
  }
}
