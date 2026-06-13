import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  MORNING_BRIEF = 'MORNING_BRIEF',
  HOT_TOPIC = 'HOT_TOPIC',
  NEW_PITCH = 'NEW_PITCH',
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: String, enum: NotificationType, required: true })
  type: NotificationType;

  @Prop({ default: false })
  read: boolean;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ createdAt: -1 });
