# problem-solver

Personal DSA learning coach — local-first, single-user. Load LeetCode problems, describe your approach, get Socratic mentor feedback, log mistakes, and grow insights over time.

## Quick start

```bash
npm install
cp .env.example .env
# Edit .env: paste GEMINI_API_KEY from https://aistudio.google.com/apikey
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Health check: [http://localhost:3000/api/health](http://localhost:3000/api/health).

## Environment

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | SQLite path (`file:./dev.db` → `prisma/dev.db`) |
| `AI_PROVIDER` | `gemini` (default), `openai`, or `anthropic` |
| `GEMINI_API_KEY` | Free key from [Google AI Studio](https://aistudio.google.com/apikey) |
| `GEMINI_MODEL` | Optional (default `gemini-2.0-flash`) |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | When you switch providers later |

Swap LLM later by setting `AI_PROVIDER=openai` (or `anthropic`) and the matching key. Mentor code calls `getLlmProvider()` — no call-site changes needed. OpenAI/Anthropic SDKs are stubs until you wire them.

## Phase status

See `docs/AGENT_BUILD_SPEC.md`. Phase 1 (scaffold + dark shell) is done. Mentor analysis is Phase 3.

## Wispr Flow (later)

Focus the **My Logic** textarea, then use your Wispr desktop hotkey. No Wispr Developer API in this MVP.
