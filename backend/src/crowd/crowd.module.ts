import { Module, Global } from '@nestjs/common';
import { CrowdGateway } from './crowd.gateway';
import { CrowdService } from './crowd.service';
import { CrowdController } from './crowd.controller';
import { CloudinaryService } from '../utils/cloudinary.service';

@Global()
@Module({
  controllers: [CrowdController],
  providers: [CrowdGateway, CrowdService, CloudinaryService],
  exports: [CrowdGateway, CrowdService],
})
export class CrowdModule {}
