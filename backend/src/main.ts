import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Set up specific origins for CORS to allow sharing HTTP-only cookies
  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });
  
  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`NestJS Backend is running on http://localhost:${port}`);
}
bootstrap();
