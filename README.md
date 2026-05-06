# The Boat House Ibiza

Cinematic, scroll-driven rebuild of theboathouseibiza.com. See `modelo/CLAUDE.md` for the full
project spec — the descenso narrative, the seven acts, brand tokens, performance budgets.

## Stack (current step)

- Next.js 15 (App Router, RSC) · React 19 · TypeScript strict
- Tailwind CSS v4 (CSS-first via `@theme` in `styles/globals.css` — no `tailwind.config.ts`)
- next-intl v4 with locales `en, es, de, fr, nl, it`
- Sanity Studio v5 embedded at `/studio` via next-sanity v11
- Lenis smooth scroll wired to `gsap.ticker` + `ScrollTrigger.update`
- Biome 2 (lint + format)
- Asset pipeline isolated under `tools/` (sharp, gltf-transform, puppeteer QA)

## Setup

```bash
npm install
npm run dev                # http://localhost:3000 → redirects to /en
```

### Sanity project (one-time, interactive)

`.env.local` ships with `NEXT_PUBLIC_SANITY_PROJECT_ID=placeholder`. The Studio at `/studio`
will render its chrome but cannot finish bootstrapping until a real project exists. Run:

```bash
npx sanity@latest login
npx sanity@latest init --create-project "The Boat House Ibiza" --dataset production
# copy the new projectId into .env.local → NEXT_PUBLIC_SANITY_PROJECT_ID
```

Schemas already compile cleanly without a real project — verify with
`npx sanity schema extract --workspace boathouse --enforce-required-fields`.

## Routes (step 2 scaffold)

| Path | Notes |
|---|---|
| `/{en,es,de,fr,nl,it}` | Home placeholder + ScrollTrigger probe |
| `/{locale}/menu` | Placeholder |
| `/{locale}/about` | Placeholder |
| `/{locale}/gallery` | Placeholder |
| `/{locale}/contact` | Placeholder |
| `/studio` | Embedded Sanity Studio with all CLAUDE.md schemas |

## GSAP Club plugins — pending license

The public `gsap` package is installed. The following Club-tier plugins (Shockingly Green) are
**not yet available**; they will be wired in once the license token is configured. CLAUDE.md
features that require them are marked here so we don't ship placeholders.

| Plugin | CLAUDE.md feature | Step | Status |
|---|---|---|---|
| **DrawSVG** | Preloader gold-line progress · Boeing trail · gold dividers | 3, 4, 8 | TODO — fallback to scaleX |
| **MorphSVG** | Wave SVG morph in Act 6 (catering) | 8 | TODO — fallback to static SVGs |
| **SplitText** | Typesetting on display headings (per-letter reveals) | 6, 8 | TODO — fallback to whole-word fade |
| **ScrollSmoother** | Native momentum on top of Lenis (optional) | 2+ | Not blocking — Lenis covers smooth scroll |
| ScrollTrigger | All scroll choreography (free, already in repo) | 4–9 | ✅ Wired |
| Observer | Pin-release detection in Act 1 (free in GSAP 3.12+) | 4 | ✅ Available |
| Flip | Layout transitions (free) | 5 | ✅ Available |

To enable Club after token arrives:

```bash
echo "@gsap:registry=https://npm.greensock.com" >> .npmrc
echo "//npm.greensock.com/:_authToken=${GSAP_TOKEN}" >> .npmrc
npm i gsap@npm:@gsap/shockingly
```

Then drop the `// TODO Club` comments and import each plugin.

## Pipeline

Asset preprocessing lives in `tools/` — see `tools/README.md`. Run from there:

```bash
cd tools && npm install
npm run all          # process-images + compress-glb
npm run qa           # boeing + tortuga visual QA
```

Outputs go to `public/models/*.final.glb` and `public/images/*.{avif,webp}`.

## Conventions

- Path alias `@/*` resolves to repo root.
- Brand colors live in `@theme` only — never inline hex values; use `bg-ivory`, `text-sea`, etc.
- Anything that imports `@react-three/fiber` (step 3+) goes inside a Client Component loaded
  via `next/dynamic({ ssr: false })`.
- Server Components for layout/data; Client Components for animation, scroll, 3D, and
  interactive UI.
