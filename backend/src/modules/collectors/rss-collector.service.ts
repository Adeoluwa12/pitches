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

const RSS_SOURCES = [
  {
    name: 'Linda Ikeji Blog',
    url: 'https://www.lindaikejisblog.com/feeds/posts/default?alt=rss',
    category: TopicCategory.CELEBRITY,
  },
  {
    name: 'Pulse Nigeria',
    url: 'https://www.pulse.ng/rss',
    category: TopicCategory.POP_CULTURE,
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
    name: 'BellaNaija',
    url: 'https://www.bellanaija.com/feed/',
    category: TopicCategory.CELEBRITY,
  },
  {
    name: 'The NET Nigeria',
    url: 'https://thenet.ng/feed/',
    category: TopicCategory.POP_CULTURE,
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

    return results;
  }

  private async fetchRss(
    url: string,
    sourceName: string,
    category: TopicCategory,
  ): Promise<CollectedTopic[]> {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'EntertainmentPitchAssistant/1.0',
      },
    });

    const xml = response.data as string;
    return this.parseRss(xml, sourceName, category);
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

    return items.slice(0, 10); // max 10 per source
  }

  private extractTag(xml: string, tag: string): string {
    const match = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`));
    return match ? (match[1] || match[2] || '').trim() : '';
  }

  private extractDescription(xml: string): string {
    return this.extractTag(xml, 'description') || this.extractTag(xml, 'content:encoded') || '';
  }

  private extractImage(xml: string): string | undefined {
    const mediaMatch = xml.match(/media:content[^>]+url="([^"]+)"/);
    if (mediaMatch) return mediaMatch[1];
    const enclosureMatch = xml.match(/enclosure[^>]+url="([^"]+)"/);
    if (enclosureMatch) return enclosureMatch[1];
    const imgMatch = xml.match(/<img[^>]+src="([^"]+)"/);
    if (imgMatch) return imgMatch[1];
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
      .trim();
  }
}
