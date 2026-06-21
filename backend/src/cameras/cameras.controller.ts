import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CamerasService } from './cameras.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller()
export class CamerasController {
  constructor(private readonly camerasService: CamerasService) {}

  @Post('events/:eventId/cameras')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(
    @Param('eventId') eventId: string,
    @Body() body: { name: string; location: string; rtspUrl: string },
  ) {
    return this.camerasService.create(eventId, body);
  }

  @Get('events/:eventId/cameras')
  @UseGuards(AuthGuard)
  findAll(@Param('eventId') eventId: string) {
    return this.camerasService.findAll(eventId);
  }

  @Delete('cameras/:cameraId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('cameraId') cameraId: string) {
    return this.camerasService.remove(cameraId);
  }

  @Post('cameras/:cameraId/analyze')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.POLICE, Role.ORGANIZER)
  @UseInterceptors(FileInterceptor('file'))
  analyze(
    @Param('cameraId') cameraId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.camerasService.analyzeFrame(cameraId, file);
  }
}
