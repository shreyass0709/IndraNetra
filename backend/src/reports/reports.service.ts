import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

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
    return this.prisma.report.create({
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
