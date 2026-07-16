import { Module, Global } from '@nestjs/common';
import { ResendService } from './resend.service';
import { RedisService } from './redis.service';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

@Global()
@Module({
  controllers: [NotificationsController],
  providers: [ResendService, RedisService, NotificationsService],
  exports: [ResendService, RedisService, NotificationsService],
})
export class NotificationsModule {}
