import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { TopicsService } from '../topics/topics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('debug')
@UseGuards(JwtAuthGuard)
export class DebugController {
  constructor(
    private readonly schedulerService: SchedulerService,
    private readonly topicsService: TopicsService,
  ) {}

  @Post('collect')
  async collect() {
    const result = await this.topicsService.collectAndProcessTrends();
    return { message: 'Collection complete', ...result };
  }

  @Post('morning-brief')
  async morningBrief() {
    const result = await this.schedulerService.executeMorningBrief();
    return { message: 'Morning brief triggered', ...result };
  }

  @Post('hot-check')
  async hotCheck() {
    const result = await this.schedulerService.executeHotTopicCheck();
    return { message: 'Hot topic check complete', ...result };
  }

  @Get('trending')
  async trending() {
    const topics = await this.topicsService.getTrending(20);
    return {
      count: topics.length,
      topics: topics.map((t: any) => ({
        title: t.title,
        score: t.trendScore,
        status: t.status,
        category: t.category,
        breakdown: t.scoreBreakdown,
      })),
    };
  }
}