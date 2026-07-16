import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`NestJS Backend is running on http://localhost:${port}`);
}
bootstrap();
