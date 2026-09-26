// HTTP request logging + timing interceptor — PROMPTS 210, 212, 213.
//
// Wraps every request in a correlation context, records request-duration
// metrics, and emits one structured access-log line per completed request.
// The correlation id is echoed back to the client via the response header so
// clients and support can quote it when reporting issues.

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  runWithContext,
  newCorrelationId,
  CORRELATION_HEADER,
  type RequestContext,
} from './correlation';
import { MetricsService } from './metrics.service';
import { StructuredLogger } from './structured-logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly metrics: MetricsService,
    private readonly logger: StructuredLogger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<FastifyRequest>();
    const reply = http.getResponse<FastifyReply>();

    const headers = (req.headers ?? {}) as Record<string, string | undefined>;
    const incoming = headers[CORRELATION_HEADER];
    const correlationId = incoming && incoming.length <= 64 ? incoming : newCorrelationId();

    const method = req.method ?? 'GET';
    const path = (req.routeOptions?.url as string | undefined) ?? req.url ?? 'unknown';

    const ctx: RequestContext = {
      correlationId,
      startTime: Date.now(),
      method,
      path,
    };

    // Echo the correlation id back so clients can reference it.
    void reply.header(CORRELATION_HEADER, correlationId);

    return runWithContext(ctx, () =>
      next.handle().pipe(
        tap(() => this.finish(ctx, reply.statusCode ?? 200)),
        catchError((err: unknown) => {
          const status = this.statusFromError(err);
          this.finish(ctx, status, err);
          return throwError(() => err);
        }),
      ),
    );
  }

  private finish(ctx: RequestContext, status: number, err?: unknown): void {
    const durationMs = Date.now() - ctx.startTime;
    const labels = { method: ctx.method ?? 'GET', route: ctx.path ?? 'unknown' };

    this.metrics.increment('http_requests_total', labels);
    this.metrics.increment('http_responses_total', {
      ...labels,
      status: String(status),
    });
    this.metrics.observe('http_request_duration', durationMs, labels);
    if (status >= 500) {
      this.metrics.increment('http_errors_total', labels);
    }

    this.logger.info('http_request', {
      method: ctx.method,
      path: ctx.path,
      status,
      durationMs,
      ...(err ? { error: err instanceof Error ? err.message : String(err) } : {}),
    }, 'HTTP');
  }

  private statusFromError(err: unknown): number {
    if (err && typeof err === 'object' && 'getStatus' in err) {
      const fn = (err as { getStatus?: () => number }).getStatus;
      if (typeof fn === 'function') return fn.call(err);
    }
    return 500;
  }
}
