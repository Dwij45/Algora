# AGENT_BUILD_SPEC — Personal DSA Learning Coach


---

## 0. Workspace (mandatory)

```
D:\OneDrive\projects\problem-solver
```

- All files for this app live **only** in this directory.
- Do not scaffold in `C:\Users\gosai\.cursor\plans\` or any other folder.
- Cursor plan files under `.cursor/plans` are planning artifacts, not the app.

---

## 1. Goal

Build a **personal DSA learning coach** (single-user, local-first) that:

1. Fetches LeetCode problem text + community stats via unofficial GraphQL.
2. Lets the user submit **natural-language logic** and/or **code** (reviewed, **not** executed as a LeetCode submission).
3. Runs a **Socratic mentor** loop: questions first, then complexity, missed observations, alternate approaches, compare-vs-optimal.
4. Logs a **Mistake Journal** with fixed categories.
5. Surfaces **Strengths / Weaknesses** after enough sessions.
6. Supports **voice ideas** via Wispr Flow desktop dictation into text fields (no Wispr Developer API in Phase 1).
7. Ships a **modern dark clean** UI.

### Non-goals (Phase 1 / MVP)

- No Express server (Next.js Route Handlers only).
- No LeetCode judge / claiming AI “runtime ms” equals judge time.
- No Wispr Flow Developer API / in-app streaming mic (desktop dictation is enough).
- No TTS for mentor replies.
- No multi-user auth / accounts.
- No dumping full editorial solutions on the first mentor turn.
- No Visual DS Simulator, Algorithm Roadmap UI, or Constraint Analyzer yet (see backlog).

---

## 2. Locked stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS + CSS variables (dark theme) |
| DB | Prisma + SQLite (`prisma/dev.db`) |
| Validation | Zod |
| LeetCode | `src/lib/leetcode/*` → `POST https://leetcode.com/graphql` |
| AI | `src/lib/ai/mentor.ts` — OpenAI **or** Anthropic (server-side key) |
| Auth | None (local single-user) |
| Voice | External Wispr Flow desktop → focused textareas |

### Target folder map

```
problem-solver/
  docs/
    AGENT_BUILD_SPEC.md          ← this file
  prisma/
    schema.prisma
    migrations/                  ← after migrate
  public/
  src/
    app/
      layout.tsx
      page.tsx                   ← Home
      globals.css
      practice/
        page.tsx                 ← search / load problem
        [slug]/page.tsx          ← workspace: problem | logic | mentor
      journal/page.tsx
      insights/page.tsx
      api/
        health/route.ts
        problems/
          search/route.ts
          [slug]/route.ts
        sessions/
          route.ts
          [id]/route.ts
          [id]/continue/route.ts
        mistakes/route.ts
        insights/route.ts
    components/
      layout/
        AppNav.tsx
        AppShell.tsx
      practice/
        ProblemPanel.tsx
        LogicInput.tsx           ← dictation-friendly
        MentorPanel.tsx
        SessionContinue.tsx
      journal/
        MistakeForm.tsx
        MistakeList.tsx
      insights/
        InsightsDashboard.tsx
      ui/                        ← small primitives (Button, Panel, Badge…)
    lib/
      db.ts
      leetcode/
        client.ts
        queries.ts
        normalize.ts
        cache.ts
      ai/
        mentor.ts
        prompts.ts
        schemas.ts               ← Zod analysis schema
      insights/
        rules.ts
      utils/
        slug.ts
        htmlToText.ts
        hash.ts
  .env.example
  .env                           ← local only, never commit secrets
  package.json
  README.md                      ← how to run + Wispr tip (Phase 6)
```

---

## 3. Environment variables

Create `.env.example` (committed) and `.env` (gitignored):

```bash
# Database
DATABASE_URL="file:./dev.db"

# Mentorship LLM — provide ONE of these
OPENAI_API_KEY=
# ANTHROPIC_API_KEY=
# Optional model overrides
# OPENAI_MODEL=gpt-4o-mini
# ANTHROPIC_MODEL=claude-sonnet-4-20250514

# Optional: personal LeetCode stats (not required for public problem fetch)
LEETCODE_SESSION=
LEETCODE_CSRF=

# Cache
PROBLEM_CACHE_TTL_HOURS=24
```

Prisma note: with `schema.prisma` at `prisma/schema.prisma`, SQLite file resolves relative to `prisma/` → `prisma/dev.db` when `DATABASE_URL="file:./dev.db"`.

---

## 4. Prisma schema (exact)

Use this schema (adjust only if Prisma version requires minor syntax fixes):

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Problem {
  id           String    @id @default(cuid())
  slug         String    @unique
  frontendId   String?
  title        String
  difficulty   String
  contentHtml  String?
  contentText  String
  tagsJson     String    @default("[]")
  statsJson    String    @default("{}")
  acRate       Float?
  similarJson  String    @default("[]")
  cachedAt     DateTime  @default(now())
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  sessions     Session[]
}

model Session {
  id               String    @id @default(cuid())
  problemSlug      String
  problem          Problem   @relation(fields: [problemSlug], references: [slug])
  userLogic        String
  userCode         String?
  selfComplexity   String?
  analysisJson     String    @default("{}")
  messagesJson     String    @default("[]")
  inputHash        String?
  status           String    @default("analyzed")
  revealAlternates Boolean   @default(false)
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  mistakes         Mistake[]

  @@index([problemSlug])
  @@index([createdAt])
}

model Mistake {
  id         String   @id @default(cuid())
  sessionId  String
  session    Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  category   String
  note       String?
  tagsJson   String   @default("[]")
  createdAt  DateTime @default(now())

  @@index([category])
  @@index([createdAt])
}

model Insight {
  id          String   @id @default(cuid())
  type        String
  title       String
  detail      String
  evidenceJson String  @default("{}")
  updatedAt   DateTime @updatedAt
  createdAt   DateTime @default(now())

  @@index([type])
}
```

### Mistake categories (enum in app code, stored as string)

```
missed_hashmap
overused_sorting
recursion_fear
wrong_complexity
edge_case
wrong_ds
brute_force_stuck
misread_constraints
other
```

### Insight `type` values

```
strength
weakness
focus
```

SQLite stores JSON as strings (`*Json` fields). Always `JSON.parse` / `JSON.stringify` at the boundary.

---

## 5. Architecture

```
Browser (dark UI)
    → Next.js Server Components / Client Components
    → Route Handlers under /api/*
         → lib/leetcode (GraphQL + cache)
         → lib/ai/mentor (LLM + Zod)
         → Prisma → SQLite
```

### Voice / Wispr Flow

- User focuses **My Logic** (or continue reply) textarea.
- Wispr Flow desktop injects transcribed text (user already logged into Wispr app).
- No Wispr API keys in this MVP.
- UI placeholder: `Dictate with Wispr Flow or type your approach…`
- README tip: focus the field, then use Wispr hotkey.

Wispr **Developer** API (in-app mic) is backlog only.

---

## 6. API contract

| Method | Path | Body / query | Response |
|--------|------|--------------|----------|
| GET | `/api/health` | — | `{ ok: true }` |
| GET | `/api/problems/search?q=` | `q` string | `{ questions: [...] }` |
| GET | `/api/problems/[slug]` | — | `{ problem }` (fetch+cache) |
| POST | `/api/sessions` | `{ problemSlug, userLogic, userCode?, selfComplexity? }` | `{ session }` |
| GET | `/api/sessions` | optional `limit` | `{ sessions: [...] }` |
| GET | `/api/sessions/[id]` | — | `{ session }` |
| POST | `/api/sessions/[id]/continue` | `{ message, revealAlternates? }` | `{ session }` |
| POST | `/api/mistakes` | `{ sessionId, category, note?, tags? }` | `{ mistake }` |
| GET | `/api/mistakes` | `category?`, `limit?` | `{ mistakes: [...] }` |
| GET | `/api/insights` | — | `{ strengths, weaknesses, focusNext, sessionCount }` |

All errors: `{ error: string }` with appropriate HTTP status.

---

## 7. Mentor analysis schema (Zod)

Implement in `src/lib/ai/schemas.ts`. LLM must return JSON matching:

```ts
import { z } from "zod";

export const AlternateApproachSchema = z.object({
  name: z.string(),
  idea: z.string(),
  time: z.string(),
  space: z.string(),
  whenToUse: z.string(),
});

export const MentorAnalysisSchema = z.object({
  socraticQuestions: z.array(z.string()).min(2).max(6),
  understoodApproach: z.string(),
  estimatedComplexity: z.object({
    time: z.string(),
    space: z.string(),
    rationale: z.string(),
  }),
  strengths: z.array(z.string()),
  missedObservations: z.array(z.string()),
  alternateApproaches: z.array(AlternateApproachSchema),
  compareVsOptimal: z.object({
    yourRank: z.enum(["optimal", "near", "suboptimal"]),
    gap: z.string(),
    whyFaster: z.string(),
  }),
  wrongDirection: z.string().optional().nullable(),
  relatedConcepts: z.array(z.string()),
  hintLevel1: z.string(),
  suggestedMistakeTags: z.array(z.string()),
});

export type MentorAnalysis = z.infer<typeof MentorAnalysisSchema>;
```

### System prompt rules (`src/lib/ai/prompts.ts`)

- You are a Socratic DSA mentor for one learner.
- Never run or pretend to run code on a judge.
- First response: prioritize **questions** and understanding; do **not** paste a full solution.
- Estimate Big-O from the user’s described approach / code structure.
- Propose **alternate** approaches with complexities; explain when each wins.
- Compare vs a typical optimal approach; explain **why** faster approaches win (algorithms/data structures), not fake milliseconds.
- Suggest mistake tags only from the fixed category list when relevant.
- Return **only** valid JSON matching the schema (no markdown fences).

### Continue-turn behavior

`POST .../continue` appends user message to `messagesJson`, asks LLM for either:

- deeper Socratic guidance, or
- if `revealAlternates: true`, expand alternates / compare / why-faster clearly.

Keep conversation history bounded (e.g. last 12 messages) to control tokens.

### Caching mentor calls

Optional: `inputHash = sha256(problemSlug + userLogic + userCode)`. If identical hash exists on a recent Session, reuse `analysisJson` instead of calling the LLM again.

---

## 8. LeetCode client

### Endpoint

`POST https://leetcode.com/graphql`

Headers:

```
Content-Type: application/json
Referer: https://leetcode.com
Cookie: (optional) LEETCODE_SESSION=...; csrftoken=...
x-csrf-token: (optional) LEETCODE_CSRF
```

### Queries to implement

1. **Problem by slug** — `question(titleSlug:)`  
   Fields: `questionId`, `questionFrontendId`, `title`, `titleSlug`, `content`, `difficulty`, `topicTags { name slug }`, `stats`, `acRate` if available, `similarQuestions`, `sampleTestCase`, `hints` (store hints for later; do not show as spoilers by default).

2. **Search / list** — `problemsetQuestionList` / `questionList` with filters or keyword as supported.  
   Normalize to `{ frontendId, title, titleSlug, difficulty, acRate, topicTags }`.

### Cache rules (`lib/leetcode/cache.ts`)

- On `GET /api/problems/[slug]`: if `Problem.cachedAt` newer than TTL → return DB row.
- Else fetch GraphQL → strip HTML to `contentText` → upsert Problem → return.
- If GraphQL fails and stale cache exists → return stale + warning flag.
- If GraphQL fails and no cache → `502` with clear error.

**Isolate** all GraphQL in `src/lib/leetcode/`. UI never calls LeetCode directly.

Rate-limit: simple in-memory spacing (e.g. min 300ms between outbound GraphQL calls) to avoid bursts.

---

## 9. Dark UI tokens

Modern dark, clean — **avoid** purple-glow “AI default”, warm cream newspaper looks, and emoji clutter.

Suggested CSS variables in `globals.css`:

```css
:root {
  --bg0: #0b0d10;
  --bg1: #12151a;
  --bg2: #1a1f27;
  --border: #2a313c;
  --text: #e8edf4;
  --muted: #9aa6b2;
  --accent: #3dd6c6;      /* teal CTA only */
  --accent-dim: #2a9d8f;
  --danger: #f07178;
  --warning: #e6b450;
  --ok: #7fd99a;
  --radius: 10px;
  --font-sans: "DM Sans", "Segoe UI", sans-serif;
  --font-mono: "JetBrains Mono", "Consolas", monospace;
}
```

- Background: subtle cool gradient using `--bg0` → `--bg1`, optional faint noise.
- Panels: `--bg2`, 1px `--border`, `--radius`.
- Fonts: load DM Sans + JetBrains Mono (or equivalent distinctive pair — not Inter/Roboto as sole stack).
- Motion: soft fade-in for mentor panel; expand/collapse for alternates (2–3 intentional motions max).

### Practice workspace layout

Desktop (3 columns or 2+drawer):

1. **Problem** — title, difficulty badge, AC rate, tags, statement.
2. **My Logic** — large textarea (dictation-friendly) + optional code editor textarea + self complexity + Analyze CTA.
3. **Mentor** — questions first; strengths; complexity; missed observations; collapsed “Alternates / Compare” until reveal.

Mobile: stack Problem → Logic → Mentor.

Nav: **Home | Practice | Journal | Insights**.

---

## 10. Feature execution logic (what to implement)

### A. Fetch problem + stats

User pastes URL (`https://leetcode.com/problems/two-sum/`) or slug → normalize to slug → `GET /api/problems/[slug]` → render panel.

### B. Mentor session

1. User fills logic (± code).
2. `POST /api/sessions` → ensure Problem cached → LLM → Zod parse → save Session.
3. Mentor UI shows Socratic layer first.
4. User can reply via continue; optionally reveal alternates.
5. Offer “Log mistake” from `suggestedMistakeTags`.

### C. Mistake journal

- Create from analysis or Journal page.
- List + filter by category.
- Click row → open related session / practice slug.

### D. Insights

`GET /api/insights`:

1. Count mistakes by category; session ranks (`compareVsOptimal.yourRank`); tag frequency from problems.
2. Deterministic rules in `lib/insights/rules.ts`, examples:
   - ≥5 `overused_sorting` → weakness “Relying on sorting when linear solutions exist”
   - ≥5 `missed_hashmap` → weakness “Missing HashMap opportunities”
   - High `optimal`/`near` rate on tag `hash-table` → strength
3. `focusNext`: up to 3 topic tags tied to weaknesses.
4. If `sessionCount < 10`, return empty strengths/weaknesses with message: “Keep practicing — insights unlock after ~10 sessions.”

---

## 11. Build phases (execute in order)

Check off as you go. **Finish acceptance criteria before starting the next phase.**

### Phase 0 — Spec present

- [x] `docs/AGENT_BUILD_SPEC.md` exists at repo root `docs/` (this file)

**Accept:** File is readable in `D:\OneDrive\projects\problem-solver\docs\AGENT_BUILD_SPEC.md`.

---

### Phase 1 — Scaffold + dark shell

- [ ] `create-next-app` in workspace root (TypeScript, App Router, Tailwind, ESLint, `src/`)
- [ ] Install: `prisma`, `@prisma/client`, `zod`, and chosen AI SDK (`openai` and/or `@anthropic-ai/sdk`)
- [ ] Add `prisma/schema.prisma` (section 4) + run migrate
- [ ] `src/lib/db.ts` singleton Prisma client
- [ ] `.env.example` + local `.env` with `DATABASE_URL`
- [ ] `GET /api/health`
- [ ] `globals.css` dark tokens + font imports
- [ ] `AppShell` + `AppNav` (Home, Practice, Journal, Insights)
- [ ] Placeholder pages for Practice / Journal / Insights
- [ ] Home page: short product pitch + CTA to Practice

**Accept:**

- `npm run dev` starts without error.
- Dark shell visible; nav works.
- `/api/health` returns `{ ok: true }`.
- DB file created after migrate.

---

### Phase 2 — LeetCode problems

- [ ] `src/lib/leetcode/queries.ts`, `client.ts`, `normalize.ts`, `cache.ts`
- [ ] `GET /api/problems/[slug]`
- [ ] `GET /api/problems/search?q=`
- [ ] Practice page: search + open slug
- [ ] Practice `[slug]` page shows statement + difficulty + tags + AC rate
- [ ] Graceful error UI if fetch fails

**Accept:**

- Loading `two-sum` shows real problem content (network permitting).
- Second load within TTL does not require GraphQL (served from SQLite).
- Search returns a usable list.

---

### Phase 3 — Mentor sessions + analysis UI

- [ ] Zod schema + prompts + `mentor.ts`
- [ ] `POST/GET /api/sessions`, `GET/POST .../[id]`, `POST .../continue`
- [ ] LogicInput (large, Wispr-friendly placeholder)
- [ ] MentorPanel: questions, complexity, strengths, missed observations
- [ ] Alternates / compare **collapsed** until continue with reveal
- [ ] Persist sessions; reopen by id from history (basic list on Practice or Home)

**Accept:**

- With a valid LLM API key, analyzing logic for Two Sum returns structured mentor JSON and renders in UI.
- First view does not dump a full coded solution.
- Continue turn updates the session.

---

### Phase 4 — Mistake journal

- [ ] `POST/GET /api/mistakes`
- [ ] “Log mistake” from mentor suggested tags (user confirms)
- [ ] Journal page: list + category filter
- [ ] Link back to session / problem

**Accept:**

- Creating a mistake shows it on Journal.
- Filter by category works.

---

### Phase 5 — Insights

- [ ] `lib/insights/rules.ts`
- [ ] `GET /api/insights`
- [ ] Insights dashboard UI + empty state (&lt; 10 sessions)

**Accept:**

- With few sessions: clear empty state.
- With seeded/fake enough mistakes: at least one weakness/strength card from rules.

---

### Phase 6 — Polish

- [ ] Loading / empty / error states everywhere critical
- [ ] LeetCode rate-limit helper
- [ ] Optional analysis `inputHash` cache
- [ ] `README.md`: setup, env vars, Wispr Flow tip, non-goals
- [ ] Light prompt tuning if outputs are too spoilery

**Accept:**

- Fresh clone path: install → env → migrate → dev works.
- README accurate.

---

## 12. Day-to-day user workflow (product)

1. Open **Practice** → load LeetCode problem.
2. Focus **My Logic** → dictate with Wispr or type; optional code paste.
3. **Analyze** → read Socratic questions; answer via continue.
4. Reveal alternates / compare when ready.
5. Log mistakes.
6. Check **Insights** after many problems.

---

## 13. Later backlog (do not build until asked)

| Item | Notes |
|------|--------|
| Constraint Analyzer | Pre-code pass: infer target complexity from constraints |
| Algorithm Tree / Pattern Recognition | Visual/structured pattern hints |
| Edge Case Finder / Dry Run Generator | Still no LeetCode judge |
| Visual DS Simulator / Code Evolution | Frontend canvas |
| Algorithm roadmap | Topic graph linked to weakness tags |
| Wispr Developer API mic | Needs platform API access |
| Mentor TTS | Browser speechSynthesis or OpenAI TTS |
| Personal submission sync | Auth GraphQL + charts |

---

## 14. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| LeetCode GraphQL breaks / rate-limits | Isolate client; 24h cache; stale fallback; clear errors |
| LeetCode ToS / unofficial API | Personal learning tool; no redistribution of scraped editorials at scale |
| LLM cost | Tight prompts; optional inputHash cache; smaller model default |
| Spoiler-heavy mentor | Prompt rules + UI collapse of alternates |
| Wispr confusion | README + placeholder: desktop dictation, not Developer API |

---

## 15. Agent operating rules

1. Work only in `D:\OneDrive\projects\problem-solver`.
2. Follow phases 1 → 6 in order after this spec exists.
3. Prefer small, complete vertical slices that meet acceptance criteria.
4. Do not add Express, auth systems, or Wispr API unless the user asks.
5. Do not commit secrets (`.env`).
6. After each phase, summarize what was done and what remains.
7. If LeetCode or LLM is unreachable during build, still ship code paths + mockable errors; document required keys.

---

## 16. Phase status tracker

| Phase | Status |
|-------|--------|
| 0 Spec | **Done** |
| 1 Scaffold + dark shell | Pending |
| 2 LeetCode | Pending |
| 3 Mentor sessions | Pending |
| 4 Mistake journal | Pending |
| 5 Insights | Pending |
| 6 Polish | Pending |

When implementing, update this table as phases complete.
