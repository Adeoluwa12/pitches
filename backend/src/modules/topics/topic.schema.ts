import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TopicDocument = Topic & Document;

export enum TopicCategory {
  NOLLYWOOD = 'nollywood',
  MUSIC = 'music',
  CELEBRITY = 'celebrity',
  REALITY_TV = 'reality_tv',
  INTERNET_TRENDS = 'internet_trends',
  POP_CULTURE = 'pop_culture',
  MOVIE_REVIEW = 'movie_review',
  AFROBEATS = 'afrobeats',
}

export enum TopicStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  HOT = 'hot',
  EXPIRED = 'expired',
}

@Schema({ timestamps: true })
export class Topic {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  source: string;

  @Prop()
  url: string;

  @Prop({ type: String, enum: TopicCategory })
  category: TopicCategory;

  @Prop()
  image: string;

  @Prop({ default: 0, min: 0, max: 100 })
  trendScore: number;

  @Prop({
    type: {
      freshness: { type: Number, default: 0 },
      newsMentions: { type: Number, default: 0 },
      socialGrowth: { type: Number, default: 0 },
      sourceCount: { type: Number, default: 0 },
      celebrityRelevance: { type: Number, default: 0 },
      engagement: { type: Number, default: 0 },
    },
    default: {},
  })
  scoreBreakdown: {
    freshness: number;
    newsMentions: number;
    socialGrowth: number;
    sourceCount: number;
    celebrityRelevance: number;
    engagement: number;
  };

  @Prop({ type: String, enum: TopicStatus, default: TopicStatus.PENDING })
  status: TopicStatus;

  @Prop({ type: [String], default: [] })
  relatedSources: string[];

  @Prop({ default: false })
  notificationSent: boolean;
}

export const TopicSchema = SchemaFactory.createForClass(Topic);
TopicSchema.index({ trendScore: -1 });
TopicSchema.index({ category: 1 });
TopicSchema.index({ createdAt: -1 });
TopicSchema.index({ status: 1 });
