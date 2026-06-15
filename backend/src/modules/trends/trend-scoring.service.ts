import { Injectable, Logger } from '@nestjs/common';

export interface RawTopicData {
  title: string;
  description: string;
  publishedAt?: Date;
  sourceCount?: number;
  mentionCount?: number;
  engagementScore?: number;
}

export interface TrendScoreBreakdown {
  freshness: number;
  newsMentions: number;
  socialGrowth: number;
  sourceCount: number;
  celebrityRelevance: number;
  engagement: number;
  total: number;
}

const CELEBRITY_KEYWORDS = [
  'davido', 'wizkid', 'burna boy', 'tiwa savage', 'don jazzy', 'olamide',
  'genevieve', 'omotola', 'rmd', 'kate henshaw', 'ramsey nouah', 'ini edo',
  'mercy johnson', 'yemi alade', 'ckay', 'asake', 'tems', 'fireboy',
  'rema', 'omah lay', 'zinoleesky', 'naira marley', 'mohbad', 'portable',
  'small doctor', 'zlatan', 'ebuka', 'bbnaija', 'big brother', 'falz',
  'simi', 'adekunle gold', 'peter okoye', 'psquare', 'flavour', 'phyno',
];

const NOLLYWOOD_KEYWORDS = [
  'nollywood', 'movie', 'film', 'cinema', 'box office', 'streaming',
  'netflix', 'showmax', 'iroko', 'director', 'producer', 'actor',
  'actress', 'premiere', 'series', 'season',
];

const MUSIC_KEYWORDS = [
  'afrobeats', 'afropop', 'amapiano', 'album', 'single', 'ep',
  'concert', 'tour', 'grammy', 'headies', 'bet awards', 'music video',
  'billboard', 'chart', 'track', 'song', 'release', 'featuring',
];

const ENGAGEMENT_KEYWORDS = [
  'controversy', 'viral', 'trending', 'breakup', 'beef', 'drama',
  'arrested', 'pregnant', 'married', 'died', 'award', 'record',
  'leaked', 'exposed', 'shade', 'diss', 'feud', 'fight', 'cheat',
  'divorce', 'ban', 'suspended', 'fired', 'quit', 'announces',
  'exclusive', 'breaking', 'confirmed', 'reacts', 'responds', 'slams',
];

@Injectable()
export class TrendScoringService {
  private readonly logger = new Logger(TrendScoringService.name);

  score(data: RawTopicData): TrendScoreBreakdown {
    const freshness = this.scoreFreshness(data.publishedAt);
    const newsMentions = this.scoreMentions(data.mentionCount || 1);
    // RSS has zero social data — give a flat 15 base so scores aren't gutted
    const socialGrowth = data.engagementScore
      ? this.scoreSocialGrowth(data.engagementScore)
      : 15;
    const sourceCount = this.scoreSourceCount(data.sourceCount || 1);
    const celebrityRelevance = this.scoreCelebrityRelevance(data.title, data.description);
    const engagement = this.scoreEngagement(data.title, data.description);

    const total = Math.min(
      100,
      Math.round(freshness + newsMentions + socialGrowth + sourceCount + celebrityRelevance + engagement),
    );

    return { freshness, newsMentions, socialGrowth, sourceCount, celebrityRelevance, engagement, total };
  }

  private scoreFreshness(publishedAt?: Date): number {
    if (!publishedAt) return 12;
    const ageHours = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60);
    if (ageHours < 1) return 20;
    if (ageHours < 3) return 18;
    if (ageHours < 6) return 15;
    if (ageHours < 12) return 12;
    if (ageHours < 24) return 8;
    if (ageHours < 48) return 4;
    return 2;
  }

  private scoreMentions(count: number): number {
    if (count >= 10) return 15;
    if (count >= 5) return 10;
    if (count >= 2) return 7;
    return 5; // RSS always has at least 1, bumped base
  }

  private scoreSocialGrowth(engagement: number): number {
    if (engagement >= 10000) return 30;
    if (engagement >= 5000) return 25;
    if (engagement >= 1000) return 20;
    if (engagement >= 500) return 15;
    if (engagement >= 100) return 10;
    return 5;
  }

  private scoreSourceCount(count: number): number {
    if (count >= 5) return 10;
    if (count >= 3) return 7;
    if (count >= 2) return 5;
    return 3;
  }

  private scoreCelebrityRelevance(title: string, description: string): number {
    const text = `${title} ${description}`.toLowerCase();
    const hasCelebrity = CELEBRITY_KEYWORDS.some((k) => text.includes(k));
    const hasNollywood = NOLLYWOOD_KEYWORDS.some((k) => text.includes(k));
    const hasMusic = MUSIC_KEYWORDS.some((k) => text.includes(k));

    let score = 0;
    if (hasCelebrity) score += 12;
    if (hasNollywood) score += 5;
    if (hasMusic) score += 5;
    return Math.min(15, score);
  }

  private scoreEngagement(title: string, description: string): number {
    const text = `${title} ${description}`.toLowerCase();
    const matches = ENGAGEMENT_KEYWORDS.filter((w) => text.includes(w)).length;
    return Math.min(20, matches * 4); // bumped cap from 10 → 20
  }

  // Lowered from 70 → 45. RSS-only data realistically scores 35-65.
  isHot(score: TrendScoreBreakdown): boolean {
    return score.total >= 45;
  }
}