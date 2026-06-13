import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface MorningBriefData {
  recipientName: string;
  recipientEmail: string;
  intro: string;
  topics: {
    title: string;
    category: string;
    trendScore: number;
    topPitch: string;
    pitchAngle: string;
  }[];
  date: string;
}

export interface HotTopicData {
  recipientName: string;
  recipientEmail: string;
  topicTitle: string;
  topicDescription: string;
  trendScore: number;
  pitches: { headline: string; angle: string }[];
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get('MAIL_HOST', 'smtp.gmail.com'),
      port: parseInt(config.get('MAIL_PORT', '587')),
      secure: config.get('MAIL_SECURE', 'false') === 'true',
      auth: {
        user: config.get('MAIL_USER'),
        pass: config.get('MAIL_PASSWORD'),
      },
    });
  }

  async sendMorningBrief(data: MorningBriefData): Promise<void> {
    const html = this.buildMorningBriefHtml(data);
    await this.sendWithRetry({
      to: data.recipientEmail,
      subject: `🎬 Your Daily Entertainment Pitches — ${data.date}`,
      html,
    });
  }

  async sendHotTopicAlert(data: HotTopicData): Promise<void> {
    const html = this.buildHotTopicHtml(data);
    await this.sendWithRetry({
      to: data.recipientEmail,
      subject: `🔥 Breaking Entertainment Trend: ${data.topicTitle.slice(0, 60)}`,
      html,
    });
  }

  private async sendWithRetry(
    options: { to: string; subject: string; html: string },
    retries = 3,
  ): Promise<void> {
    let lastError: Error;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.transporter.sendMail({
          from: this.config.get('MAIL_FROM', '"Entertainment Pitch Assistant" <noreply@epa.app>'),
          ...options,
        });
        this.logger.log(`Email sent to ${options.to} (attempt ${attempt})`);
        return;
      } catch (error) {
        lastError = error;
        this.logger.warn(`Email attempt ${attempt} failed: ${error.message}`);
        if (attempt < retries) await this.sleep(2000 * attempt);
      }
    }

    this.logger.error(`Email failed after ${retries} attempts: ${lastError?.message}`);
    throw lastError;
  }

  private buildMorningBriefHtml(data: MorningBriefData): string {
    const topicsHtml = data.topics
      .map(
        (t, i) => `
        <div style="background:#fff;border-radius:12px;padding:20px;margin-bottom:16px;border-left:4px solid ${i === 0 ? '#E63946' : '#457B9D'};">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span style="background:${this.getCategoryColor(t.category)};color:#fff;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;text-transform:uppercase;">${t.category}</span>
            <span style="font-size:13px;color:#666;">🔥 Score: <strong>${t.trendScore}/100</strong></span>
          </div>
          <h3 style="margin:8px 0;color:#1D3557;font-size:16px;">${t.title}</h3>
          <div style="background:#F1FAEE;border-radius:8px;padding:12px;margin-top:10px;">
            <p style="margin:0;font-size:13px;color:#457B9D;font-weight:600;">💡 Top Pitch Idea</p>
            <p style="margin:6px 0 0;font-size:14px;color:#333;font-weight:700;">${t.topPitch}</p>
            <p style="margin:4px 0 0;font-size:13px;color:#666;font-style:italic;">${t.pitchAngle}</p>
          </div>
        </div>`,
      )
      .join('');

    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:linear-gradient(135deg,#1D3557,#457B9D);border-radius:16px;padding:30px;color:#fff;margin-bottom:20px;text-align:center;">
      <div style="font-size:40px;margin-bottom:10px;">🎬</div>
      <h1 style="margin:0;font-size:24px;">Good Morning, ${data.recipientName}! ❤️</h1>
      <p style="margin:10px 0 0;opacity:0.9;font-size:15px;">${data.date}</p>
    </div>
    
    <div style="background:#fff;border-radius:12px;padding:20px;margin-bottom:20px;border-left:4px solid #E63946;">
      <p style="margin:0;font-size:15px;color:#333;line-height:1.6;">${data.intro}</p>
    </div>

    <h2 style="color:#1D3557;font-size:18px;margin:0 0 16px;">🔥 Today's Article Opportunities (${data.topics.length})</h2>
    ${topicsHtml}

    <div style="text-align:center;margin-top:24px;padding:20px;background:#1D3557;border-radius:12px;color:#fff;">
      <p style="margin:0;font-size:14px;opacity:0.8;">Entertainment Pitch Assistant — Your personal entertainment editor</p>
      <p style="margin:8px 0 0;font-size:12px;opacity:0.6;">You're receiving this because you opted in to morning briefs.</p>
    </div>
  </div>
</body>
</html>`;
  }

  private buildHotTopicHtml(data: HotTopicData): string {
    const pitchesHtml = data.pitches
      .slice(0, 3)
      .map(
        (p, i) => `
        <div style="background:#fff;border-radius:10px;padding:16px;margin-bottom:12px;border-left:3px solid #E63946;">
          <p style="margin:0;font-size:13px;color:#E63946;font-weight:700;">Pitch ${i + 1}</p>
          <p style="margin:6px 0 4px;font-size:15px;font-weight:700;color:#1D3557;">${p.headline}</p>
          <p style="margin:0;font-size:13px;color:#666;font-style:italic;">${p.angle}</p>
        </div>`,
      )
      .join('');

    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:linear-gradient(135deg,#E63946,#c1121f);border-radius:16px;padding:30px;color:#fff;text-align:center;margin-bottom:20px;">
      <div style="font-size:48px;">🚨</div>
      <h1 style="margin:10px 0 0;font-size:22px;">HOT TOPIC ALERT</h1>
      <div style="background:rgba(255,255,255,0.2);border-radius:20px;padding:4px 16px;display:inline-block;margin-top:10px;">
        <span style="font-size:14px;">🔥 Trend Score: ${data.trendScore}/100</span>
      </div>
    </div>

    <div style="background:#fff;border-radius:12px;padding:20px;margin-bottom:20px;">
      <p style="margin:0 0 4px;font-size:12px;color:#E63946;font-weight:700;text-transform:uppercase;">Breaking Now</p>
      <h2 style="margin:0 0 12px;color:#1D3557;font-size:20px;">${data.topicTitle}</h2>
      <p style="margin:0;color:#555;font-size:14px;line-height:1.6;">${data.topicDescription}</p>
    </div>

    <h3 style="color:#1D3557;margin:0 0 12px;">💡 Suggested Article Pitches</h3>
    ${pitchesHtml}

    <div style="text-align:center;margin-top:20px;padding:16px;background:#1D3557;border-radius:12px;color:#fff;">
      <p style="margin:0;font-size:13px;opacity:0.8;">Entertainment Pitch Assistant — Write it before someone else does!</p>
    </div>
  </div>
</body>
</html>`;
  }

  private getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      nollywood: '#E63946',
      music: '#2A9D8F',
      afrobeats: '#2A9D8F',
      celebrity: '#E76F51',
      reality_tv: '#8338EC',
      internet_trends: '#3A86FF',
      pop_culture: '#FB5607',
      movie_review: '#E63946',
    };
    return colors[category] || '#457B9D';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
