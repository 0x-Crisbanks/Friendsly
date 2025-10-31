import { Controller, Get, Post, Delete, Param, UseGuards, Request, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

interface RequestWithUser extends ExpressRequest {
  user: {
    id: string;
    walletAddress: string;
  };
}

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Request() req: RequestWithUser,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.id;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    
    return this.notificationsService.getNotifications(userId, limitNum);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: RequestWithUser) {
    const userId = req.user.id;
    const count = await this.notificationsService.getUnreadCount(userId);
    
    return { unreadCount: count };
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Request() req: RequestWithUser,
    @Param('id') notificationId: string,
  ) {
    const userId = req.user.id;
    await this.notificationsService.markAsRead(userId, notificationId);
    
    return { message: 'Notification marked as read' };
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Request() req: RequestWithUser) {
    const userId = req.user.id;
    await this.notificationsService.markAllAsRead(userId);
    
    return { message: 'All notifications marked as read' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteNotification(
    @Request() req: RequestWithUser,
    @Param('id') notificationId: string,
  ) {
    const userId = req.user.id;
    await this.notificationsService.deleteNotification(userId, notificationId);
    
    return { message: 'Notification deleted' };
  }

  @Delete('read/all')
  @HttpCode(HttpStatus.OK)
  async deleteAllRead(@Request() req: RequestWithUser) {
    const userId = req.user.id;
    await this.notificationsService.deleteAllRead(userId);
    
    return { message: 'All read notifications deleted' };
  }
}

