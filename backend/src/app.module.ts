import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { CrowdModule } from './crowd/crowd.module';
import { VolunteersModule } from './volunteers/volunteers.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CamerasModule } from './cameras/cameras.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Rate limit for brute-force-able endpoints. ThrottlerGuard is opted into
    // per-route (see AuthController), never globally: the camera analysis loop and
    // dashboard polling would trip a global limit instantly.
    // ponytail: in-memory counters, so each API instance limits independently.
    // Move to the Redis storage provider if this ever runs multi-instance.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 5 }]),
    PrismaModule,
    AuthModule,
    EventsModule,
    CrowdModule,
    VolunteersModule,
    ReportsModule,
    NotificationsModule,
    CamerasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}


