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
    // Default limit for routes that opt in with ThrottlerGuard; auth overrides it tighter.
    // ponytail: in-memory counters are per instance; use a Redis storage if the API scales out.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]),
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


