import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import helmet from '@fastify/helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

const ALLOWED_ORIGINS = process.env['ALLOWED_ORIGINS']
  ? process.env['ALLOWED_ORIGINS'].split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:19006'];

async function bootstrap() {
  const isProd = process.env['NODE_ENV'] === 'production';

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: isProd ? { level: 'warn' } : true }),
  );

  // Security headers
  await app.register(helmet, {
    contentSecurityPolicy: isProd,
    crossOriginEmbedderPolicy: false,
  });

  // Restrict CORS to known origins
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS not allowed'), false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Global input validation — strips unknown fields, rejects bad payloads
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // Consistent error shape for 4xx/5xx
  app.useGlobalFilters(new AllExceptionsFilter());

  app.setGlobalPrefix('v1', { exclude: ['/health', '/health/live', '/health/ready', '/metrics', '/metrics/json', '/metrics/alerts', '/robots.txt', '/.well-known/security.txt', '/llms.txt'] });

  // Swagger — dev/staging only; never expose API docs in production
  if (!isProd) {
    const { SwaggerModule, DocumentBuilder } = await import('@nestjs/swagger');
    const config = new DocumentBuilder()
      .setTitle('Vepari AI API')
      .setDescription('Internal API for the Vepari AI mobile application — development reference only')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
  }

  // robots.txt — disallow all crawlers (this is a private API server)
  const fastify = app.getHttpAdapter().getInstance();
  fastify.get('/robots.txt', (_req: unknown, reply: { type: (t: string) => unknown; send: (s: string) => void }) => {
    reply.type('text/plain');
    reply.send('User-agent: *\nDisallow: /\n');
  });

  // security.txt — RFC 9116 security contact
  fastify.get('/.well-known/security.txt', (_req: unknown, reply: { type: (t: string) => unknown; send: (s: string) => void }) => {
    reply.type('text/plain');
    reply.send(
      'Contact: mailto:vepariai@gmail.com\n' +
      'Preferred-Languages: en, hi\n' +
      'Policy: https://vepari.ai/security\n' +
      'Expires: 2026-12-31T23:59:59Z\n',
    );
  });

  // llms.txt — machine-readable site description for AI crawlers
  fastify.get('/llms.txt', (_req: unknown, reply: { type: (t: string) => unknown; send: (s: string) => void }) => {
    reply.type('text/plain');
    reply.send(
      '# Vepari AI\n\n' +
      '> AI-powered business intelligence for Indian MSMEs.\n\n' +
      '## About\n\n' +
      'Vepari AI helps small and medium business owners in India manage their finances, inventory,\n' +
      'sales, expenses, and team through a voice-first mobile application supporting 22 Indian languages.\n\n' +
      '## Contact\n\n' +
      'Email: vepariai@gmail.com\n' +
      'Jurisdiction: Bengaluru, Karnataka, India\n\n' +
      '## Usage Policy\n\n' +
      'This is a private API server. Automated access is not permitted.\n' +
      'See /robots.txt for crawler policy.\n',
    );
  });

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port, '0.0.0.0');
}

bootstrap();
