import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PitchDocument = Pitch & Document;

@Schema({ timestamps: true })
export class Pitch {
  @Prop({ type: Types.ObjectId, ref: 'Topic', required: true })
  topicId: Types.ObjectId;

  @Prop({ required: true })
  headline: string;

  @Prop({ required: true })
  angle: string;

  @Prop({ required: true })
  summary: string;

  @Prop({ required: true })
  whyNow: string;

  @Prop({ type: [String], default: [] })
  structure: string[];

  @Prop()
  targetAudience: string;

  @Prop({ default: 0 })
  saveCount: number;
}

export const PitchSchema = SchemaFactory.createForClass(Pitch);
PitchSchema.index({ topicId: 1 });
PitchSchema.index({ createdAt: -1 });
