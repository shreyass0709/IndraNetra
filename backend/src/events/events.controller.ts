import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('events')
@UseGuards(AuthGuard, RolesGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.ORGANIZER)
  create(
    @Request() req: any,
    @Body()
    body: {
      name: string;
      eventType: string;
      description?: string;
      location: string;
      latitude: number;
      longitude: number;
      expectedCrowd: number;
      maxCapacity: number;
      areaSqMeters?: number;
      entryGates: number;
      exitGates: number;
      cameraCount: number;
      volunteerCount: number;
      status?: string;
    },
  ) {
    return this.eventsService.create(req.user.id, body);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.eventsService.findAll(req.user.id, req.user.role);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.eventsService.findOne(id, req.user.id, req.user.role);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.ORGANIZER)
  update(
    @Param('id') id: string,
    @Request() req: any,
    @Body()
    body: {
      name?: string;
      eventType?: string;
      description?: string;
      location?: string;
      latitude?: number;
      longitude?: number;
      expectedCrowd?: number;
      maxCapacity?: number;
      areaSqMeters?: number;
      status?: string;
      startTime?: string;
      endTime?: string;
      entryGates?: number;
      exitGates?: number;
      cameraCount?: number;
      volunteerCount?: number;
    },
  ) {
    return this.eventsService.update(id, req.user.id, req.user.role, body);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.eventsService.remove(id, req.user.id, req.user.role);
  }
}
