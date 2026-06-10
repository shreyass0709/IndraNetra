import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CrowdService } from './crowd.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('crowd')
export class CrowdController {
  constructor(private readonly crowdService: CrowdService) {}

  @Post(':eventId/analyze')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.POLICE, Role.ORGANIZER)
  @UseInterceptors(FileInterceptor('file'))
  analyzeFrame(
    @Param('eventId') eventId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.crowdService.analyzeFrame(eventId, file);
  }

  @Get(':eventId/history')
  @UseGuards(AuthGuard)
  getHistory(@Param('eventId') eventId: string) {
    return this.crowdService.getHistory(eventId);
  }
}
