import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getNotifications(userId: string, limit: number = 50) {
    this.logger.log(`📬 Getting notifications for user ${userId}`);

    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return notifications;
  }

  async getUnreadCount(userId: string): Promise<number> {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return count;
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    this.logger.log(`✅ Marking notification ${notificationId} as read`);

    await this.prisma.notification.update({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    this.logger.log(`✅ Marking all notifications as read for user ${userId}`);

    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    this.logger.log(`🗑️ Deleting notification ${notificationId}`);

    await this.prisma.notification.delete({
      where: { id: notificationId, userId },
    });
  }

  async deleteAllRead(userId: string): Promise<void> {
    this.logger.log(`🗑️ Deleting all read notifications for user ${userId}`);

    await this.prisma.notification.deleteMany({
      where: { userId, isRead: true },
    });
  }
}

