// Structured JSON logging — PROMPT 210 (structured logging implementation).
//
// Emits one JSON object per log line so log aggregators can index by field.
// Every line automatically carries the current correlation id (PROMPT 213).
// No secrets are ever logged: `redact()` strips known-sensitive keys before
// serialization. Dependency-free — writes to stdout/stderr directly.

import { Injectable, LoggerService } from '@nestjs/common';
import { getContext } from './correlation';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Keys whose values must never appear in logs (case-insensitive substring match).
const SENSITIVE_KEY_PATTERNS = [
  'password', 'token', 'secret', 'apikey', 'api_key', 'authorization',
  'otp', 'pin', 'refreshtoken', 'accesstoken', 'creditcard', 'cvv',
];

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return SENSITIVE_KEY_PATTERNS.some(p => lower.includes(p));
}

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 6 || value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(v => redact(v, depth + 1));
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = isSensitiveKey(k) ? '[REDACTED]' : redact(v, depth + 1);
    }
    return out;
  }
  return value;
}

@Injectable()
export class StructuredLogger implements LoggerService {
  private readonly minLevel: LogLevel =
    (process.env['LOG_LEVEL'] as LogLevel) ??
    (process.env['NODE_ENV'] === 'production' ? 'info' : 'debug');

  private static readonly ORDER: Record<LogLevel, number> = {
    debug: 10, info: 20, warn: 30, error: 40,
  };

  private shouldLog(level: LogLevel): boolean {
    return StructuredLogger.ORDER[level] >= StructuredLogger.ORDER[this.minLevel];
  }

  private emit(level: LogLevel, message: unknown, context?: string, meta?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;
    const ctx = getContext();
    const line = {
      ts: new Date().toISOString(),
      level,
      msg: typeof message === 'string' ? message : JSON.stringify(redact(message)),
      ...(context ? { context } : {}),
      ...(ctx?.correlationId ? { correlationId: ctx.correlationId } : {}),
      ...(ctx?.businessId ? { businessId: ctx.businessId } : {}),
      ...(ctx?.userId ? { userId: ctx.userId } : {}),
      ...(meta ? { meta: redact(meta) } : {}),
    };
    const serialized = JSON.stringify(line);
    if (level === 'error' || level === 'warn') {
      process.stderr.write(serialized + '\n');
    } else {
      process.stdout.write(serialized + '\n');
    }
  }

  // NestJS LoggerService interface
  log(message: unknown, context?: string): void {
    this.emit('info', message, context);
  }
  error(message: unknown, stackOrContext?: string, context?: string): void {
    this.emit('error', message, context ?? stackOrContext, stackOrContext ? { stack: stackOrContext } : undefined);
  }
  warn(message: unknown, context?: string): void {
    this.emit('warn', message, context);
  }
  debug(message: unknown, context?: string): void {
    this.emit('debug', message, context);
  }
  verbose(message: unknown, context?: string): void {
    this.emit('debug', message, context);
  }

  /** Structured info with arbitrary (redacted) fields. */
  info(message: string, meta?: Record<string, unknown>, context?: string): void {
    this.emit('info', message, context, meta);
  }
}
