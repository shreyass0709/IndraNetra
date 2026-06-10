import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { CloudinaryService } from '../utils/cloudinary.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, CloudinaryService],
  exports: [ReportsService],
})
export class ReportsModule {}
