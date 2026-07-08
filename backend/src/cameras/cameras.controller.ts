import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CamerasService } from './cameras.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller()
@UseGuards(AuthGuard, RolesGuard)
export class CamerasController {
  constructor(private readonly camerasService: CamerasService) {}

  @Post('events/:eventId/cameras')
  @Roles(Role.ADMIN, Role.ORGANIZER)
  create(
    @Param('eventId') eventId: string,
    @Body() body: { name: string; location: string; cameraSource: string; rtspUrl: string; aiEnabled?: boolean },
    @Request() req: any,
  ) {
    const username = req.user?.name || req.user?.email || 'System';
    return this.camerasService.create(eventId, { ...body, createdBy: username });
  }

  @Get('events/:eventId/cameras')
  @Roles(Role.ADMIN, Role.ORGANIZER, Role.VOLUNTEER, Role.POLICE)
  findAll(@Param('eventId') eventId: string) {
    return this.camerasService.findAll(eventId);
  }

  @Patch('cameras/:cameraId')
  @Roles(Role.ADMIN, Role.ORGANIZER)
  update(
    @Param('cameraId') cameraId: string,
    @Body() body: { name?: string; location?: string; cameraSource?: string; rtspUrl?: string; aiEnabled?: boolean; status?: string },
  ) {
    return this.camerasService.update(cameraId, body);
  }

  @Delete('cameras/:cameraId')
  @Roles(Role.ADMIN) // Only Admin can delete cameras
  remove(@Param('cameraId') cameraId: string) {
    return this.camerasService.remove(cameraId);
  }

  @Post('cameras/:cameraId/test')
  @Roles(Role.ADMIN, Role.ORGANIZER)
  testConnection(@Param('cameraId') cameraId: string) {
    return this.camerasService.testConnection(cameraId);
  }

  @Post('cameras/:cameraId/analyze')
  @Roles(Role.ADMIN, Role.POLICE, Role.ORGANIZER)
  @UseInterceptors(FileInterceptor('file'))
  analyze(
    @Param('cameraId') cameraId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.camerasService.analyzeFrame(cameraId, file);
  }
}
