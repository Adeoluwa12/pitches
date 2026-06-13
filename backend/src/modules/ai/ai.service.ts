import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface PitchResult {
  headline: string;
  angle: string;
  summary: string;
  whyNow: string;
  structure: string[];
  targetAudience: string;
}

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: AxiosInstance;
  private readonly primaryModel: string;
  private readonly fallbackModel: string;

  constructor(private readonly config: ConfigService) {
    this.primaryModel = config.get('OPENROUTER_MODEL', 'anthropic/claude-3-haiku');
    this.fallbackModel = config.get('OPENROUTER_FALLBACK_MODEL', 'openai/gpt-4o-mini');

    this.client = axios.create({
      baseURL: config.get('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1'),
      headers: {
        Authorization: `Bearer ${config.get('OPENROUTER_API_KEY')}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': config.get('FRONTEND_URL', 'http://localhost:5173'),
        'X-Title': 'Entertainment Pitch Assistant',
      },
      timeout: 60000,
    });
  }

  async generatePitches(
    title: string,
    description: string,
  ): Promise<PitchResult[]> {
    const prompt = this.buildPitchPrompt(title, description);
    const response = await this.completeWithRetry(prompt);
    return this.parsePitches(response);
  }

  async generateMorningBriefSummary(topics: { title: string; pitches: PitchResult[] }[]): Promise<string> {
    const topicLines = topics
      .slice(0, 5)
      .map((t, i) => `${i + 1}. ${t.title}\n   Top pitch: ${t.pitches[0]?.headline || 'N/A'}`)
      .join('\n');

    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: 'You are an entertainment editor writing a warm, motivating morning briefing for a Nigerian entertainment writer. Be concise and energetic.',
      },
      {
        role: 'user',
        content: `Write a 3-sentence morning briefing intro for a writer who covers Nigerian entertainment. Today's topics are:\n${topicLines}\n\nBe encouraging and mention 1-2 of the topics naturally.`,
      },
    ];

    return this.completeWithRetry(messages, 300);
  }

  private buildPitchPrompt(title: string, description: string): OpenRouterMessage[] {
    return [
      {
        role: 'system',
        content: `You are an experienced entertainment editor specializing in Nigerian pop culture, Nollywood, Afrobeats, and celebrity news. You generate article pitches that are timely, specific, and relevant to Nigerian entertainment websites and their audiences.`,
      },
      {
        role: 'user',
        content: `Analyze this trending entertainment topic and generate exactly 5 distinct article pitches.

Topic Title: ${title}
Topic Description: ${description}

Return ONLY valid JSON in this exact format, no markdown, no preamble:
{
  "pitches": [
    {
      "headline": "Compelling article headline",
      "angle": "Unique editorial angle for this story",
      "summary": "2-3 sentence summary of what the article covers",
      "whyNow": "Why this is urgent/relevant right now",
      "structure": ["Section 1 idea", "Section 2 idea", "Section 3 idea", "Section 4 idea"],
      "targetAudience": "Specific audience for this piece"
    }
  ]
}

Requirements:
- Make headlines punchy and clickable for Nigerian entertainment readers
- Each pitch must have a completely different angle
- Avoid generic ideas — be specific to the topic
- All pitches must be suitable for Nigerian entertainment websites`,
      },
    ];
  }

  private async completeWithRetry(
    messages: OpenRouterMessage[],
    maxTokens = 2000,
    retries = 3,
  ): Promise<string> {
    let lastError: Error;

    for (let attempt = 1; attempt <= retries; attempt++) {
      const model = attempt <= 2 ? this.primaryModel : this.fallbackModel;

      try {
        this.logger.debug(`AI request attempt ${attempt} with model: ${model}`);

        const response = await this.client.post('/chat/completions', {
          model,
          max_tokens: maxTokens,
          messages,
          temperature: 0.8,
        });

        const content = response.data?.choices?.[0]?.message?.content;
        if (!content) throw new Error('Empty response from AI');

        this.logger.debug(`AI response received (attempt ${attempt})`);
        return content;
      } catch (error) {
        lastError = error;
        const status = error?.response?.status;
        this.logger.warn(
          `AI attempt ${attempt} failed (model: ${model}, status: ${status}): ${error.message}`,
        );

        if (attempt < retries) {
          const delay = attempt === 1 ? 1000 : 3000;
          await this.sleep(delay);
        }
      }
    }

    this.logger.error(`All AI attempts failed: ${lastError?.message}`);
    throw new Error(`AI service unavailable after ${retries} attempts: ${lastError?.message}`);
  }

  private parsePitches(raw: string): PitchResult[] {
    try {
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return parsed.pitches || [];
    } catch (error) {
      this.logger.error('Failed to parse AI pitches response', error);
      return [];
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
