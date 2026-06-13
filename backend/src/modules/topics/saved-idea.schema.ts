import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SavedIdeaDocument = SavedIdea & Document;

@Schema({ timestamps: true })
export class SavedIdea {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Pitch', required: true })
  pitchId: Types.ObjectId;
}

export const SavedIdeaSchema = SchemaFactory.createForClass(SavedIdea);
SavedIdeaSchema.index({ userId: 1, pitchId: 1 }, { unique: true });
