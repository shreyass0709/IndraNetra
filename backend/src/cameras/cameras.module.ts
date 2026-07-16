import { Module } from '@nestjs/common';
import { CamerasService } from './cameras.service';
import { CamerasController } from './cameras.controller';
import { CloudinaryService } from '../utils/cloudinary.service';

@Module({
  controllers: [CamerasController],
  providers: [CamerasService, CloudinaryService],
  exports: [CamerasService],
})
export class CamerasModule {}
