# Algora

**Algora** is a personal, local-first DSA learning coach. Load real LeetCode problems, think in Notes / Code / Board, get a **Socratic mentor** (questions first), log **topic gaps**, and unlock **Insights** — without a LeetCode judge or fake runtime scores.

> Brand meaning: **Algo** (algorithm) + **ora** (place) — a space for algorithmic thinking.

---

## What you can do

| Area | Features |
|------|----------|
| **Practice** | Search / open LeetCode by slug or URL; statement + tags + difficulty |
| **Workspace** | Resizable panels: Problem \| Notes / Monaco Code / Excalidraw Board + Mentor |
| **Mentor** | Gemini (default) analyzes your approach as structured JSON (Zod); continue + reveal alternates |
| **Send board** | Optional toggle: export board PNG and send it multimodal with Analyze |
| **Topic journal** | Confirm mentor topic tags (e.g. `two_pointers`); problem tags merged on Log |
| **Insights** | Free SQLite counts — weaknesses / strengths / focus-next after ~10 sessions |
| **Landing** | Full-bleed Algora hero (code-silhouette face + CTAs) |

**Non-goals (for now):** multi-user auth, LeetCode submission judge, code runner, Wispr Developer API, AI “summarize my week” on every Journal open.

---

## Stack

| Layer | Choice |
|-------|--------|
| App | Next.js 16 (App Router) + React 19 + TypeScript |
| UI | Tailwind CSS v4, IBM Plex Sans/Mono, dark theme |
| DB | Prisma 7 + SQLite (`prisma/dev.db`) |
| Validation | Zod |
| AI | Gemini via `AI_PROVIDER` (OpenAI/Anthropic stubs) |
| Editor | Monaco |
| Board | Excalidraw (`localStorage` per problem slug) |
| Layout | `react-resizable-panels` |

---

## Quick start

```bash
npm install
cp .env.example .env
# Edit .env — set GEMINI_API_KEY from https://aistudio.google.com/apikey
npx prisma migrate dev
npm run dev
```

- App: [http://localhost:3000](http://localhost:3000)
- Health: [http://localhost:3000/api/health](http://localhost:3000/api/health)

### Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` | `prisma generate` + production build |
| `npm start` | Serve production build |
| `npm run db:migrate` | Prisma migrate |
| `npm run db:generate` | Generate Prisma client |

---

## Environment

Copy from `.env.example`. **Never commit `.env`.**

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | SQLite URL, e.g. `file:./prisma/dev.db` (cwd-relative) |
| `AI_PROVIDER` | `gemini` (default) \| `openai` \| `anthropic` |
| `GEMINI_API_KEY` | Required for mentor when using Gemini |
| `GEMINI_MODEL` | Optional (default `gemini-flash-latest`) |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | If `AI_PROVIDER=openai` (stub until wired) |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | If `AI_PROVIDER=anthropic` (stub until wired) |
| `LEETCODE_SESSION` / `LEETCODE_CSRF` | Optional personal stats |
| `PROBLEM_CACHE_TTL_HOURS` | Problem cache TTL (default 24) |

Mentor code always goes through `getLlmProvider()` — switch providers without changing call sites.

---

## App map

```
src/
  app/                  # Routes + API
    page.tsx            # Landing (Algora)
    practice/           # Search + [slug] workspace
    journal/            # Topic journal
    insights/           # Strengths / weaknesses
    api/
      health/
      problems/         # fetch + search (LeetCode GraphQL + SQLite cache)
      sessions/         # Analyze + continue (+ optional board image)
      mistakes/         # Topic journal CRUD
      insights/         # Deterministic rollups
  components/
    home/               # LandingHero
    layout/             # AppShell, AppNav
    practice/           # Workspace, Monaco, Board, Mentor…
    journal/            # Log + list
    insights/           # Dashboard
    ui/                 # Badge, CodeAtmosphereBg…
  lib/
    ai/                 # mentor, prompts, schemas, Gemini multimodal
    board/              # exportBoardPngBase64
    insights/           # rules engine
    mistakes/           # topic normalize + serialize
    leetcode/           # GraphQL client + cache
    db.ts               # Prisma + better-sqlite3
docs/                   # Spec + phase / board / landing step logs
prisma/                 # schema + migrations
```

---

## Product loop

1. **Practice** → open a problem (URL / slug / search).
2. **Notes / Code / Board** → think; optionally enable **Send board**.
3. **Analyze** → mentor returns Socratic questions, complexity, gaps, topic suggestions.
4. **Log** topic gaps you confirm (syntax-only tags are ignored).
5. **Journal** → browse all logs; filter by topic.
6. **Insights** → after enough sessions, see weak/strong topics (no extra LLM).

---

## Data (SQLite)

| Model | Role |
|-------|------|
| `Problem` | Cached LeetCode statement, tags, stats |
| `Session` | One Analyze run + messages + analysis JSON |
| `Mistake` | Logged topic (`category`) + merged `tagsJson` (mentor + problem topics) |
| `Insight` | Reserved table; current Insights API **computes live** from sessions/mistakes |

Board drawings stay in **browser `localStorage`**: `problem-solver:board:{slug}` (key kept for compatibility).

---

## Docs (step logs)

| Doc | About |
|-----|--------|
| [`docs/AGENT_BUILD_SPEC.md`](docs/AGENT_BUILD_SPEC.md) | Master build plan + phase tracker |
| [`docs/PHASE4_MISTAKE_JOURNAL.md`](docs/PHASE4_MISTAKE_JOURNAL.md) | Journal API / UI steps |
| [`docs/TOPIC_JOURNAL.md`](docs/TOPIC_JOURNAL.md) | Topic tags (not fixed behavioral enums) |
| [`docs/PHASE5_INSIGHTS.md`](docs/PHASE5_INSIGHTS.md) | Insights rules + API |
| [`docs/BOARD_BUILD_GUIDE.md`](docs/BOARD_BUILD_GUIDE.md) | Excalidraw board |
| [`docs/BOARD_AI.md`](docs/BOARD_AI.md) | Send board → Gemini vision |
| [`docs/LANDING_PAGE.md`](docs/LANDING_PAGE.md) | Landing + code atmosphere on app pages |

---

## Phase status

| Phase | Status |
|-------|--------|
| 0 Spec | Done |
| 1 Scaffold + dark shell | Done |
| 2 LeetCode | Done |
| 3 Mentor sessions | Done |
| 4 Mistake / topic journal | Done |
| 5 Insights | Done |
| 6 Polish | Pending (README polish, rate-limits, more empty/error states) |

---

## Wispr Flow

Focus **Notes** (or continue reply), then use your Wispr **desktop** hotkey. No Wispr Developer API in this MVP.

---

## Voice / design notes

- Dark-only grey family (`#0f0f0f` / `#1a1a1a`); teal accent for CTAs.
- Topic badges are colorful; mentor feedback uses cards.
- Practice / Journal / Insights use a faint scrolling mono code background; foreground stays minimal.

---

## License / use

Personal learning tool. Unofficial LeetCode GraphQL — respect their ToS; don’t redistribute scraped editorials at scale.
