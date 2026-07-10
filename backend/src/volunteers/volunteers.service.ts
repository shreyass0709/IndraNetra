import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrowdGateway } from '../crowd/crowd.gateway';
import { ResendService } from '../notifications/resend.service';
import { VolunteerStatus, SOSStatus } from '@prisma/client';

@Injectable()
export class VolunteersService {
  constructor(
    private prisma: PrismaService,
    private crowdGateway: CrowdGateway,
    private resendService: ResendService,
  ) {}

  async updateLocation(userId: string, latitude: number, longitude: number) {
    const volunteer = await this.prisma.volunteer.findUnique({
      where: { userId },
    });

    if (!volunteer) {
      throw new NotFoundException('Volunteer profile not found');
    }

    const updated = await this.prisma.volunteer.update({
      where: { userId },
      data: {
        latitude,
        longitude,
        lastActive: new Date(),
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    this.crowdGateway.broadcastVolunteerUpdate(updated);
    return updated;
  }

  async updateStatus(userId: string, status: VolunteerStatus) {
    const volunteer = await this.prisma.volunteer.findUnique({
      where: { userId },
    });

    if (!volunteer) {
      throw new NotFoundException('Volunteer profile not found');
    }

    const updated = await this.prisma.volunteer.update({
      where: { userId },
      data: {
        status,
        lastActive: new Date(),
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    this.crowdGateway.broadcastVolunteerUpdate(updated);
    return updated;
  }

  async getVolunteers() {
    return this.prisma.volunteer.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async createSOS(
    userId: string,
    latitude: number,
    longitude: number,
    issueType: string,
    description?: string,
  ) {
    const sos = await this.prisma.sOSRequest.create({
      data: {
        userId,
        latitude,
        longitude,
        issueType,
        description,
        status: SOSStatus.PENDING,
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    this.crowdGateway.broadcastSOS(sos);

    // Send email notification to alert system
    try {
      const emailContent = `
        <h3>🚨 IndraNetra LIVE SOS Emergency Alert</h3>
        <p><strong>Sender:</strong> ${sos.user?.name || 'Anonymous User'} (${sos.user?.email || 'N/A'})</p>
        <p><strong>Emergency Type:</strong> ${sos.issueType}</p>
        <p><strong>Details:</strong> ${sos.description || 'Emergency assistance requested immediately.'}</p>
        <p><strong>Tactical Coordinates:</strong> ${sos.latitude}, ${sos.longitude}</p>
        <br/>
        <p>Please log in to the IndraNetra control room dashboard to coordinate volunteer dispatch.</p>
      `;
      const recipient = sos.user?.email || 'onboarding@resend.dev';
      await this.resendService.sendEmail(recipient, `🚨 LIVE SOS: ${sos.issueType}`, emailContent);
    } catch (e) {
      console.warn('Email dispatch failed:', e.message);
    }

    return sos;
  }

  async dispatchVolunteer(volunteerId: string, incidentId: string, incidentType: 'SOS' | 'REPORT') {
    const volunteer = await this.prisma.volunteer.findUnique({
      where: { id: volunteerId },
    });

    if (!volunteer) {
      throw new NotFoundException(`Volunteer with ID ${volunteerId} not found`);
    }

    // Set volunteer to ASSIGNED
    const updatedVolunteer = await this.prisma.volunteer.update({
      where: { id: volunteerId },
      data: { status: VolunteerStatus.ASSIGNED },
      include: { user: { select: { name: true, email: true } } },
    });

    let updatedIncident: any;

    if (incidentType === 'SOS') {
      const sos = await this.prisma.sOSRequest.findUnique({ where: { id: incidentId } });
      if (!sos) throw new NotFoundException(`SOS request with ID ${incidentId} not found`);

      updatedIncident = await this.prisma.sOSRequest.update({
        where: { id: incidentId },
        data: {
          status: SOSStatus.DISPATCHED,
          assignedVolunteerId: volunteer.id,
        },
        include: {
          user: { select: { name: true, email: true } },
          assignedVolunteer: { include: { user: { select: { name: true } } } },
        },
      });

      this.crowdGateway.broadcastSOS(updatedIncident);
    } else {
      const report = await this.prisma.report.findUnique({ where: { id: incidentId } });
      if (!report) throw new NotFoundException(`Report with ID ${incidentId} not found`);

      updatedIncident = await this.prisma.report.update({
        where: { id: incidentId },
        data: {
          status: 'DISPATCHED',
          assignedVolunteerId: volunteer.id,
        },
        include: {
          user: { select: { name: true, email: true } },
          assignedVolunteer: { include: { user: { select: { name: true } } } },
        },
      });

      this.crowdGateway.server.emit('report_updated', updatedIncident);
    }

    this.crowdGateway.broadcastVolunteerUpdate(updatedVolunteer);

    return {
      volunteer: updatedVolunteer,
      incident: updatedIncident,
    };
  }

  async resolveSOS(id: string) {
    const sos = await this.prisma.sOSRequest.findUnique({
      where: { id },
    });

    if (!sos) {
      throw new NotFoundException(`SOS Request with ID ${id} not found`);
    }

    const updated = await this.prisma.sOSRequest.update({
      where: { id },
      data: {
        status: SOSStatus.RESOLVED,
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    // Free assigned volunteer if any
    if (sos.assignedVolunteerId) {
      const updatedVol = await this.prisma.volunteer.update({
        where: { id: sos.assignedVolunteerId },
        data: { status: VolunteerStatus.AVAILABLE },
        include: { user: { select: { name: true, email: true } } },
      });
      this.crowdGateway.broadcastVolunteerUpdate(updatedVol);
    }

    this.crowdGateway.broadcastSOS(updated);
    return updated;
  }

  async resolveReport(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    const updated = await this.prisma.report.update({
      where: { id },
      data: {
        status: 'RESOLVED',
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    // Free assigned volunteer if any
    if (report.assignedVolunteerId) {
      const updatedVol = await this.prisma.volunteer.update({
        where: { id: report.assignedVolunteerId },
        data: { status: VolunteerStatus.AVAILABLE },
        include: { user: { select: { name: true, email: true } } },
      });
      this.crowdGateway.broadcastVolunteerUpdate(updatedVol);
    }

    this.crowdGateway.server.emit('report_updated', updated);
    return updated;
  }

  async updateVolunteer(id: string, data: { assignedArea?: string; status?: VolunteerStatus; skills?: string; availability?: string }) {
    const volunteer = await this.prisma.volunteer.findUnique({
      where: { id },
    });

    if (!volunteer) {
      throw new NotFoundException('Volunteer profile not found');
    }

    const updated = await this.prisma.volunteer.update({
      where: { id },
      data,
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    this.crowdGateway.broadcastVolunteerUpdate(updated);
    return updated;
  }

  async getSOSRequests() {
    return this.prisma.sOSRequest.findMany({
      where: {
        status: {
          in: [SOSStatus.PENDING, SOSStatus.DISPATCHED],
        },
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
        assignedVolunteer: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
