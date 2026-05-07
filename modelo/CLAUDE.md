# The Boat House Ibiza — Premium rebuild

**You are building a luxury, scroll-driven website for The Boat House Ibiza, a beachfront family restaurant in Cala San Vicente, north of Ibiza. This must feel like a 90 000 € production: cinematic 3D, choreographed scroll storytelling, custom shaders. Reference the current site at https://theboathouseibiza.com — this is the "before". You are building the "after".**

The narrative is one continuous journey: the user arrives by plane in the Ibiza sky, descends through clouds, breaks the water surface, and sinks slowly to the ocean floor where the anchor finally rests. Every section of the restaurant's content is anchored to a depth in this descent.

---

## 1 — Tech stack

### Framework and core
- Next.js 15 (App Router, React Server Components), React 19, TypeScript strict mode
- Tailwind CSS v4 with custom design tokens, `cva` for component variants
- shadcn/ui as base layer, fully restyled to brand
- Biome (lint + format), Vitest, Playwright e2e, Storybook + Chromatic, Husky pre-commit

### 3D and WebGL
- Three.js with @react-three/fiber + @react-three/drei + @react-three/postprocessing
- Custom GLSL shaders for: underwater caustics, light shafts (god rays), water surface refraction, sky gradient, particle disintegration
- `meshline` for the gold animated lines
- `@react-three/rapier` only if needed for chain physics; otherwise procedural curve

### Animation and scroll
- GSAP 3 with Club GreenSock plugins: `ScrollTrigger`, `ScrollSmoother`, `DrawSVG`, `MorphSVG`, `Flip`, `SplitText`, `Observer`
- Lenis for smooth scroll (synced with ScrollTrigger via `lenis.on('scroll', ScrollTrigger.update)`)
- Motion (Framer Motion successor) for React component animations
- Lottie for micro-animations only (decorative)
- Theatre.js for choreographing the descent timeline

### Content, image, video
- Sanity.io headless CMS with custom branded studio (ivory, serif typography matching the site)
- next-intl for `en` (default), `es`, `de`, `fr`, `nl`, `it`
- Cloudinary for image CDN with on-the-fly transforms
- Mux for hero video HLS streaming if a hero video is added later
- `next/image` with AVIF/WebP, blur placeholders generated with Plaiceholder
- Sharp for build-time image preprocessing

### Reservations, email, maps
- Sevenrooms embed (preferred) or TheFork as fallback for reservations
- React Email + Resend for transactional emails (confirmation, table reminder)
- Mapbox GL JS with custom brand-styled basemap for the contact page

### Observability and deployment
- Vercel Pro hosting, Cloudflare in front (CDN + DDoS)
- Sentry, Vercel Analytics, Vercel Speed Insights, Microsoft Clarity heatmaps
- Schema.org `Restaurant`, `Menu`, `MenuItem` structured data
- next-sitemap, dynamic robots.txt, hreflang tags per locale

### Audio (optional, off by default)
- Howler.js — Mediterranean wave loop with a clean toggle in the top right

---

## 2 — Brand tokens

```ts
// tailwind.config.ts (excerpt)
colors: {
  ivory:    '#F5F0E6',  // page background, hero
  bone:     '#FBF9F4',  // surfaces
  sea:      '#1B3A4B',  // primary text, CTAs
  deep:     '#0E202C',  // headings on light, body on midnight
  sand:     '#D9C7A7',  // secondary warm
  coral:    '#C66B4E',  // accent, used sparingly
  sunset:   '#E89B6C',  // descent gradient mid-stop
  midnight: '#0A1A2E',  // ocean floor, footer
  abyss:    '#04101D',  // deepest underwater
  gold:     '#C9A86B',  // animated gold lines (matte, not shiny)
  goldDeep: '#8C6B2F',  // gold accents in dark sections
}
fontFamily: {
  display: ['"GT Super Display"', 'Recoleta', 'serif'],
  sans:    ['"General Sans"', 'Inter', 'sans-serif'],
  mono:    ['"JetBrains Mono"', 'monospace'],
}
```

Display weights 300 and 400 only, letter-spacing -0.02em, sentence case everywhere. Body 16–18 px, line-height 1.7. Two text weights total: 400 and 500. No 600/700.

---

## 3 — The descent — scroll choreography

The page is a single continuous vertical scroll divided into seven acts. The anchor with chain is a persistent 3D element on the left side of the viewport that descends with the user. Each act has a banner of restaurant content that "hangs" from the chain. As the user scrolls, the banner descends with the anchor; when the previous banner reaches the top of the viewport it disintegrates into golden particles that drift up and dissolve.

### Background environment, driven by `scrollProgress` (0 → 1)
- 0.00–0.20 sky cobalt blue with high cirrus clouds, sun visible
- 0.20–0.40 descent: clouds clear, sky deepens, horizon rises
- 0.40–0.42 the surface — `agua.glb` water plane, tilted ~20° in y rotation, dominates the frame; the camera passes through it. Caustics and god-ray shaders activate
- 0.42–0.65 shallow underwater, light from above, turquoise tint
- 0.65–0.85 deeper water, cooler blues, fewer light shafts, particles slow down
- 0.85–1.00 abyssal floor: `infralitoral.glb` becomes the bottom, corals and algae cluster, anchor lands

### Camera path
A single Theatre.js sequence drives the camera y-position from `+200` (sky) to `-180` (floor) with the GLB models placed at fixed world y-coordinates. The user scrolls; the camera descends. Background environment color and fog are interpolated from `scrollProgress`.

### Act 1 — Arrival in the sky (uses `boeing/`)
- Hero banner with wordmark "The Boat House" in display serif, 12vw, weight 300
- Subtitle: "A family table by the sea — Cala San Vicente, since 2016"
- Single CTA "Reserve a table"
- The Boeing 747 model from `modelo/boeing/` flies left to right across the viewport, in front of the wordmark (z-index above banner text)
- **Scroll lock**: the section is pinned. The user's scroll input drives the plane horizontally from `x: -200` (off-screen left) to `x: +viewportWidth + 200` (off-screen right). Vertical page scroll is suspended during this. Only when the plane has fully exited the right side does the pin release and the descent begin. Use ScrollTrigger `pin: true` with `scrub: 1` and `end: "+=1500"`. Show a subtle hint "Scroll" with a chevron during the pin.
- Tiny gold line draws a horizontal trail behind the plane via DrawSVG
- Sound: distant jet rumble fades in/out (off by default)

### Transition 1 — Boeing exits, anchor begins descent
- Anchor + chain enter from the top of the viewport in 3D space
- Banner Act 1 disintegrates: a custom shader breaks the banner DOM into golden particles that float upward, fade, and dissolve. Use a frame capture of the banner via `html2canvas` once at scroll-trigger time, displace pixels on a Three.js plane with a vertex shader driven by uv + time + noise, then opacity-fade to zero. Particles drift up at slight randomized angles.

### Act 2 — Heritage (sky descent)
- Big number "40" assembles digit by digit (years since the family started restaurants in Ibiza)
- Mini timeline: 1985 Figueretes → 2005 On the Beach → 2016 The Boat House
- Family quote in display serif: *"To share your food and spend time with your loved ones while enjoying the beach and sea views — that's our idea of paradise." — Zandwijk Family*
- Background: clouds parting, sea visible far below, slight parallax

### Act 3 — The hidden cove (transition through clouds)
- Custom SVG of Ibiza coastline, vectorized from OpenStreetMap, traces itself with stroke-dashoffset
- Pulsing gold pin at Cala San Vicente (lat 39.0750, lng 1.4750)
- Tagline: "Hidden where the road runs out and the sea begins"
- Background continues descending toward the water surface

### Act 4 — Breaking the surface (uses `agua.glb`)
- The `agua.glb` plane is positioned across the camera path, tilted ~20° on the y axis
- A water-refraction shader is applied to its material: subtle ripple normal map, screen-space refraction of what's above (sky/sun), foam at edges
- The camera passes through the plane; the moment of crossing triggers a screen-wide flash of caustics and a brief audio cue (off by default)
- Below the plane, environment fog tints turquoise, post-processing adds chromatic aberration briefly, then settles
- Banner: "Welcome below the surface — our menu, our kitchen, our home"

### Act 5 — The kitchen and menu (uses `tortuga.glb`, shallow underwater)
- The turtle GLB animates in from the right, swimming across the screen, in front of the menu content (z above text). Its existing `mixer.clipAction` plays the swimming animation. Its world position scrubs with scroll: starts at `x: viewportWidth + 4`, ends at `x: -8`
- 5–6 signature dishes pinned in horizontal scroll: Paella Melosa, 50-day Friesian Tomahawk, Wagyu Boat House Burger, Thai Fish & Seafood Curry, Lamb Shoulder, Vegan Yellow Curry. Each on a circular plate, slow rotation, slight 15° perspective tilt
- Sourcing map: SVG of the Mediterranean draws origin lines one by one — Galicia (beef), Cala San Vicente (catch of the day), their own zero-km farm in Cala San Vicente (vegetables, opened 2025, highlight in gold), Italy (buffalo mozzarella), Lebanon (mezze influence)
- Caustics shader from `agua.glb` projects subtly onto the dishes
- Light shafts (god rays) descend from the top with `EffectComposer` + custom volumetric pass, intensity scrubs with depth

### Act 6 — Catering and dinghy service (mid water)
- A 2D illustrated dinghy SVG sails left to right, position bound to scroll
- Two columns: "Reserve a table at the beach" and "Anchor your boat — we deliver to the cove"
- Wave SVG morphs underneath
- Bubbles from `burbujas.glb` start appearing here, rising upward with their built-in animation
- `algas.glb` and `coral.glb` clusters anchor at the bottom of the viewport, in the background (behind text)

### Act 7 — Ocean floor (uses `infralitoral.glb`, `coral_azul.glb`, `coral.glb`, `algas.glb`, `burbujas.glb`, `ancla.glb`, `cadenaparaelancla.glb`)
- `infralitoral.glb` is the floor that fills the bottom 60 vh of the final viewport
- `coral_azul.glb`, `coral.glb`, `algas.glb` instances scattered across the floor (use InstancedMesh for performance)
- `burbujas.glb` ambient bubbles continuously rise (loop their existing animation)
- The anchor + chain that has accompanied the user descends one final time and "lands" on the floor with a soft particle puff (single Theatre.js cue)
- Three guest reviews fade in/out one at a time, large display serif, editorial style — pull from the live site
- Reservation widget (Sevenrooms placeholder), opening hours, Mapbox map of Cala San Vicente
- Footer: deep abyss color. Pulsing gold dots connect themselves to draw the silhouette of an anchor when the user reaches the very bottom. Contact info, six language flags, working IG/FB links, copyright with `{new Date().getFullYear()}`

---

## 4 — The persistent anchor and chain

A single Three.js scene mounted via `<Canvas>` in a fixed-position layer wraps the entire page (`pointer-events: none` on the canvas root). The anchor + chain live in this scene.

- `ancla.glb` positioned in world space; its y-coordinate is bound to `scrollProgress`, descending from `+8` to `-12` (rest position on the floor)
- `cadenaparaelancla.glb` is the chain. If it is a single static mesh, instance it along the y-axis with subtle `sin(time + index) * 0.05` lateral sway. If it is rigged, drive its bones via Theatre.js
- Both anchor and chain receive lighting from the active environment (sky vs underwater) — use `<Environment>` with a swap on scroll progress
- The anchor sits in front of background elements (corals, water plane, infralitoral) but BEHIND the foreground banner text, except in Act 1 where the Boeing crosses in front of everything
- A subtle gold line traces from the top of the anchor up to the top of the viewport, drawn via meshline, providing a continuous visual link between user and anchor

---

## 5 — The disintegration transition between banners

This is the signature transition. Implementation strategy:

**Approach: shader-based pixel scatter**

1. When a banner is about to leave the viewport's top edge (ScrollTrigger callback at `start: "top top-=20%"`), capture the banner's current rendered state into an offscreen canvas using `html2canvas` (pre-rendered once on mount, cached)
2. Replace the banner DOM with a Three.js `<Canvas>` containing a single `PlaneGeometry` whose vertices are subdivided heavily (256×256 segments)
3. Apply a custom shader that:
   - samples the captured texture
   - displaces each vertex by `noise(uv * 8 + time)` × `progress`
   - scales each fragment's color toward the gold tone (`#C9A86B`) as `progress` increases
   - fades opacity per fragment based on `progress + noise(uv)`
   - drifts vertices upward (negative y) with mild horizontal jitter
4. `progress` animates from 0 → 1 over 1.2 s as the banner leaves
5. Once `progress === 1`, unmount the canvas

The result: the banner reads cleanly while in viewport, and as it exits the top, it dissolves into a swirl of gold particles that drift upward and vanish — like sea spray catching the sun.

Reduced-motion fallback: simple opacity fade + 12 px upward translate.

---

## 6 — 3D assets — file inventory and integration

All models live in `/public/models/` (copy from `D:\PROYECTO\ibizarestaurante\modelo\` into `public/models/`).

| File | Size | Use | Where in scene | Z layer |
|---|---|---|---|---|
| `boeing/` (extract zip) | ~3 MB | 747 in Act 1 | Sky, full viewport crossing L→R | **Above** banner text |
| `agua.glb` | 22 MB | Water surface | Tilted 20°, between sky and underwater | Mid (camera passes through) |
| `tortuga.glb` | 3.6 MB | Animated turtle in Act 5 | Crosses viewport R→L | **Above** menu text |
| `ancla.glb` | 3.3 MB | Persistent anchor descending | Left side, full descent | Above background, below banner foreground |
| `cadenaparaelancla.glb` | 137 KB | Chain attached to anchor | Above anchor | Same as anchor |
| `coral.glb` | 236 KB | Coral cluster, ocean floor | Background floor | **Behind** text |
| `coral_azul.glb` | 280 KB | Blue coral, ocean floor | Background floor | **Behind** text |
| `algas.glb` | 1 MB | Seaweed, ocean floor | Background floor, swaying | **Behind** text |
| `burbujas.glb` | (unspecified) | Animated rising bubbles | Mid-water onward, ambient | **Behind** text |
| `infralitoral.glb` | 86 MB ⚠️ | Ocean floor terrain | Final act floor | **Behind** everything |

### Boeing folder

The folder contains `atlas-air-boeing-747-100-n3203y.zip`, `source/`, and `textures/`. Run on first setup:

```bash
cd public/models/boeing
unzip -o atlas-air-boeing-747-100-n3203y.zip
# Find the .gltf or .glb inside source/. If it is .obj/.fbx, convert:
# npx gltf-pipeline -i source/boeing.obj -o boeing.glb
ls -la
```

If only OBJ/FBX is present, convert to glTF using `obj2gltf` or `FBX2glTF` and export to `public/models/boeing/boeing.glb`. Reference that file in the loader.

### Mandatory preprocessing — `infralitoral.glb` is too heavy at 86 MB

86 MB will not ship to a browser. Run a one-time compression pass with `gltf-transform`:

```bash
npm i -D @gltf-transform/cli
npx gltf-transform optimize public/models/infralitoral.glb public/models/infralitoral.opt.glb \
  --texture-compress webp \
  --texture-size 2048 \
  --simplify 0.5 \
  --weld

# Then DRACO compress the geometry
npx gltf-transform draco public/models/infralitoral.opt.glb public/models/infralitoral.final.glb
```

Target output: under 8 MB. Apply the same pipeline to `agua.glb` (22 MB → target 4 MB) and `tortuga.glb` (3.6 MB → target ~1 MB). Smaller models can pass through `--texture-size 1024` only.

In React, load with `useGLTF` from drei; enable DRACO loader globally:

```tsx
import { useGLTF } from '@react-three/drei'
useGLTF.preload('/models/infralitoral.final.glb')
```

---

## 7 — Preloader

Because the total payload is large even after compression (~20–25 MB of GLB + textures), a proper preloader is non-negotiable.

- Full-screen ivory background with the brand wordmark in display serif 8vw, weight 300
- A horizontal gold line draws itself left to right via DrawSVG, bound to the actual asset load progress
- Below the line: a small percentage indicator in mono font, 12 px, ivory-on-ivory at low opacity
- A subtle anchor SVG icon settles into place when load hits 100 %
- The preloader exits with a vertical wipe revealing the sky below (the user is "boarding")

Use `useProgress` from `@react-three/drei` for 3D asset progress, plus a custom hook tracking `<link rel="preload">` for fonts and the hero image. Combine into a single 0–100 progress.

Critical assets to preload before reveal: brand font, hero image, `boeing.glb`, `ancla.glb`, `cadenaparaelancla.glb`, `agua.glb` (compressed). Defer until later: `infralitoral`, corals, algae, turtle, bubbles — these can lazy-load while the user is in Acts 1–3.

---

## 8 — Gold line animations

Subtle, never flashy. Use cases:

- Horizontal divider that draws between sections (DrawSVG, 1.2 s ease-out)
- Trail behind the Boeing (4 px stroke, 60 % opacity, fades after 800 ms)
- Underline on hover for primary navigation links
- Frame around the reservation CTA, pulsing once on viewport entry
- The line connecting the anchor to the top of the viewport (continuous, very subtle — 30 % opacity, 0.5 px, slight `sin(time)` sway)

Color: `#C9A86B` matte gold in light sections, `#D4B477` slightly brighter in dark sections. Never use shiny gradient gold — it cheapens the look. Stroke is always 0.5–1 px. Lines do not pulse aggressively. Ease everything with `power2.out` minimum.

---

## 9 — Layering rules — what passes over text and what hides behind

Use Three.js `<Canvas>` with multiple layered scenes via `eventSource` and explicit z-index ordering on canvas DOM elements.

```
Layer order, top to bottom:
  1. Modal/overlay layer (z 100)
  2. Foreground 3D layer — Boeing, turtle, anchor + chain when in front (z 30)
  3. Banner / text content (z 20)
  4. Mid-3D layer — bubbles, gold lines on top of background (z 15)
  5. Background 3D layer — water, infralitoral, corals, algae (z 5)
  6. Sky / fog environment (z 0)
```

The Boeing and the turtle MUST pass over text. They are foreground 3D. The anchor and chain pass through the middle layer — in front of background corals, behind banner text in most acts (in Act 1 they sit just behind the wordmark, in Acts 5+ they sit between corals and text).

Corals, algae, infralitoral, water, bubbles all sit BEHIND text. The user must always be able to read.

---

## 10 — Bootstrap — assets and seed data from the existing site

Run this in a clean folder before scaffolding:

```bash
mkdir -p _source/img/{2020-04,2020-06,2022-05,2025-08} _source/html
BASE=https://theboathouseibiza.com/wp-content/uploads
cd _source/img/2020-04
for f in ivory-logo-TBH.png logo.png anchor2-30x35.png \
         logo-boat-house-150x150.png cropped-favicon-3-270x270.png; do
  curl -sSLO "$BASE/2020/04/$f"
done
cd ../2020-06
for f in GR2C2341-scaled.jpg \
         About-1.jpg About-5.jpg About-11-1.jpg About-12.jpg \
         Salad-1.jpg Salad-2.jpg \
         Mains-1.jpg Mains-3.jpg Mains-4.jpg \
         Drinks-4-1102x624.jpg Drinks-5-1102x624.jpg; do
  curl -sSLO "$BASE/2020/06/$f"
done
cd ../2022-05
for f in Breakfast-B.png \
         Tapas-A.png Tapas-B.png Tapas-C.png Tapas-D.png \
         Starter-B.png Main-A.png \
         Dessert-A.png Dessert-B.png; do
  curl -sSLO "$BASE/2022/05/$f"
done
cd ../2025-08
curl -sSLO "$BASE/2025/08/5K3A0609-scaled.jpg"
cd ../../html
for slug in "" about/ about/our-chef/ menu/ gallery/ contact/; do
  curl -sSL "https://theboathouseibiza.com/$slug" \
    -o "$(echo "${slug:-home}" | tr / -).html"
done
cd ../..

# Safety net mirror — catch any image not listed above, skip WP thumbnail variants
wget -r -np -nH --cut-dirs=2 \
  -A 'jpg,jpeg,png,webp' \
  -R '*-[0-9]*x[0-9]*.*' \
  -P _source/img-full \
  https://theboathouseibiza.com/wp-content/uploads/
```

Then process originals to `/public/images/` at widths `[640, 1080, 1600, 2560]` in AVIF + WebP using Sharp.

### Menu seed data — extract real prices and descriptions

Parse `_source/html/menu.html` with cheerio to extract every `{section, name, price, description, isNew}` and produce `/sanity/seed/menu.json`. Also pull each language variant:

- https://theboathouseibiza.com/menu/ (en)
- https://theboathouseibiza.com/es/menu/ (es)
- https://theboathouseibiza.com/de/speisekarte/ (de)
- https://theboathouseibiza.com/fr/menu/ (fr)
- https://theboathouseibiza.com/nl/menu/ (nl)
- https://theboathouseibiza.com/it/menu/ (it)

Populate the `i18n` fields in Sanity from these. Same for `/about/`, `/about/our-chef/`, `/gallery/`, `/contact/` at locale roots `/es/sobre-nosotros/`, `/de/uber-uns/`, `/fr/qui-sommes-nous/`, `/nl/over-ons/`, `/it/di-noi/`.

### Sanity schemas

```ts
menuSection: { id, slug, titleI18n, order }
menuItem:    { sectionRef, titleI18n, descriptionI18n, price, isNew, isVegan, isVegetarian, isGlutenFree, image }
dish:        { titleI18n, descriptionI18n, image, price, signature: boolean }
review:      { author, source, bodyI18n, rating, locale }
pressMention:{ outlet, quoteI18n, link, date }
event:       { titleI18n, date, descriptionI18n, image }
galleryImage:{ image, captionI18n, category }
chef:        { nameI18n, bioI18n, portrait }
```

---

## 11 — Pages

- `/` — the full descent (Acts 1–7)
- `/menu` — editorial menu with anchor links per section, dishes from Sanity, currency formatted by locale
- `/about` and `/about/our-chef` — family story, chef portrait
- `/gallery` — masonry layout with PhotoSwipe lightbox, filterable by category, lazy loaded
- `/contact` — Sevenrooms widget, Mapbox, opening hours, working tel: and mailto:
- `/press` — press mentions and awards (new — leverage if any)
- `/legal/privacy`, `/legal/cookies`, `/legal/terms`

---

## 12 — Voice and copy guidelines

Editorial. Calm. Confident. Short sentences. Never exclamation marks.

Lean into:
- 40 years of family in Ibiza (1985 — Figueretes, 2005 — On the Beach, 2016 — The Boat House)
- Hidden cove — "where the road runs out and the sea begins"
- Zero-kilometre farm opened 2025 in Cala San Vicente
- The aquarium floor (real architectural feature, mentioned in reviews — exploit it)
- Friesian Tomahawk dry-aged 50 days, paella melosa, wagyu burger
- Six languages — write each native, no machine translation

Pulled directly from the existing site, the family quote: *"To share your food and spend time with your loved ones while enjoying the beach and sea views on a long, lazy summer day — that's our idea of paradise." — Zandwijk Family*

Sample dishes pulled from the live menu (use the parser, do not retype):
- Paella melosa (seafood & fish) 29.50 € / person, min 2
- 50-day dry-aged Friesian beef loin 46.50 €
- Frisian Tomahawk Steak (Galicia) 90.00 € for 1 kg
- Lamb shoulder 74.50 € for 1.2 kg
- Wagyu Boat House burger 24.00 €

---

## 13 — Critical fixes the old site gets wrong — DO NOT REPRODUCE

1. The current footer says "© 2020". Use `{new Date().getFullYear()}`.
2. Social links are broken in the source — they read `http://facebook.com/https://www.facebook.com/...`. The correct values are `https://facebook.com/theboathouseibiza` and `https://instagram.com/theboathouseibiza`.
3. The "make a reservation" button currently routes to a generic contact form. Replace with a real Sevenrooms or TheFork embed.
4. `tel:+34971320118` must be a tel: link, working on mobile.

---

## 14 — Performance, accessibility, SEO

- Lighthouse target: 95+ on every category, every page
- Every animation respects `prefers-reduced-motion`. With it set: kill GSAP scrubs, freeze the 3D scene to its current frame, replace disintegration with simple fade+translate, replace pinned horizontal scroll with stacked vertical
- WCAG 2.2 AA. Focus rings preserved on all interactive elements. Skip-to-content link. Semantic HTML5 (`<main>`, `<nav>`, `<article>`, `<section>`)
- LCP target < 2 s on 4G. Preload hero image and display font subset (only Latin-1 glyphs needed). Defer Three.js bundle until after first contentful paint
- All images carry explicit width/height; no CLS
- Self-host display font, subset to needed glyphs only (Brunel or whichever you pick — fall back to Recoleta)
- 3D scene pauses (`<Canvas frameloop="demand" />` becomes `frameloop="never"`) when `document.hidden` or when the user has been idle for 30 s
- All shaders compile-checked at build with a Vite plugin to surface GLSL errors before deploy
- Bundle the 3D code as a separate chunk with `next/dynamic({ ssr: false })`

<!-- TODO Phase 10 — before Vercel deploy, register the production + preview origins as
Sanity CORS allow-listed hosts so the embedded Studio at /studio works in prod:
  npx sanity cors add https://theboathouseibiza.com --credentials
  npx sanity cors add https://<vercel-deployment-url>.vercel.app --credentials
Without this the studio at the deployed URL hits the same "Connect this studio" gate we saw
in dev for `localhost:3001`. -->

---

## 15 — Deliverables — do these in order, show me before moving on

1. **Bootstrap** — run the asset/menu download scripts, extract the boeing zip, compress all GLBs with gltf-transform + Draco, generate AVIF/WebP image variants, verify all files on disk with sizes
2. **Project scaffold** — Next.js, TS strict, Tailwind tokens, i18n routing, Sanity schemas, basic layout, Lenis + ScrollTrigger wired
3. **Preloader and global 3D canvas shell** — branded preloader bound to real asset progress, `<Canvas>` mounted as fixed full-viewport with the anchor + chain in place but static
4. **Act 1 — sky and Boeing** — sky environment, boeing.glb crossing with scroll-locked pin, wordmark and CTA, hint-to-scroll, gold trail
5. **Disintegration shader** — banner-to-particles transition reusable component, test on Act 1 → Act 2 boundary
6. **Acts 2–3** — heritage 40-year animation, Ibiza coastline trace, sky deepening
7. **Act 4 — water surface crossing** — agua.glb tilted, refraction shader, caustics, post-processing flash
8. **Acts 5–6** — turtle swim-across, dish horizontal pin scroll, sourcing map, dinghy SVG, bubbles
9. **Act 7 — ocean floor** — infralitoral.glb compressed and placed, coral instances, anchor lands, reviews fade-through, footer constellation
10. **Subpages** — /menu, /about, /about/our-chef, /gallery, /contact, /press, all i18n
11. **Email templates** — React Email reservation confirmation in 6 languages, branded
12. **QA pass** — Lighthouse 95+, axe a11y audit, Playwright e2e for the descent, prefers-reduced-motion review, mobile test (the descent should reflow gracefully — Boeing scales smaller, no horizontal pin scroll on touch)

After each step, surface what you changed, the file diff summary, and a screenshot or recorded scroll capture if the change is visual.