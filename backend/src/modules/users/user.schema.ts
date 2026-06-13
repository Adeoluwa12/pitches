import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ default: 'Africa/Lagos' })
  timezone: string;

  @Prop({
    type: {
      categories: { type: [String], default: ['nollywood', 'music', 'celebrity'] },
      excludedCategories: { type: [String], default: [] },
      writingStyle: { type: String, default: 'informative' },
    },
    default: {},
  })
  preferences: {
    categories: string[];
    excludedCategories: string[];
    writingStyle: string;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);
