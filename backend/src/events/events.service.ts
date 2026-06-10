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
    thresholdLimit: number;
    startDate: string;
    endDate: string;
  }) {
    return this.prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        locationName: data.locationName,
        latitude: data.latitude,
        longitude: data.longitude,
        capacity: data.capacity,
        thresholdLimit: data.thresholdLimit,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
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
