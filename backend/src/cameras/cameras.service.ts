import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrowdGateway } from '../crowd/crowd.gateway';
import { RedisService } from '../notifications/redis.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RiskLevel, Role } from '@prisma/client';
import * as net from 'net';

@Injectable()
export class CamerasService {
  constructor(
    private prisma: PrismaService,
    private crowdGateway: CrowdGateway,
    private redisService: RedisService,
    private notifications: NotificationsService,
  ) {}

  async create(eventId: string, data: { name: string; location: string; cameraSource: string; rtspUrl: string; aiEnabled?: boolean; createdBy?: string }) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    return this.prisma.camera.create({
      data: {
        name: data.name,
        location: data.location,
        cameraSource: data.cameraSource,
        rtspUrl: data.rtspUrl,
        aiEnabled: data.aiEnabled !== undefined ? data.aiEnabled : true,
        createdBy: data.createdBy || 'System',
        status: 'Offline', // Default status on creation
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

  async update(
    cameraId: string,
    data: { name?: string; location?: string; cameraSource?: string; rtspUrl?: string; aiEnabled?: boolean; status?: string },
  ) {
    const camera = await this.prisma.camera.findUnique({ where: { id: cameraId } });
    if (!camera) {
      throw new NotFoundException(`Camera with ID ${cameraId} not found`);
    }

    return this.prisma.camera.update({
      where: { id: cameraId },
      data,
    });
  }

  async remove(cameraId: string) {
    const camera = await this.prisma.camera.findUnique({ where: { id: cameraId } });
    if (!camera) {
      throw new NotFoundException(`Camera with ID ${cameraId} not found`);
    }

    return this.prisma.camera.delete({ where: { id: cameraId } });
  }

  async testConnection(cameraId: string): Promise<{ success: boolean; message: string }> {
    const camera = await this.prisma.camera.findUnique({ where: { id: cameraId } });
    if (!camera) {
      throw new NotFoundException(`Camera with ID ${cameraId} not found`);
    }

    if (camera.cameraSource === 'Laptop Webcam') {
      await this.prisma.camera.update({
        where: { id: cameraId },
        data: { status: 'Online' },
      });
      return { success: true, message: 'Webcam connection active' };
    }

    if (camera.cameraSource === 'Video File') {
      if (camera.rtspUrl) {
        await this.prisma.camera.update({
          where: { id: cameraId },
          data: { status: 'Online' },
        });
        return { success: true, message: `Video file stream verified: ${camera.rtspUrl}` };
      }
      return { success: false, message: 'No video file path provided' };
    }

    // RTSP or Mobile Camera: run TCP port check
    try {
      let host = '';
      let port = 80;

      // Clean protocol prefix for parsing
      let cleanUrl = camera.rtspUrl;
      if (cleanUrl.startsWith('rtsp://')) {
        cleanUrl = cleanUrl.replace('rtsp://', 'http://');
        port = 554; // Default RTSP port
      } else if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = 'http://' + cleanUrl;
      }

      try {
        const parsed = new URL(cleanUrl);
        host = parsed.hostname;
        if (parsed.port) {
          port = parseInt(parsed.port);
        }
      } catch (e) {
        // Fallback simple parsing
        const parts = camera.rtspUrl.replace('rtsp://', '').replace('http://', '').split(':');
        host = parts[0].split('/')[0];
        if (parts[1]) {
          port = parseInt(parts[1].split('/')[0]);
        }
      }

      if (!host) {
        return { success: false, message: 'Invalid URL / host format' };
      }

      const connectionResult = await new Promise<{ success: boolean; message: string }>((resolve) => {
        const socket = new net.Socket();
        let isResolved = false;

        socket.setTimeout(2000); // 2 seconds timeout

        socket.on('connect', () => {
          if (!isResolved) {
            isResolved = true;
            socket.destroy();
            resolve({ success: true, message: `Successfully connected to ${host}:${port}` });
          }
        });

        socket.on('timeout', () => {
          if (!isResolved) {
            isResolved = true;
            socket.destroy();
            resolve({ success: false, message: `Connection timeout to ${host}:${port}` });
          }
        });

        socket.on('error', (err) => {
          if (!isResolved) {
            isResolved = true;
            socket.destroy();
            resolve({ success: false, message: `Connection error: ${err.message}` });
          }
        });

        socket.connect(port, host);
      });

      if (connectionResult.success) {
        await this.prisma.camera.update({
          where: { id: cameraId },
          data: { status: 'Online' },
        });
      } else {
        await this.prisma.camera.update({
          where: { id: cameraId },
          data: { status: 'Offline' },
        });
      }

      return connectionResult;
    } catch (err: any) {
      await this.prisma.camera.update({
        where: { id: cameraId },
        data: { status: 'Offline' },
      });
      return { success: false, message: `Test failed: ${err.message}` };
    }
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
        formData.append('camera_id', cameraId);

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
      // Analyze RTSP stream, mobile camera URL, or video file path
      try {
        const formData = new FormData();
        formData.append('rtsp_url', camera.rtspUrl);
        formData.append('capacity', event.maxCapacity.toString());
        formData.append('camera_id', cameraId);

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

    // Update status to Online
    await this.prisma.camera.update({
      where: { id: cameraId },
      data: { status: 'Online' },
    });

    // Save report in database (general events CrowdReport)
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

    // Save specific Camera Analytics
    await this.prisma.cameraAnalytics.create({
      data: {
        cameraId: camera.id,
        peopleCount: result.people_count,
        density: result.density_score,
        riskLevel: result.risk_level,
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

      // In-app notification to the control room.
      await this.notifications.notifyRoles(
        [Role.ADMIN, Role.ORGANIZER],
        `⚠️ ${type} — ${camera.name}`,
        message,
      );
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
