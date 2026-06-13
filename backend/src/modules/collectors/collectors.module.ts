import { Module } from '@nestjs/common';
import { RssCollectorService } from './rss-collector.service';

@Module({
  providers: [RssCollectorService],
  exports: [RssCollectorService],
})
export class CollectorsModule {}
