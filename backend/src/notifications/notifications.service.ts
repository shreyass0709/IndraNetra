import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrowdGateway } from '../crowd/crowd.gateway';
import { Role } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private crowdGateway: CrowdGateway,
  ) {}

  /** Create + push a notification for a single user. */
  async create(userId: string, title: string, message: string) {
    const notification = await this.prisma.notification.create({
      data: { userId, title, message },
    });
    this.crowdGateway.broadcastNotification(userId, notification);
    return notification;
  }

  /**
   * Fan a notification out to every user holding one of the given roles.
   * Used for control-room alerts (SOS, overcrowding, new incident reports).
   */
  async notifyRoles(roles: Role[], title: string, message: string) {
    const users = await this.prisma.user.findMany({
      where: { role: { in: roles } },
      select: { id: true },
    });

    if (users.length === 0) return { count: 0 };

    await this.prisma.notification.createMany({
      data: users.map((u) => ({ userId: u.id, title, message })),
    });

    // Push a lightweight signal; clients refetch their own list on receipt.
    for (const u of users) {
      this.crowdGateway.broadcastNotification(u.id, { title, message });
    }
    return { count: users.length };
  }

  async getForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    if (notification.userId !== userId) {
      throw new ForbiddenException('You cannot modify this notification');
    }
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { message: 'All notifications marked as read' };
  }
}
