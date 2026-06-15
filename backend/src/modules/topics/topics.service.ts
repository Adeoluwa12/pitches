import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Topic, TopicDocument, TopicStatus } from './topic.schema';
import { Pitch, PitchDocument } from './pitch.schema';
import { SavedIdea, SavedIdeaDocument } from './saved-idea.schema';
import { AiService } from '../ai/ai.service';
import { TrendScoringService } from '../trends/trend-scoring.service';
import { RssCollectorService } from '../collectors/rss-collector.service';

@Injectable()
export class TopicsService {
  private readonly logger = new Logger(TopicsService.name);

  constructor(
    @InjectModel(Topic.name) private topicModel: Model<TopicDocument>,
    @InjectModel(Pitch.name) private pitchModel: Model<PitchDocument>,
    @InjectModel(SavedIdea.name) private savedIdeaModel: Model<SavedIdeaDocument>,
    private readonly aiService: AiService,
    private readonly trendScoring: TrendScoringService,
    private readonly rssCollector: RssCollectorService,
  ) {}

  // async getTrending(limit = 10): Promise<any[]> {
  //   return this.topicModel
  //     .find({ status: { $in: [TopicStatus.PROCESSED, TopicStatus.HOT] } })
  //     .sort({ trendScore: -1, createdAt: -1 })
  //     .limit(limit)
  //     .lean();
  // }

  // async getAll(page = 1, limit = 20, category?: string): Promise<any> {
  //   const filter = category ? { category } : {};
  //   const [topics, total] = await Promise.all([
  //     this.topicModel
  //       .find(filter)
  //       .sort({ createdAt: -1 })
  //       .skip((page - 1) * limit)
  //       .limit(limit)
  //       .lean(),
  //     this.topicModel.countDocuments(filter),
  //   ]);
  //   return { topics, total, page, limit };
  // }

  async getTrending(limit = 10): Promise<any[]> {
    return this.topicModel
      .find({}) // return all, not just processed/hot
      .sort({ trendScore: -1, createdAt: -1 })
      .limit(limit)
      .lean();
  }
  
  async getAll(page = 1, limit = 20, category?: string): Promise<any> {
    const filter = category ? { category } : {};
    const [topics, total] = await Promise.all([
      this.topicModel
        .find(filter)
        .sort({ trendScore: -1, createdAt: -1 }) // sort by score, not just date
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.topicModel.countDocuments(filter),
    ]);
    return { topics, total, page, limit };
  }

  async getById(id: string): Promise<any> {
    const topic = await this.topicModel.findById(id).lean();
    if (!topic) throw new NotFoundException('Topic not found');
    const pitches = await this.pitchModel.find({ topicId: new Types.ObjectId(id) }).lean();
    return { ...topic, pitches };
  }

  async getTodaysPitches(): Promise<any[]> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const topics = await this.topicModel
      .find({ createdAt: { $gte: startOfDay }, status: TopicStatus.PROCESSED })
      .sort({ trendScore: -1 })
      .limit(10)
      .lean();

    const results = await Promise.all(
      topics.map(async (topic) => {
        const pitches = await this.pitchModel.find({ topicId: topic._id }).lean();
        return { ...topic, pitches };
      }),
    );

    return results;
  }

  async generatePitchesForTopic(topicId: string): Promise<PitchDocument[]> {
    const topic = await this.topicModel.findById(topicId);
    if (!topic) throw new NotFoundException('Topic not found');

    const existing = await this.pitchModel.find({ topicId: new Types.ObjectId(topicId) });
    if (existing.length > 0) {
      this.logger.debug(`Pitches already exist for topic ${topicId}, regenerating`);
    }

    const pitchResults = await this.aiService.generatePitches(topic.title, topic.description);

    const savedPitches = await Promise.all(
      pitchResults.map((p) =>
        this.pitchModel.create({
          topicId: topic._id,
          headline: p.headline,
          angle: p.angle,
          summary: p.summary,
          whyNow: p.whyNow,
          structure: p.structure,
          targetAudience: p.targetAudience,
        }),
      ),
    );

    topic.status = TopicStatus.PROCESSED;
    await topic.save();

    return savedPitches;
  }

  async savePitch(userId: string, pitchId: string): Promise<any> {
    const pitch = await this.pitchModel.findById(pitchId);
    if (!pitch) throw new NotFoundException('Pitch not found');

    const existing = await this.savedIdeaModel.findOne({
      userId: new Types.ObjectId(userId),
      pitchId: new Types.ObjectId(pitchId),
    });

    if (existing) return { message: 'Already saved' };

    await this.savedIdeaModel.create({
      userId: new Types.ObjectId(userId),
      pitchId: new Types.ObjectId(pitchId),
    });

    await this.pitchModel.findByIdAndUpdate(pitchId, { $inc: { saveCount: 1 } });

    return { message: 'Pitch saved' };
  }

  async getSavedIdeas(userId: string): Promise<any[]> {
    const saved = await this.savedIdeaModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean();

    const results = await Promise.all(
      saved.map(async (s) => {
        const pitch = await this.pitchModel.findById(s.pitchId).lean();
        if (!pitch) return null;
        const topic = await this.topicModel.findById(pitch.topicId).lean();
        return { ...s, pitch, topic };
      }),
    );

    return results.filter(Boolean);
  }

  async collectAndProcessTrends(): Promise<{ collected: number; hot: number }> {
    this.logger.log('Starting trend collection...');
    const collected = await this.rssCollector.collect();
    let hotCount = 0;

    const results = await Promise.allSettled(
      collected.map(async (item) => {
        const existing = await this.topicModel.findOne({ url: item.url });
        if (existing) return;

        const scoreBreakdown = this.trendScoring.score({
          title: item.title,
          description: item.description,
          publishedAt: item.publishedAt,
          mentionCount: item.mentionCount,
          sourceCount: 1,
        });

        const isHot = this.trendScoring.isHot(scoreBreakdown);
        if (isHot) hotCount++;

        await this.topicModel.create({
          title: item.title,
          description: item.description,
          source: item.source,
          url: item.url,
          category: item.category,
          image: item.image,
          trendScore: scoreBreakdown.total,
          scoreBreakdown: {
            freshness: scoreBreakdown.freshness,
            newsMentions: scoreBreakdown.newsMentions,
            socialGrowth: scoreBreakdown.socialGrowth,
            sourceCount: scoreBreakdown.sourceCount,
            celebrityRelevance: scoreBreakdown.celebrityRelevance,
            engagement: scoreBreakdown.engagement,
          },
          status: isHot ? TopicStatus.HOT : TopicStatus.PENDING,
        });
      }),
    );

    const newCount = results.filter((r) => r.status === 'fulfilled').length;
    this.logger.log(`Collected ${newCount} new topics, ${hotCount} hot`);
    return { collected: newCount, hot: hotCount };
  }

  async getHotTopicsForNotification(): Promise<TopicDocument[]> {
    return this.topicModel
      .find({
        status: TopicStatus.HOT,
        notificationSent: false,
        trendScore: { $gte: 70 },
      })
      .sort({ trendScore: -1 })
      .limit(3)
      .exec();
  }

  async markNotificationSent(topicIds: string[]): Promise<void> {
    await this.topicModel.updateMany(
      { _id: { $in: topicIds.map((id) => new Types.ObjectId(id)) } },
      { notificationSent: true },
    );
  }
}