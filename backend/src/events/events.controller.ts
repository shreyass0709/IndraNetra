import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  create(
    @Body()
    body: {
      title: string;
      description?: string;
      locationName: string;
      latitude: number;
      longitude: number;
      capacity: number;
      thresholdLimit: number;
      startDate: string;
      endDate: string;
      gatesCount?: number;
      volunteersCount?: number;
    },
  ) {
    return this.eventsService.create(body);
  }

  @Get()
  findAll() {
    return this.eventsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  update(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      locationName?: string;
      latitude?: number;
      longitude?: number;
      capacity?: number;
      thresholdLimit?: number;
      status?: string;
      startDate?: string;
      endDate?: string;
      gatesCount?: number;
      volunteersCount?: number;
    },
  ) {
    return this.eventsService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }
}
