import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './realtime/redis-io.adapter';
import { getJwtSecret } from './common/jwt.util';

async function bootstrap() {
  // Fail before accepting a single request if the signing secret is missing, weak,
  // or one of the values that leaked into source control. Booting without it would
  // mean serving an app whose sessions anyone can forge.
  getJwtSecret();

  const app = await NestFactory.create(AppModule);

  // `whitelist` strips properties that aren't declared on the DTO, so a request can
  // never set a field the endpoint didn't ask for (e.g. posting isApproved: true to
  // /auth/register). `forbidNonWhitelisted` turns those into a 400 rather than a
  // silent drop. Only endpoints with a DTO class are validated; the rest are
  // untouched until they get DTOs of their own.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Set up specific origins for CORS to allow sharing HTTP-only cookies.
  // FRONTEND_URL is added on top of the local dev origins so a deployed
  // frontend can still send/receive the session cookie in production.
  const origins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }

  app.enableCors({
    origin: origins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  // Back Socket.IO with Redis so crowd/alert/notification broadcasts reach
  // every client when the API scales to multiple instances. Degrades to the
  // default in-memory adapter automatically if Redis isn't reachable.
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`NestJS Backend is running on http://localhost:${port}`);
}
bootstrap();
