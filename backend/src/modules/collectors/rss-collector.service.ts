import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { TopicCategory } from '../topics/topic.schema';

export interface CollectedTopic {
  title: string;
  description: string;
  source: string;
  url: string;
  category: TopicCategory;
  image?: string;
  publishedAt: Date;
  mentionCount: number;
}

// Linda Ikeji and Pulse Nigeria RSS URLs were 404ing — replaced with working ones
const RSS_SOURCES = [
  {
    name: 'BellaNaija',
    url: 'https://www.bellanaija.com/feed/',
    category: TopicCategory.CELEBRITY,
  },
  {
    name: 'Notjustok',
    url: 'https://notjustok.com/feed/',
    category: TopicCategory.AFROBEATS,
  },
  {
    name: 'Nollywood Reinvented',
    url: 'https://nollywoodreinvented.com/feed/',
    category: TopicCategory.NOLLYWOOD,
  },
  {
    name: 'TooXclusive',
    url: 'https://tooxclusive.com/feed/',
    category: TopicCategory.AFROBEATS,
  },
  {
    name: 'Information Nigeria',
    url: 'https://www.informationng.com/feed',
    category: TopicCategory.CELEBRITY,
  },
  {
    name: 'Naijaloaded',
    url: 'https://www.naijaloaded.com.ng/feed',
    category: TopicCategory.POP_CULTURE,
  },
  {
    name: 'Thedistin',
    url: 'https://www.thedistin.com/feed/',
    category: TopicCategory.CELEBRITY,
  },
  {
    name: 'SDK Blog',
    url: 'https://www.sdk.blog/feed/',
    category: TopicCategory.CELEBRITY,
  },
];

@Injectable()
export class RssCollectorService {
  private readonly logger = new Logger(RssCollectorService.name);

  async collect(): Promise<CollectedTopic[]> {
    const results: CollectedTopic[] = [];

    await Promise.allSettled(
      RSS_SOURCES.map(async (source) => {
        try {
          const items = await this.fetchRss(source.url, source.name, source.category);
          results.push(...items);
          this.logger.debug(`Collected ${items.length} items from ${source.name}`);
        } catch (error) {
          this.logger.warn(`RSS collection failed for ${source.name}: ${error.message}`);
        }
      }),
    );

    this.logger.log(`Total collected across all sources: ${results.length}`);
    return results;
  }

  private async fetchRss(
    url: string,
    sourceName: string,
    category: TopicCategory,
  ): Promise<CollectedTopic[]> {
    const response = await axios.get(url, {
      timeout: 12000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EntertainmentPitchBot/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    });

    return this.parseRss(response.data as string, sourceName, category);
  }

  private parseRss(xml: string, sourceName: string, category: TopicCategory): CollectedTopic[] {
    const items: CollectedTopic[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match: RegExpExecArray;

    while ((match = itemRegex.exec(xml)) !== null) {
      try {
        const item = match[1];
        const title = this.extractTag(item, 'title');
        const description = this.extractDescription(item);
        const link = this.extractTag(item, 'link');
        const pubDate = this.extractTag(item, 'pubDate');
        const image = this.extractImage(item);

        if (!title || !link) continue;

        items.push({
          title: this.cleanHtml(title),
          description: this.cleanHtml(description).slice(0, 500),
          source: sourceName,
          url: link,
          category,
          image,
          publishedAt: pubDate ? new Date(pubDate) : new Date(),
          mentionCount: 1,
        });
      } catch {
        // skip malformed items
      }
    }

    return items.slice(0, 10);
  }

  private extractTag(xml: string, tag: string): string {
    const match = xml.match(
      new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`),
    );
    return match ? (match[1] || match[2] || '').trim() : '';
  }

  private extractDescription(xml: string): string {
    return (
      this.extractTag(xml, 'description') ||
      this.extractTag(xml, 'content:encoded') ||
      ''
    );
  }

  private extractImage(xml: string): string | undefined {
    const media = xml.match(/media:content[^>]+url="([^"]+)"/);
    if (media) return media[1];
    const enclosure = xml.match(/enclosure[^>]+url="([^"]+)"/);
    if (enclosure) return enclosure[1];
    const img = xml.match(/<img[^>]+src="([^"]+)"/);
    if (img) return img[1];
    return undefined;
  }

  private cleanHtml(html: string): string {
    return html
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}