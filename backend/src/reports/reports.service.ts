import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrowdGateway } from '../crowd/crowd.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { Role } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private crowdGateway: CrowdGateway,
    private notifications: NotificationsService,
  ) {}

  async create(
    userId: string,
    data: {
      title: string;
      description: string;
      latitude: number;
      longitude: number;
      evidenceUrl?: string;
      fileType?: string;
    },
  ) {
    const report = await this.prisma.report.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        latitude: data.latitude,
        longitude: data.longitude,
        evidenceUrl: data.evidenceUrl,
        fileType: data.fileType,
        status: 'PENDING',
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
    });

    // Surface the new incident to the control room in real time.
    this.crowdGateway.broadcastReport(report);
    await this.notifications.notifyRoles(
      [Role.ADMIN, Role.ORGANIZER],
      'New Incident Report',
      `${report.user?.name || 'A citizen'} reported: ${report.title}`,
    );

    return report;
  }

  async findAll() {
    return this.prisma.report.findMany({
      where: {
        status: {
          in: ['PENDING', 'DISPATCHED'],
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

  async findOne(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
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
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    return report;
  }
}
