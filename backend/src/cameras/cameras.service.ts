import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrowdGateway } from '../crowd/crowd.gateway';
import { RedisService } from '../notifications/redis.service';
import { RiskLevel } from '@prisma/client';

@Injectable()
export class CamerasService {
  constructor(
    private prisma: PrismaService,
    private crowdGateway: CrowdGateway,
    private redisService: RedisService,
  ) {}

  async create(eventId: string, data: { name: string; location: string; rtspUrl: string }) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    return this.prisma.camera.create({
      data: {
        name: data.name,
        location: data.location,
        rtspUrl: data.rtspUrl,
        eventId,
      },
    });
  }

  async findAll(eventId: string) {
    return this.prisma.camera.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async remove(cameraId: string) {
    const camera = await this.prisma.camera.findUnique({ where: { id: cameraId } });
    if (!camera) {
      throw new NotFoundException(`Camera with ID ${cameraId} not found`);
    }

    return this.prisma.camera.delete({ where: { id: cameraId } });
  }

  async analyzeFrame(cameraId: string, file?: Express.Multer.File) {
    const camera = await this.prisma.camera.findUnique({
      where: { id: cameraId },
      include: { event: true },
    });

    if (!camera) {
      throw new NotFoundException(`Camera with ID ${cameraId} not found`);
    }

    const event = camera.event;
    let result: any;
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

    if (file) {
      // Analyze uploaded browser webcam snapshot
      try {
        const formData = new FormData();
        const blob = new Blob([file.buffer as any], { type: file.mimetype });
        formData.append('file', blob, file.originalname);
        formData.append('capacity', event.maxCapacity.toString());

        const response = await fetch(`${aiServiceUrl}/analyze`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          result = await response.json();
        } else {
          console.warn('[CamerasService] AI Service returned error on frame upload. Mocking.');
          result = this.generateMockAnalysis(event.maxCapacity);
        }
      } catch (err) {
        console.warn('[CamerasService] Failed to call AI analyze. Mocking.', err.message);
        result = this.generateMockAnalysis(event.maxCapacity);
      }
    } else {
      // Analyze RTSP stream URL (FastAPI connects to stream, runs YOLOv8 and returns)
      try {
        const formData = new FormData();
        formData.append('rtsp_url', camera.rtspUrl);
        formData.append('capacity', event.maxCapacity.toString());

        const response = await fetch(`${aiServiceUrl}/analyze_rtsp`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          result = await response.json();
        } else {
          console.warn('[CamerasService] AI Service returned error on RTSP analysis. Mocking.');
          result = this.generateMockAnalysis(event.maxCapacity);
        }
      } catch (err) {
        console.warn('[CamerasService] Failed to call AI RTSP analyze. Mocking.', err.message);
        result = this.generateMockAnalysis(event.maxCapacity);
      }
    }

    // Save report in database
    const report = await this.prisma.crowdReport.create({
      data: {
        eventId: event.id,
        peopleCount: result.people_count,
        densityLevel: result.density_score,
        riskLevel: result.risk_level as RiskLevel,
        heatmapUrl: result.heatmap_image, // base64 heatmap image
        snapshotUrl: null,
      },
    });

    // Alert system logic
    let activeAlert: any = null;
    const isOvercrowded = report.peopleCount >= event.maxCapacity;
    const isHighRisk = report.riskLevel === 'HIGH' || report.riskLevel === 'CRITICAL';
    const isBlockedGate = camera.name.toLowerCase().includes('gate') && Math.random() < 0.15; // Simulated blocked gate check

    if (isOvercrowded || isHighRisk || isBlockedGate) {
      let type = 'DANGER';
      let message = `High crowd density: ${report.peopleCount} people detected at ${camera.name} (${report.densityLevel.toFixed(2)}/m²)`;

      if (isOvercrowded) {
        type = 'OVERCROWDING';
        message = `Overcrowding alert: ${report.peopleCount} people (Capacity: ${event.maxCapacity}) at ${camera.name}`;
      } else if (isBlockedGate) {
        type = 'BLOCKED_EXIT';
        message = `Blocked Exit Alert: Blockage detected at ${camera.name}`;
      }

      activeAlert = await this.prisma.alert.create({
        data: {
          eventId: event.id,
          type,
          message,
          riskLevel: report.riskLevel,
        },
      });

      // Publish alert to Redis for real-time pub/sub
      await this.redisService.publish('alerts', activeAlert);

      // Broadcast alert via Socket.IO
      this.crowdGateway.broadcastAlert(event.id, activeAlert);
    }

    // Broadcast crowd update via Socket.IO
    this.crowdGateway.broadcastCrowdUpdate(event.id, {
      report,
      activeAlert,
      cameraId,
      cameraName: camera.name,
      capacity: event.maxCapacity,
      thresholdLimit: event.thresholdLimit,
    });

    return {
      report,
      activeAlert,
      analysis: result,
    };
  }

  private generateMockAnalysis(capacity: number) {
    const peopleCount = Math.floor(Math.random() * (capacity * 1.3));
    const utilization = peopleCount / capacity;
    const densityScore = parseFloat((utilization * 5.0).toFixed(2));

    let riskLevel = 'LOW';
    if (densityScore >= 4.5 || utilization >= 1.2) {
      riskLevel = 'CRITICAL';
    } else if (densityScore >= 3.0 || utilization >= 0.95) {
      riskLevel = 'HIGH';
    } else if (densityScore >= 1.5 || utilization >= 0.6) {
      riskLevel = 'MEDIUM';
    }

    return {
      people_count: peopleCount,
      density_score: densityScore,
      risk_level: riskLevel,
      confidence: 0.85,
      utilization,
      heatmap_image: null,
    };
  }
}
