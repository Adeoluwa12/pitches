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
  ): Promise<any> {
    return this.topicsService.getAll(page, limit, category);
  }

  @Get('trending')
  getTrending(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<any[]> {
    return this.topicsService.getTrending(limit);
  }

  @Get(':id')
  getById(@Param('id') id: string): Promise<any> {
    return this.topicsService.getById(id);
  }
}

@Controller('pitches')
@UseGuards(JwtAuthGuard)
export class PitchesController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get('today')
  getToday(): Promise<any[]> {
    return this.topicsService.getTodaysPitches();
  }

  @Post('generate')
  generate(@Query('topicId') topicId: string): Promise<any[]> {
    return this.topicsService.generatePitchesForTopic(topicId);
  }

  @Post(':id/save')
  save(@Param('id') pitchId: string, @Request() req): Promise<any> {
    return this.topicsService.savePitch(req.user.userId, pitchId);
  }

  @Get('saved')
  getSaved(@Request() req): Promise<any[]> {
    return this.topicsService.getSavedIdeas(req.user.userId);
  }
}