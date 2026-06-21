import { Module, Global } from '@nestjs/common';
import { ResendService } from './resend.service';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [ResendService, RedisService],
  exports: [ResendService, RedisService],
})
export class NotificationsModule {}
