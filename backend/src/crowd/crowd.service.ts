import { Injectable, NotFoundException, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrowdGateway } from './crowd.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { CloudinaryService } from '../utils/cloudinary.service';
import { estimateAreaSqMeters } from '../common/risk.util';
import { RiskLevel, Role } from '@prisma/client';

@Injectable()
export class CrowdService {
  constructor(
    private prisma: PrismaService,
    private crowdGateway: CrowdGateway,
    private notifications: NotificationsService,
    private cloudinary: CloudinaryService,
  ) {}

  /**
   * Uploads the AI service's base64 heatmap overlay to object storage and
   * returns its URL. Storing raw base64 in Postgres bloats every row and every
   * API response that includes a report; the DB should only ever hold a URL.
   */
  private async resolveHeatmapUrl(base64Image: string | null): Promise<string | null> {
    if (!base64Image) return null;
    try {
      return await this.cloudinary.uploadDataUri(base64Image);
    } catch (err: any) {
      console.warn('Heatmap upload to Cloudinary failed, storing no image:', err.message);
      return null;
    }
  }

  async analyzeFrame(eventId: string, file: Express.Multer.File) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    let result: any;
    const areaSqMeters = estimateAreaSqMeters(event.maxCapacity, event.areaSqMeters);

    // Call FastAPI AI service. No fallback numbers: a failed analysis records
    // nothing, because an invented crowd count would raise (or hide) real alerts.
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const formData = new FormData();
    formData.append('file', new Blob([file.buffer as any], { type: file.mimetype }), file.originalname);
    formData.append('capacity', event.maxCapacity.toString());
    formData.append('area_sqm', areaSqMeters.toString());

    let response: Response | null = null;
    try {
      response = await fetch(`${aiServiceUrl}/analyze`, { method: 'POST', body: formData });
    } catch (err: any) {
      console.warn('AI service unreachable:', err.message);
    }
    if (!response || !response.ok) {
      const detail = response ? ((await response.json().catch(() => ({}))) as any).detail : null;
      if (response?.status === 400) throw new BadRequestException(detail || 'Invalid frame');
      throw new ServiceUnavailableException(detail || 'AI analysis is unavailable; nothing was recorded.');
    }
    result = await response.json();

    const heatmapUrl = await this.resolveHeatmapUrl(result.heatmap_image);

    // Save report in database
    const report = await this.prisma.crowdReport.create({
      data: {
        eventId: event.id,
        peopleCount: result.people_count,
        densityLevel: result.density_score,
        riskLevel: result.risk_level as RiskLevel,
        heatmapUrl,
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

  /**
   * Real aggregated analytics for one event, computed from persisted
   * CrowdReport + Alert history — no mock/seed values. Powers the Analytics tab.
   */
  async getEventAnalytics(eventId: string) {
    const reports = await this.prisma.crowdReport.findMany({
      where: { eventId },
      orderBy: { timestamp: 'asc' },
      take: 200,
    });

    const counts = reports.map((r) => r.peopleCount);
    const densities = reports.map((r) => r.densityLevel);

    // Last 30 points for the trend chart (chronological).
    const trend = reports.slice(-30).map((r) => ({
      time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      count: r.peopleCount,
    }));

    const peakCrowd = counts.length ? Math.max(...counts) : 0;
    const avgCrowd = counts.length
      ? Math.round(counts.reduce((a, b) => a + b, 0) / counts.length)
      : 0;
    const avgDensity = densities.length
      ? parseFloat((densities.reduce((a, b) => a + b, 0) / densities.length).toFixed(2))
      : 0;

    const alerts = await this.prisma.alert.findMany({ where: { eventId } });
    const totalAlerts = alerts.length;
    const activeAlerts = alerts.filter((a) => !a.isResolved).length;

    const resolved = alerts.filter((a) => a.isResolved && a.resolvedAt);
    const avgResolutionMinutes = resolved.length
      ? parseFloat(
          (
            resolved.reduce(
              (sum, a) => sum + (new Date(a.resolvedAt as Date).getTime() - new Date(a.createdAt).getTime()),
              0,
            ) /
            resolved.length /
            60000
          ).toFixed(1),
        )
      : 0;

    return {
      trend,
      peakCrowd,
      avgCrowd,
      avgDensity,
      totalAlerts,
      activeAlerts,
      avgResolutionMinutes,
      sampleCount: reports.length,
    };
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
}
