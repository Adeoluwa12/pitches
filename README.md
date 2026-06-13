# 🎬 Entertainment Pitch Assistant (EPA)

A full-stack Progressive Web App that helps Nigerian entertainment writers discover daily article ideas and breaking topics. It monitors entertainment trends, generates AI-powered article pitches via OpenRouter, sends a 6:30 AM morning brief, and fires instant notifications whenever a topic goes hot.

---

## Tech Stack

### Backend
- **NestJS** + TypeScript
- **MongoDB** + Mongoose
- **OpenRouter** AI (model-swappable: Claude, GPT-4o, Gemini, DeepSeek)
- **NodeMailer** (HTML email templates)
- **@nestjs/schedule** (Cron jobs)
- **BullMQ** + Redis (ready for job queues)
- **Passport JWT** auth

### Frontend
- **React 18** + Vite + TypeScript
- **TailwindCSS** (mobile-first)
- **React Query** (data fetching + caching)
- **Zustand** (auth state)
- **vite-plugin-pwa** (installable, offline-capable)

---

## Project Structure

```
epa/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/         # JWT auth, registration, login
│   │   │   ├── users/        # User profiles & preferences
│   │   │   ├── topics/       # Topics, pitches, saved ideas
│   │   │   ├── trends/       # Trend scoring engine (0-100)
│   │   │   ├── ai/           # OpenRouter service (retry + fallback)
│   │   │   ├── notifications/ # In-app notification system
│   │   │   ├── email/        # NodeMailer HTML email service
│   │   │   ├── scheduler/    # 6:30 AM brief + 10-min hot topic monitor
│   │   │   └── collectors/   # RSS feed collectors (Pulse, BellaNaija, etc.)
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── .env.example
│   ├── Dockerfile
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx     # Home — trending + quick actions
│   │   │   ├── TrendingPage.tsx      # All topics with category filter
│   │   │   ├── TopicDetailPage.tsx   # Topic + all AI pitches
│   │   │   ├── MorningBriefPage.tsx  # Daily 6:30 AM brief
│   │   │   ├── SavedIdeasPage.tsx    # Saved pitches
│   │   │   ├── NotificationsPage.tsx # In-app alerts
│   │   │   ├── SettingsPage.tsx      # Preferences
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── components/
│   │   │   ├── Layout.tsx            # Bottom nav + header
│   │   │   └── ui.tsx                # TopicCard, PitchCard, TrendScore, etc.
│   │   ├── services/api.ts           # Axios client + all API calls
│   │   ├── stores/authStore.ts       # Zustand auth store
│   │   └── main.tsx
│   ├── public/manifest.json
│   ├── vite.config.ts                # PWA config + dev proxy
│   ├── Dockerfile
│   └── nginx.conf
│
└── docker-compose.yml
```

---

## Quick Start

### 1. Clone & configure

```bash
cd epa/backend
cp .env.example .env
# Fill in your values (see below)
```

### 2. Required `.env` values

```env
MONGODB_URI=mongodb://localhost:27017/entertainment-pitch-assistant
JWT_SECRET=your_secret_here

# OpenRouter — get key at openrouter.ai
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=anthropic/claude-3-haiku
OPENROUTER_FALLBACK_MODEL=openai/gpt-4o-mini

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Gmail (or any SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_FROM="EPA <your@gmail.com>"

FRONTEND_URL=http://localhost:5173
```

### 3. Run with Docker Compose (recommended)

```bash
cd epa
docker-compose up -d
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api

### 4. Or run locally

```bash
# Terminal 1 — Backend
cd epa/backend
npm install
npm run start:dev

# Terminal 2 — Frontend
cd epa/frontend
npm install
npm run dev
```

---

## Key Features

### AI Pitch Generation
- Sends trending topic to **OpenRouter** with a detailed Nigerian entertainment editor prompt
- Returns 5 distinct pitches: headline, angle, summary, why now, article structure, target audience
- **Retry logic**: 3 attempts, switches to fallback model on attempt 3
- Model is configurable via `OPENROUTER_MODEL` env var — swap Claude → GPT → Gemini with no code change

### Trend Scoring Engine
Every collected topic is scored 0–100 across 6 dimensions:
| Factor | Max Points | Logic |
|---|---|---|
| Freshness | 20 | Linear decay from <1hr (20) to >48hrs (2) |
| News Mentions | 25 | Based on source count/mention frequency |
| Social Growth | 30 | Engagement signal weighting |
| Source Count | 10 | More sources = higher score |
| Celebrity Relevance | 15 | Keyword match against 30+ Nigerian celebrities |
| Engagement | 10 | Drama/viral keyword signals |

Topics scoring ≥70 are marked **HOT** and trigger immediate notifications.

### Scheduler
- **6:30 AM Lagos time**: Collects fresh RSS topics → scores them → generates AI pitches → sends email brief + in-app notification to all users
- **Every 10 minutes**: Checks for new hot topics → generates pitches → sends hot topic email alert + in-app notification

### RSS Sources
Out of the box, the collector pulls from:
- Linda Ikeji Blog
- Pulse Nigeria
- Notjustok
- Nollywood Reinvented
- BellaNaija
- The NET Nigeria

Add more by editing `RSS_SOURCES` in `src/modules/collectors/rss-collector.service.ts`.

### PWA
- Installable on Android + iOS (add to home screen)
- Offline support via Workbox service worker
- Caches topics and pitches for 1–2 hours
- Mobile-first UI with safe-area insets for notched phones

---

## API Reference

```
POST /api/auth/register        { name, email, password }
POST /api/auth/login           { email, password }
GET  /api/auth/me              → current user
PATCH /api/auth/preferences    { categories[], writingStyle }

GET  /api/topics               ?page=1&category=nollywood
GET  /api/topics/trending      ?limit=10
GET  /api/topics/:id           → topic + pitches

GET  /api/pitches/today        → today's topics with pitches
POST /api/pitches/generate     ?topicId=xxx
POST /api/pitches/:id/save
GET  /api/pitches/saved

GET  /api/notifications        ?page=1
PATCH /api/notifications/:id/read
PATCH /api/notifications/read-all
```

---

## Switching AI Models

Change `OPENROUTER_MODEL` in your `.env` to any OpenRouter-supported model:

```env
# Claude
OPENROUTER_MODEL=anthropic/claude-3-haiku
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# GPT
OPENROUTER_MODEL=openai/gpt-4o-mini
OPENROUTER_MODEL=openai/gpt-4o

# Gemini
OPENROUTER_MODEL=google/gemini-flash-1.5

# DeepSeek
OPENROUTER_MODEL=deepseek/deepseek-chat
```

No code changes needed — the `AiService` reads from env at startup.

---

## Extending

**Add a new RSS source:**
Edit `RSS_SOURCES` array in `src/modules/collectors/rss-collector.service.ts`.

**Add a new category:**
Add to `TopicCategory` enum in `topic.schema.ts`, add to frontend `CATEGORIES` arrays.

**Adjust trend scoring:**
Tune weights in `src/modules/trends/trend-scoring.service.ts`.

**Change the hot topic threshold:**
In `trend-scoring.service.ts`, change `score.total >= 70` in `isHot()`.

**Change morning brief time:**
In `scheduler.service.ts`, update `@Cron('30 6 * * *', { timeZone: 'Africa/Lagos' })`.
