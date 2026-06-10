import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReportsService } from './reports.service';
import { AuthGuard } from '../auth/auth.guard';
import { CloudinaryService } from '../utils/cloudinary.service';

@Controller('reports')
@UseGuards(AuthGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Request() req: any,
    @Body()
    body: {
      title: string;
      description: string;
      latitude: string;
      longitude: string;
    },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let evidenceUrl: string | undefined = undefined;
    let fileType: string | undefined = undefined;

    if (file) {
      try {
        evidenceUrl = await this.cloudinaryService.uploadImage(file);
        fileType = file.mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE';
      } catch (err) {
        console.error('Cloudinary upload failed:', err.message);
      }
    }

    return this.reportsService.create(req.user.id, {
      title: body.title,
      description: body.description,
      latitude: parseFloat(body.latitude),
      longitude: parseFloat(body.longitude),
      evidenceUrl,
      fileType,
    });
  }

  @Get()
  findAll() {
    return this.reportsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }
}
