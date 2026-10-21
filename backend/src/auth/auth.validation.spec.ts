import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('auth input validation and rate limiting', () => {
  let app: INestApplication;
  const authService = {
    register: jest.fn(async (body) => body),
    forgotPassword: jest.fn(async () => ({ message: 'ok' })),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }])],
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterEach(() => app.close());

  it('rejects malformed register bodies before they reach the service', async () => {
    for (const body of [
      { email: 'not-an-email', name: 'A', password: 'longenough' },
      { email: 'a@b.co', name: 'A', password: 'short' },
      { email: 'a@b.co', name: 'A', password: 'longenough', role: 'SUPERUSER' },
      { email: { $ne: null }, name: 'A', password: 'longenough' },
    ]) {
      await request(app.getHttpServer()).post('/auth/register').send(body).expect(400);
    }
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('strips fields the DTO does not declare', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'a@b.co', name: 'A', password: 'longenough', isApproved: true })
      .expect(201);
    expect(authService.register).toHaveBeenCalledWith({ email: 'a@b.co', name: 'A', password: 'longenough' });
  });

  it('limits forgot-password to 5 requests a minute per client', async () => {
    const send = () => request(app.getHttpServer()).post('/auth/forgot-password').send({ email: 'a@b.co' });
    for (let i = 0; i < 5; i++) await send().expect(201);
    await send().expect(429);
    expect(authService.forgotPassword).toHaveBeenCalledTimes(5);
  });
});
