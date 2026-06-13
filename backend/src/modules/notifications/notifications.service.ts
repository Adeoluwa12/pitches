import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument, NotificationType } from './notification.schema';

interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
  ) {}

  async create(dto: CreateNotificationDto): Promise<NotificationDocument> {
    return this.notificationModel.create({
      userId: new Types.ObjectId(dto.userId),
      title: dto.title,
      message: dto.message,
      type: dto.type,
      metadata: dto.metadata,
    });
  }

  async getForUser(userId: string, page = 1, limit = 20) {
    const [notifications, total, unreadCount] = await Promise.all([
      this.notificationModel
        .find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.notificationModel.countDocuments({ userId: new Types.ObjectId(userId) }),
      this.notificationModel.countDocuments({
        userId: new Types.ObjectId(userId),
        read: false,
      }),
    ]);
    return { notifications, total, unreadCount, page, limit };
  }

  async markRead(notificationId: string, userId: string) {
    await this.notificationModel.findOneAndUpdate(
      { _id: notificationId, userId: new Types.ObjectId(userId) },
      { read: true },
    );
    return { success: true };
  }

  async markAllRead(userId: string) {
    await this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), read: false },
      { read: true },
    );
    return { success: true };
  }
}
