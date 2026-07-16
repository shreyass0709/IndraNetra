import { 
  Injectable, 
  NotFoundException, 
  ForbiddenException, 
  BadRequestException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(
    creatorId: string,
    data: {
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
    const startTime = new Date((data as any).startTime || (data as any).startDate);
    const endTime = new Date((data as any).endTime || (data as any).endDate);

    // 1. Validation Checks
    if (startTime.getTime() >= endTime.getTime()) {
      throw new BadRequestException('Start date must be before end date');
    }

    const expectedCrowdVal = Number(data.expectedCrowd);
    const maxCapacityVal = Number(data.maxCapacity);

    if (expectedCrowdVal > maxCapacityVal) {
      throw new BadRequestException('Expected crowd cannot exceed maximum capacity');
    }

    const entryGatesVal = Number(data.entryGates);
    const exitGatesVal = Number(data.exitGates);
    const cameraCountVal = Number(data.cameraCount);
    const volunteerCountVal = Number(data.volunteerCount);

    if (entryGatesVal <= 0 || exitGatesVal <= 0 || cameraCountVal < 0 || volunteerCountVal < 0) {
      throw new BadRequestException('Gates, cameras, and volunteers must have positive values');
    }

    if (data.areaSqMeters !== undefined && Number(data.areaSqMeters) <= 0) {
      throw new BadRequestException('Venue area must be a positive number');
    }

    const thresholdVal = Math.round(maxCapacityVal * 0.8);

    return this.prisma.event.create({
      data: {
        name: data.name,
        eventType: data.eventType,
        description: data.description,
        location: data.location,
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        expectedCrowd: expectedCrowdVal,
        maxCapacity: maxCapacityVal,
        areaSqMeters: data.areaSqMeters !== undefined ? Number(data.areaSqMeters) : null,
        thresholdLimit: thresholdVal,
        startTime,
        endTime,
        entryGates: entryGatesVal,
        exitGates: exitGatesVal,
        cameraCount: cameraCountVal,
        volunteerCount: volunteerCountVal,
        status: data.status || 'Upcoming',
        createdBy: creatorId,
      },
    });
  }

  async findAll(userId: string, role: string) {
    // Organizer only sees their own events. Admin, Volunteer, and Public User see all events.
    const whereClause = role === 'ORGANIZER' ? { createdBy: userId } : {};

    return this.prisma.event.findMany({
      where: whereClause,
      include: {
        crowdReports: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
        alerts: {
          where: { isResolved: false },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findOne(id: string, userId: string, role: string) {
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
        cameras: true,
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    // Authorization: Organizer can only manage/view their own events
    if (role === 'ORGANIZER' && event.createdBy !== userId) {
      throw new ForbiddenException('You do not have permission to access this event');
    }

    return event;
  }

  async update(
    id: string,
    userId: string,
    role: string,
    data: {
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
      startTime?: string | Date;
      endTime?: string | Date;
      entryGates?: number;
      exitGates?: number;
      cameraCount?: number;
      volunteerCount?: number;
    },
  ) {
    const event = await this.findOne(id, userId, role);

    // 1. Check Edit Permissions based on Event Status
    // Allow editing only if the event is Upcoming.
    // Once the event is Live, prevent editing except for Admin.
    if (event.status === 'Completed' || event.status === 'Cancelled') {
      throw new BadRequestException(`Cannot edit event in ${event.status} status`);
    }

    if (event.status === 'Live' && role !== 'ADMIN') {
      throw new ForbiddenException('Only administrators can edit live events');
    }

    // 2. Input Validation Checks
    const finalStartTime = data.startTime ? new Date(data.startTime) : event.startTime;
    const finalEndTime = data.endTime ? new Date(data.endTime) : event.endTime;

    if (finalStartTime.getTime() >= finalEndTime.getTime()) {
      throw new BadRequestException('Start date must be before end date');
    }

    const finalExpected = data.expectedCrowd !== undefined ? Number(data.expectedCrowd) : event.expectedCrowd;
    const finalMax = data.maxCapacity !== undefined ? Number(data.maxCapacity) : event.maxCapacity;

    if (finalExpected > finalMax) {
      throw new BadRequestException('Expected crowd cannot exceed maximum capacity');
    }

    const gates = data.entryGates !== undefined ? Number(data.entryGates) : event.entryGates;
    const exits = data.exitGates !== undefined ? Number(data.exitGates) : event.exitGates;
    const cams = data.cameraCount !== undefined ? Number(data.cameraCount) : event.cameraCount;
    const vols = data.volunteerCount !== undefined ? Number(data.volunteerCount) : event.volunteerCount;

    if (gates <= 0 || exits <= 0 || cams < 0 || vols < 0) {
      throw new BadRequestException('Gates, cameras, and volunteers must have positive values');
    }

    if (data.areaSqMeters !== undefined && Number(data.areaSqMeters) <= 0) {
      throw new BadRequestException('Venue area must be a positive number');
    }

    const updatedData: any = {
      name: data.name,
      eventType: data.eventType,
      description: data.description,
      location: data.location,
      latitude: data.latitude !== undefined ? Number(data.latitude) : undefined,
      longitude: data.longitude !== undefined ? Number(data.longitude) : undefined,
      expectedCrowd: data.expectedCrowd !== undefined ? Number(data.expectedCrowd) : undefined,
      maxCapacity: data.maxCapacity !== undefined ? Number(data.maxCapacity) : undefined,
      areaSqMeters: data.areaSqMeters !== undefined ? Number(data.areaSqMeters) : undefined,
      status: data.status,
      startTime: data.startTime ? new Date(data.startTime) : undefined,
      endTime: data.endTime ? new Date(data.endTime) : undefined,
      entryGates: data.entryGates !== undefined ? Number(data.entryGates) : undefined,
      exitGates: data.exitGates !== undefined ? Number(data.exitGates) : undefined,
      cameraCount: data.cameraCount !== undefined ? Number(data.cameraCount) : undefined,
      volunteerCount: data.volunteerCount !== undefined ? Number(data.volunteerCount) : undefined,
    };

    if (data.maxCapacity !== undefined) {
      updatedData.thresholdLimit = Math.round(Number(data.maxCapacity) * 0.8);
    }

    return this.prisma.event.update({
      where: { id },
      data: updatedData,
    });
  }

  async remove(id: string, userId: string, role: string) {
    const event = await this.findOne(id, userId, role);

    // Instead of deleting, mark status as Cancelled
    return this.prisma.event.update({
      where: { id },
      data: {
        status: 'Cancelled',
      },
    });
  }
}
