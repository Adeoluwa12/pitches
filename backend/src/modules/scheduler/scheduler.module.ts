import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/user.schema';
import { SchedulerService } from './scheduler.service';
import { DebugController } from './debug.controller';
import { TopicsModule } from '../topics/topics.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    TopicsModule,
    NotificationsModule,
    EmailModule,
    AiModule,
  ],
  providers: [SchedulerService],
  controllers: [DebugController],
  exports: [SchedulerService],
})
export class SchedulerModule {}