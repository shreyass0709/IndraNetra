import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    title: string;
    description?: string;
    locationName: string;
    latitude: number;
    longitude: number;
    capacity: number;
    thresholdLimit?: number;
    startDate: string;
    endDate: string;
    gatesCount?: number;
    volunteersCount?: number;
  }) {
    const capacityVal = Number(data.capacity);
    const thresholdVal = data.thresholdLimit ? Number(data.thresholdLimit) : Math.round(capacityVal * 0.8);

    return this.prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        locationName: data.locationName,
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        capacity: capacityVal,
        thresholdLimit: thresholdVal,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        gatesCount: data.gatesCount ? Number(data.gatesCount) : 1,
        volunteersCount: data.volunteersCount ? Number(data.volunteersCount) : 0,
      },
    });
  }

  async findAll() {
    return this.prisma.event.findMany({
      include: {
        crowdReports: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
        alerts: {
          where: { isResolved: false },
        },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        crowdReports: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
        alerts: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  async update(
    id: string,
    data: {
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
    await this.findOne(id);
    return this.prisma.event.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.event.delete({
      where: { id },
    });
  }
}
