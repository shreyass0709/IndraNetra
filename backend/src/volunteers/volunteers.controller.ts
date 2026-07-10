import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { VolunteersService } from './volunteers.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, VolunteerStatus } from '@prisma/client';

@Controller('volunteers')
@UseGuards(AuthGuard)
export class VolunteersController {
  constructor(private readonly volunteersService: VolunteersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  getVolunteers() {
    return this.volunteersService.getVolunteers();
  }

  @Patch('location')
  @UseGuards(RolesGuard)
  @Roles(Role.VOLUNTEER)
  updateLocation(
    @Request() req: any,
    @Body() body: { latitude: number; longitude: number },
  ) {
    return this.volunteersService.updateLocation(req.user.id, body.latitude, body.longitude);
  }

  @Patch('status')
  @UseGuards(RolesGuard)
  @Roles(Role.VOLUNTEER)
  updateStatus(
    @Request() req: any,
    @Body() body: { status: VolunteerStatus },
  ) {
    return this.volunteersService.updateStatus(req.user.id, body.status);
  }

  @Post('sos')
  createSOS(
    @Request() req: any,
    @Body()
    body: {
      latitude: number;
      longitude: number;
      issueType: string;
      description?: string;
    },
  ) {
    return this.volunteersService.createSOS(
      req.user.id,
      body.latitude,
      body.longitude,
      body.issueType,
      body.description,
    );
  }

  @Get('sos')
  getSOSRequests() {
    return this.volunteersService.getSOSRequests();
  }

  @Patch('sos/:id/resolve')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER, Role.VOLUNTEER)
  resolveSOS(@Param('id') id: string) {
    return this.volunteersService.resolveSOS(id);
  }

  @Patch('dispatch')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  dispatchVolunteer(
    @Body() body: { volunteerId: string; incidentId: string; incidentType: 'SOS' | 'REPORT' },
  ) {
    return this.volunteersService.dispatchVolunteer(body.volunteerId, body.incidentId, body.incidentType);
  }

  @Patch('reports/:id/resolve')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER, Role.VOLUNTEER)
  resolveReport(@Param('id') id: string) {
    return this.volunteersService.resolveReport(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.ORGANIZER)
  updateVolunteer(
    @Param('id') id: string,
    @Body() body: { assignedArea?: string; status?: VolunteerStatus; skills?: string; availability?: string },
  ) {
    return this.volunteersService.updateVolunteer(id, body);
  }
}

