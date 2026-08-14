# Phase 5 — Insights (step log)

No code dumps — flow, files, functions only.

## Goal

Show **strengths / weaknesses / focus-next** from logged topic mistakes + session ranks. **No LLM** — SQLite counts only. Journal stays all-time; Insights uses the same logs.

## Unlock

- `sessionCount < 10` → empty strengths/weaknesses + “Keep practicing…” progress message
- Still return counts so the UI can show progress toward unlock

## Rules (deterministic)

| Signal | Source | Rule |
|--------|--------|------|
| Weakness | Mistake `category` + `tagsJson` topic frequencies | Topic count ≥ 3 → weakness card |
| Strength | Sessions with `compareVsOptimal.yourRank` ∈ `optimal`\|`near` × problem topics | Topic with ≥ 3 good ranks and mistake count &lt; 2 → strength |
| Focus next | Top weakness topics | Up to 3 topic slugs |

---

## Steps built

### Step 1 — Types + rules engine

- **Created:** `src/lib/insights/types.ts` — `InsightsPayload`, card shapes
- **Created:** `src/lib/insights/rules.ts`
  - `computeInsights({ sessions, mistakes })`
  - Helpers: parse tags, count maps, rank extraction

### Step 2 — API

- **Created:** `src/app/api/insights/route.ts` → `GET`
  - Loads sessions (+ problem tags) and mistakes
  - Returns `computeInsights` payload

### Step 3 — UI

- **Created:** `src/components/insights/InsightsDashboard.tsx` (client)
  - Fetches `/api/insights`
  - Empty/locked state, weakness/strength cards, focus chips, raw topic counts
- **Updated:** `src/app/insights/page.tsx` — mounts dashboard

### Step 4 — Spec

- **Updated:** `docs/AGENT_BUILD_SPEC.md` Phase 5 checked off
- **This file:** step log

## Out of scope

- AI weekly digest
- Writing rows into Prisma `Insight` table (compute live)
- Week-only filter (all-time counts; can add later)
