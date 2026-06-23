import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TopicsModule } from './modules/topics/topics.module';
import { TrendsModule } from './modules/trends/trends.module';
import { AiModule } from './modules/ai/ai.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { EmailModule } from './modules/email/email.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { CollectorsModule } from './modules/collectors/collectors.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        heartbeatFrequencyMS: 10000,
        maxPoolSize: 10,
        retryWrites: true,
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    TopicsModule,
    TrendsModule,
    AiModule,
    NotificationsModule,
    EmailModule,
    SchedulerModule,
    CollectorsModule,
  ],
})
export class AppModule {}