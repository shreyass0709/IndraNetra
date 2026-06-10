import { Module } from '@nestjs/common';
import { VolunteersService } from './volunteers.service';
import { VolunteersController } from './volunteers.controller';
import { ResendService } from '../notifications/resend.service';

@Module({
  controllers: [VolunteersController],
  providers: [VolunteersService, ResendService],
  exports: [VolunteersService],
})
export class VolunteersModule {}
