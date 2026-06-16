import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument } from '../users/user.schema';
import { TopicsService } from '../topics/topics.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { AiService } from '../ai/ai.service';
import { NotificationType } from '../notifications/notification.schema';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly topicsService: TopicsService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly aiService: AiService,
    private readonly config: ConfigService,
  ) {}

  // 6:30 AM Lagos time daily
  @Cron('30 6 * * *', { timeZone: 'Africa/Lagos' })
  async runMorningBrief() {
    await this.executeMorningBrief();
  }

  // Every 10 minutes
  @Cron('*/10 * * * *')
  async monitorHotTopics() {
    await this.executeHotTopicCheck();
  }

  async executeMorningBrief(): Promise<{
    success: boolean;
    usersNotified: number;
    topicsProcessed: number;
    error?: string;
  }> {
    this.logger.log('⏰ Running morning briefing job...');

    try {
      await this.topicsService.collectAndProcessTrends();

      const trendingTopics = await this.topicsService.getTrending(8);
      if (trendingTopics.length === 0) {
        this.logger.warn('No trending topics for morning brief');
        return { success: false, usersNotified: 0, topicsProcessed: 0, error: 'No trending topics found' };
      }

      const topicsWithPitches = await Promise.all(
        trendingTopics.slice(0, 5).map(async (topic: any) => {
          try {
            const pitches = await this.topicsService.generatePitchesForTopic(topic._id.toString());
            return { topic, pitches };
          } catch (error) {
            this.logger.warn(`Pitch generation failed for topic ${topic._id}: ${error.message}`);
            return { topic, pitches: [] };
          }
        }),
      );

      const validTopics = topicsWithPitches.filter((t) => t.pitches.length > 0);
      if (validTopics.length === 0) {
        this.logger.warn('AI pitch generation failed for all topics — check OPENROUTER_API_KEY');
        return { success: false, usersNotified: 0, topicsProcessed: 0, error: 'Pitch generation failed for all topics — check OPENROUTER_API_KEY in Render env vars' };
      }

      const intro = await this.aiService
        .generateMorningBriefSummary(
          validTopics.map((t) => ({
            title: t.topic.title,
            pitches: t.pitches.map((p: any) => ({
              headline: p.headline,
              angle: p.angle,
              summary: p.summary,
              whyNow: p.whyNow,
              structure: p.structure,
              targetAudience: p.targetAudience,
            })),
          })),
        )
        .catch(() => "Here are today's top entertainment stories worth writing about.");

      const users = await this.userModel.find({}).lean();
      this.logger.log(`Sending morning brief to ${users.length} users`);

      const today = new Date().toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      let notified = 0;

      await Promise.allSettled(
        users.map(async (user) => {
          const preferredTopics = validTopics.filter((t) => {
            const cats = user.preferences?.categories || [];
            return cats.length === 0 || cats.includes(t.topic.category);
          });

          const topicsToSend = preferredTopics.length > 0 ? preferredTopics : validTopics;

          await this.notificationsService.create({
            userId: user._id.toString(),
            title: '☀️ Your Morning Entertainment Brief is Ready',
            message: `${topicsToSend.length} trending topics with article pitches — let's write!`,
            type: NotificationType.MORNING_BRIEF,
            metadata: { topicCount: topicsToSend.length },
          });

          await this.emailService
            .sendMorningBrief({
              recipientName: user.name,
              recipientEmail: user.email,
              intro,
              date: today,
              topics: topicsToSend.map((t) => ({
                title: t.topic.title,
                category: t.topic.category,
                trendScore: t.topic.trendScore,
                topPitch: t.pitches[0]?.headline || '',
                pitchAngle: t.pitches[0]?.angle || '',
              })),
            })
            .catch((err) => {
              this.logger.warn(`Email failed for ${user.email}: ${err.message}`);
            });

          notified++;
        }),
      );

      this.logger.log(`✅ Morning briefing complete — notified ${notified} users`);
      return { success: true, usersNotified: notified, topicsProcessed: validTopics.length };
    } catch (error) {
      this.logger.error(`Morning briefing failed: ${error.message}`, error.stack);
      return { success: false, usersNotified: 0, topicsProcessed: 0, error: error.message };
    }
  }

  async executeHotTopicCheck(): Promise<{
    hotFound: number;
    notified: number;
    error?: string;
  }> {
    this.logger.debug('🔍 Checking for hot topics...');

    try {
      await this.topicsService.collectAndProcessTrends();

      const hotTopics = await this.topicsService.getHotTopicsForNotification();
      if (hotTopics.length === 0) {
        this.logger.debug('No new hot topics to notify');
        return { hotFound: 0, notified: 0 };
      }

      this.logger.log(`🚨 Found ${hotTopics.length} hot topics, notifying users`);
      const users = await this.userModel.find({}).lean();
      let notified = 0;

      for (const topic of hotTopics) {
        let pitches: { headline: string; angle: string }[] = [];

        try {
          const generated = await this.topicsService.generatePitchesForTopic(
            topic._id.toString(),
          );
          pitches = generated.slice(0, 3).map((p: any) => ({
            headline: p.headline,
            angle: p.angle,
          }));
        } catch (error) {
          this.logger.warn(`Pitch generation failed for hot topic: ${error.message}`);
        }

        await Promise.allSettled(
          users.map(async (user) => {
            await this.notificationsService.create({
              userId: user._id.toString(),
              title: `🚨 HOT: ${topic.title.slice(0, 60)}`,
              message: `Trend score ${topic.trendScore}/100 — write this NOW`,
              type: NotificationType.HOT_TOPIC,
              metadata: { topicId: topic._id, trendScore: topic.trendScore },
            });

            if (pitches.length > 0) {
              await this.emailService
                .sendHotTopicAlert({
                  recipientName: user.name,
                  recipientEmail: user.email,
                  topicTitle: topic.title,
                  topicDescription: topic.description,
                  trendScore: topic.trendScore,
                  pitches,
                })
                .catch((err) => {
                  this.logger.warn(`Hot topic email failed for ${user.email}: ${err.message}`);
                });
            }

            notified++;
          }),
        );
      }

      await this.topicsService.markNotificationSent(
        hotTopics.map((t) => t._id.toString()),
      );

      return { hotFound: hotTopics.length, notified };
    } catch (error) {
      this.logger.error(`Hot topic monitoring failed: ${error.message}`);
      return { hotFound: 0, notified: 0, error: error.message };
    }
  }
}