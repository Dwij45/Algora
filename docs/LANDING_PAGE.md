# Landing page (Algora) — step log

No code dumps — flow, files, and what each piece does.

## Goal

A catchy full-bleed landing like the reference: huge **ALGORA** type, dark tech atmosphere, and a **human figure made of code** (not a big floating bubble).

---

## Step 1 — Full-bleed home shell

- **Updated:** `src/components/layout/AppShell.tsx`
  - Home `/` uses full-bleed layout (no max-width / padded main)
  - Footer hidden on landing (same as practice workspace)
- **Updated:** `src/components/layout/AppNav.tsx`
  - On `/`, nav is more transparent (lighter border) so the hero feels continuous

## Step 2 — First landing pass (orb — later replaced)

- **Created:** `src/components/home/LandingHero.tsx`
  - Massive `ALGORA` title
  - Dim scrolling code column
  - CTA block (Practice / Insights)
- **Created (temporary):** CSS iridescent orb (`.landing-orb`)
- **Updated:** `src/app/page.tsx` — renders only `LandingHero`
- **Updated:** `src/app/globals.css` — landing animations / title glow

## Step 3 — Replace bubble with code-human (current)

Reference insight: the standout figure is a **face/profile built from code**, not only a colorful orb.

- **Removed:** big `.landing-orb` bubble visual
- **Created:** `public/landing/face-mask.svg` — side-profile silhouette used as a CSS mask
- **Added:** `CodeFace` inside `LandingHero`
  - Dense mono DSA snippets
  - Clipped with `mask-image: url(/landing/face-mask.svg)` so code forms a human head
- **Added:** soft `.landing-face-glow` behind the face (subtle accent haze only — not a giant live bubble)
- **Kept:** secondary faint scrolling code column on large screens
- **Tweaked copy:** right-side `/` lines + keyboard-style chips (`^P` / `^J` / `^I`) closer to the reference layout language

## Step 4 — Motion

| Motion | Where |
|--------|--------|
| Fade-up | Title block + CTA block |
| Slow vertical scroll | Code inside the face + background column |
| Soft float | Face glow only |
| `prefers-reduced-motion` | Animations disabled |

## File map

| File | Role |
|------|------|
| `src/components/home/LandingHero.tsx` | Landing composition |
| `public/landing/face-mask.svg` | Human silhouette mask |
| `src/app/page.tsx` | Home route → hero |
| `src/app/globals.css` | Landing styles / animations |
| `src/components/layout/AppShell.tsx` | Full-bleed on `/` |
| `src/components/layout/AppNav.tsx` | Transparent nav on `/` |
| `docs/LANDING_PAGE.md` | This step log |

## Step 5 — Moving code bg on app pages (minimal front)

- **Removed:** featured/fallback cards on Practice / Journal / Insights
- **Created:** `CodeAtmosphereBg` — same faint scrolling mono columns as landing texture
- **Wired on:** Practice search, Journal, Insights — front stays minimal (title + form/content only); bg fills empty space
- Landing left as code-face hero (no full-page atmosphere change)


