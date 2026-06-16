import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Topic, TopicSchema } from './topic.schema';
import { Pitch, PitchSchema } from './pitch.schema';
import { SavedIdea, SavedIdeaSchema } from './saved-idea.schema';
import { TopicsService } from './topics.service';
import { TopicsController, PitchesController, SavedIdeasController } from './topics.controller';
import { AiModule } from '../ai/ai.module';
import { TrendsModule } from '../trends/trends.module';
import { CollectorsModule } from '../collectors/collectors.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Topic.name, schema: TopicSchema },
      { name: Pitch.name, schema: PitchSchema },
      { name: SavedIdea.name, schema: SavedIdeaSchema },
    ]),
    AiModule,
    TrendsModule,
    CollectorsModule,
  ],
  providers: [TopicsService],
  controllers: [TopicsController, PitchesController, SavedIdeasController],
  exports: [TopicsService],
})
export class TopicsModule {}