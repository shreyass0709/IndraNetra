import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrowdGateway } from '../crowd/crowd.gateway';
import { ResendService } from '../notifications/resend.service';
import { NotificationsService } from '../notifications/notifications.service';
import { VolunteerStatus, SOSStatus, Role } from '@prisma/client';

@Injectable()
export class VolunteersService {
  constructor(
    private prisma: PrismaService,
    private crowdGateway: CrowdGateway,
    private resendService: ResendService,
    private notifications: NotificationsService,
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

  /**
   * Approved (event-assigned) volunteers for the roster/dispatch views.
   * Organizers only see volunteers assigned to events they own; admins see all.
   */
  async getVolunteers(userId: string, role: string) {
    return this.prisma.volunteer.findMany({
      where: {
        user: { isApproved: true },
        ...(role === Role.ORGANIZER ? { event: { createdBy: userId } } : {}),
      },
      include: {
        user: { select: { name: true, email: true, role: true } },
        event: { select: { id: true, name: true, location: true } },
      },
    });
  }

  /**
   * Volunteers awaiting approval (signed up but not yet assigned to an event).
   * Both admins and organizers draw from this same global pending pool and
   * assign the ones relevant to their event.
   */
  async getPendingVolunteers() {
    return this.prisma.volunteer.findMany({
      where: { user: { isApproved: false, emailVerified: true } },
      include: {
        user: { select: { id: true, name: true, email: true, createdAt: true } },
      },
      orderBy: { user: { createdAt: 'desc' } },
    });
  }

  /**
   * Assign a pending volunteer to an event and approve them in one step.
   * Organizers may only assign to events they own; admins to any event.
   */
  async assignVolunteer(volunteerId: string, eventId: string, actingUserId: string, actingRole: string) {
    const volunteer = await this.prisma.volunteer.findUnique({
      where: { id: volunteerId },
      include: { user: { select: { id: true, name: true } } },
    });
    if (!volunteer) {
      throw new NotFoundException(`Volunteer with ID ${volunteerId} not found`);
    }

    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    if (actingRole === Role.ORGANIZER && event.createdBy !== actingUserId) {
      throw new ForbiddenException('You can only assign volunteers to your own events');
    }

    const updated = await this.prisma.volunteer.update({
      where: { id: volunteerId },
      data: { eventId, status: VolunteerStatus.AVAILABLE },
      include: {
        user: { select: { name: true, email: true } },
        event: { select: { id: true, name: true, location: true } },
      },
    });

    // Approving = flipping the login/access gate on the user.
    await this.prisma.user.update({
      where: { id: volunteer.userId },
      data: { isApproved: true },
    });

    await this.notifications.create(
      volunteer.userId,
      'Volunteer access approved',
      `You have been approved and assigned to ${event.name} (${event.location}). You can now access your duty dashboard.`,
    );

    this.crowdGateway.broadcastVolunteerUpdate(updated);
    return updated;
  }

  /** Reject a pending volunteer application (removes the account). */
  async rejectVolunteer(volunteerId: string) {
    const volunteer = await this.prisma.volunteer.findUnique({ where: { id: volunteerId } });
    if (!volunteer) {
      throw new NotFoundException(`Volunteer with ID ${volunteerId} not found`);
    }
    if (volunteer.eventId) {
      throw new BadRequestException('Volunteer is already assigned to an event; unassign before rejecting');
    }
    // Deleting the user cascades the Volunteer row.
    await this.prisma.user.delete({ where: { id: volunteer.userId } });
    return { message: 'Volunteer application rejected' };
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

    // In-app notification to the control room (admins + organizers).
    await this.notifications.notifyRoles(
      [Role.ADMIN, Role.ORGANIZER],
      `🚨 SOS: ${sos.issueType}`,
      `${sos.user?.name || 'A user'} needs help at ${sos.latitude.toFixed(4)}, ${sos.longitude.toFixed(4)}`,
    );

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

    // Notify the dispatched volunteer of their new assignment.
    const locationLabel =
      incidentType === 'SOS'
        ? `${updatedIncident.latitude?.toFixed?.(4)}, ${updatedIncident.longitude?.toFixed?.(4)}`
        : updatedIncident.title;
    await this.notifications.create(
      volunteer.userId,
      'You have been dispatched',
      `New ${incidentType} assignment: ${locationLabel}. Please respond immediately.`,
    );

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
