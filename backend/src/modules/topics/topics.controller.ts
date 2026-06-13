import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Request,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { TopicsService } from './topics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('topics')
@UseGuards(JwtAuthGuard)
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get()
  getAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('category') category?: string,
  ) {
    return this.topicsService.getAll(page, limit, category);
  }

  @Get('trending')
  getTrending(@Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number) {
    return this.topicsService.getTrending(limit);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.topicsService.getById(id);
  }
}

@Controller('pitches')
@UseGuards(JwtAuthGuard)
export class PitchesController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get('today')
  getToday() {
    return this.topicsService.getTodaysPitches();
  }

  @Post('generate')
  generate(@Query('topicId') topicId: string) {
    return this.topicsService.generatePitchesForTopic(topicId);
  }

  @Post(':id/save')
  save(@Param('id') pitchId: string, @Request() req) {
    return this.topicsService.savePitch(req.user.userId, pitchId);
  }

  @Get('saved')
  getSaved(@Request() req) {
    return this.topicsService.getSavedIdeas(req.user.userId);
  }
}
