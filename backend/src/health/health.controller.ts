// Health and readiness endpoints — PROMPT 185 (observability).
// /health      — liveness: returns 200 while process is alive
// /health/live — kubernetes liveness probe
// /health/ready — kubernetes readiness probe; checks DB and critical deps

import { Controller, Get, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      memoryMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    };
  }

  @Get('live')
  live() {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready() {
    const checks: Record<string, 'ok' | 'error'> = {};

    // DB connectivity
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks['database'] = 'ok';
    } catch {
      checks['database'] = 'error';
    }

    const allOk = Object.values(checks).every(v => v === 'ok');
    if (!allOk) {
      throw new InternalServerErrorException({ status: 'error', checks });
    }

    return { status: 'ok', checks };
  }
}
