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
      // We will attempt to send it to the logged in user's email or general onboarding@resend.dev/admin domain
      const recipient = sos.user?.email || 'onboarding@resend.dev';
      await this.resendService.sendEmail(recipient, `🚨 LIVE SOS: ${sos.issueType}`, emailContent);
    } catch (e) {
      console.warn('Email dispatch failed:', e.message);
    }

    return sos;
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
        user: {
          select: { name: true, email: true },
        },
      },
    });

    this.crowdGateway.broadcastSOS(updated);
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
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
