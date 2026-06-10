import { Module, Global } from '@nestjs/common';
import { CrowdGateway } from './crowd.gateway';
import { CrowdService } from './crowd.service';
import { CrowdController } from './crowd.controller';

@Global()
@Module({
  controllers: [CrowdController],
  providers: [CrowdGateway, CrowdService],
  exports: [CrowdGateway, CrowdService],
})
export class CrowdModule {}
