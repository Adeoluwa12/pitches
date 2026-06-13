import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
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

  // 6:30 AM daily — morning briefing
  @Cron('30 6 * * *', { timeZone: 'Africa/Lagos' })
  async runMorningBrief() {
    this.logger.log('⏰ Running morning briefing job...');

    try {
      // 1. Collect fresh trends first
      await this.topicsService.collectAndProcessTrends();

      // 2. Get top trending topics
      const trendingTopics = await this.topicsService.getTrending(8);
      if (trendingTopics.length === 0) {
        this.logger.warn('No trending topics for morning brief');
        return;
      }

      // 3. Generate pitches for topics that don't have them
      const topicsWithPitches = await Promise.all(
        trendingTopics.slice(0, 5).map(async (topic) => {
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
      if (validTopics.length === 0) return;

      // 4. Get briefing intro from AI
      const intro = await this.aiService.generateMorningBriefSummary(
        validTopics.map((t) => ({
          title: t.topic.title,
          pitches: t.pitches.map((p) => ({
            headline: p.headline,
            angle: p.angle,
            summary: p.summary,
            whyNow: p.whyNow,
            structure: p.structure,
            targetAudience: p.targetAudience,
          })),
        })),
      ).catch(() => "Here are today's top entertainment stories worth writing about.");

      // 5. Get all users
      const users = await this.userModel.find({}).lean();
      this.logger.log(`Sending morning brief to ${users.length} users`);

      const today = new Date().toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      // 6. Send to each user
      await Promise.allSettled(
        users.map(async (user) => {
          const preferredTopics = validTopics.filter((t) => {
            const userCategories = user.preferences?.categories || [];
            if (userCategories.length === 0) return true;
            return userCategories.includes(t.topic.category);
          });

          const topicsToSend = preferredTopics.length > 0 ? preferredTopics : validTopics;

          // Create in-app notification
          await this.notificationsService.create({
            userId: user._id.toString(),
            title: "☀️ Your Morning Entertainment Brief is Ready",
            message: `${topicsToSend.length} trending topics with article pitches — let's write!`,
            type: NotificationType.MORNING_BRIEF,
            metadata: { topicCount: topicsToSend.length },
          });

          // Send email
          await this.emailService.sendMorningBrief({
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
          }).catch((err) => {
            this.logger.warn(`Email failed for ${user.email}: ${err.message}`);
          });
        }),
      );

      this.logger.log('✅ Morning briefing complete');
    } catch (error) {
      this.logger.error(`Morning briefing failed: ${error.message}`, error.stack);
    }
  }

  // Every 10 minutes — hot topic monitor
  @Cron('*/10 * * * *')
  async monitorHotTopics() {
    this.logger.debug('🔍 Checking for hot topics...');

    try {
      const { collected, hot } = await this.topicsService.collectAndProcessTrends();
      if (hot === 0) return;

      const hotTopics = await this.topicsService.getHotTopicsForNotification();
      if (hotTopics.length === 0) return;

      this.logger.log(`🚨 Found ${hotTopics.length} hot topics, notifying users`);

      const users = await this.userModel.find({}).lean();

      for (const topic of hotTopics) {
        // Generate pitches for hot topic
        let pitches = [];
        try {
          const generatedPitches = await this.topicsService.generatePitchesForTopic(topic._id.toString());
          pitches = generatedPitches.slice(0, 3).map((p) => ({
            headline: p.headline,
            angle: p.angle,
          }));
        } catch (error) {
          this.logger.warn(`Pitch generation failed for hot topic: ${error.message}`);
        }

        await Promise.allSettled(
          users.map(async (user) => {
            // In-app notification
            await this.notificationsService.create({
              userId: user._id.toString(),
              title: `🚨 HOT: ${topic.title.slice(0, 60)}`,
              message: `Trend score ${topic.trendScore}/100 — this is worth writing about NOW`,
              type: NotificationType.HOT_TOPIC,
              metadata: { topicId: topic._id, trendScore: topic.trendScore },
            });

            // Email alert
            if (pitches.length > 0) {
              await this.emailService.sendHotTopicAlert({
                recipientName: user.name,
                recipientEmail: user.email,
                topicTitle: topic.title,
                topicDescription: topic.description,
                trendScore: topic.trendScore,
                pitches,
              }).catch((err) => {
                this.logger.warn(`Hot topic email failed for ${user.email}: ${err.message}`);
              });
            }
          }),
        );
      }

      // Mark as notified
      await this.topicsService.markNotificationSent(
        hotTopics.map((t) => t._id.toString()),
      );

    } catch (error) {
      this.logger.error(`Hot topic monitoring failed: ${error.message}`);
    }
  }
}
