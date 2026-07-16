import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrowdGateway } from './crowd.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { RiskLevel, Role } from '@prisma/client';

@Injectable()
export class CrowdService {
  constructor(
    private prisma: PrismaService,
    private crowdGateway: CrowdGateway,
    private notifications: NotificationsService,
  ) {}

  async analyzeFrame(eventId: string, file: Express.Multer.File) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    let result: any;
    
    // Call FastAPI AI service
    try {
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      
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
        console.warn('AI Service returned error. Using local mock analysis.');
        result = this.generateMockAnalysis(event.maxCapacity);
      }
    } catch (err) {
      console.warn('Could not connect to AI Service. Using local mock analysis.', err.message);
      result = this.generateMockAnalysis(event.maxCapacity);
    }

    // Save report in database
    const report = await this.prisma.crowdReport.create({
      data: {
        eventId: event.id,
        peopleCount: result.people_count,
        densityLevel: result.density_score,
        riskLevel: result.risk_level as RiskLevel,
        heatmapUrl: result.heatmap_image, // Storing base64 encoded heatmap for convenience in mock/demo
        snapshotUrl: null, // placeholder
      },
    });

    // Handle Alerts
    let activeAlert: any = null;
    const thresholdLimit = event.thresholdLimit;
    
    if (report.peopleCount >= thresholdLimit || report.riskLevel === 'CRITICAL' || report.riskLevel === 'HIGH') {
      const isOvercrowded = report.peopleCount >= thresholdLimit;
      const type = isOvercrowded ? 'OVERCROWDING' : 'DANGER';
      const message = isOvercrowded 
        ? `Overcrowding alert: ${report.peopleCount} people detected (Threshold: ${thresholdLimit})` 
        : `High risk detected: Risk Level is ${report.riskLevel} with density ${report.densityLevel}`;

      activeAlert = await this.prisma.alert.create({
        data: {
          eventId: event.id,
          type,
          message,
          riskLevel: report.riskLevel,
        },
      });

      this.crowdGateway.broadcastAlert(event.id, activeAlert);
      await this.notifications.notifyRoles(
        [Role.ADMIN, Role.ORGANIZER],
        `⚠️ ${type} — ${event.name}`,
        message,
      );
    }

    // Broadcast update via WebSocket
    this.crowdGateway.broadcastCrowdUpdate(event.id, {
      report,
      activeAlert,
      capacity: event.maxCapacity,
      thresholdLimit: event.thresholdLimit,
    });

    return {
      report,
      activeAlert,
      analysis: result,
    };
  }

  async getHistory(eventId: string) {
    return this.prisma.crowdReport.findMany({
      where: { eventId },
      orderBy: { timestamp: 'desc' },
      take: 20,
    });
  }

  /** List unresolved alerts, optionally scoped to a single event. */
  async getActiveAlerts(eventId?: string) {
    return this.prisma.alert.findMany({
      where: {
        isResolved: false,
        ...(eventId ? { eventId } : {}),
      },
      include: {
        event: { select: { id: true, name: true, location: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /** Acknowledge/clear an alert and broadcast the resolution to all dashboards. */
  async resolveAlert(id: string) {
    const alert = await this.prisma.alert.findUnique({ where: { id } });
    if (!alert) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }

    const resolved = await this.prisma.alert.update({
      where: { id },
      data: { isResolved: true, resolvedAt: new Date() },
    });

    this.crowdGateway.broadcastAlertResolved(resolved);
    return resolved;
  }

  private generateMockAnalysis(capacity: number) {
    // Generate mock results
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
      heatmap_image: null, // UI will display a styled placeholder map overlay
    };
  }
}
