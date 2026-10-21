import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './realtime/redis-io.adapter';
import { allowedOrigins } from './common/origins';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validates bodies typed with class-validator DTOs and strips unknown fields.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Specific origins (not '*') so browsers will share the HTTP-only session cookie.
  app.enableCors({
    origin: allowedOrigins(),
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
