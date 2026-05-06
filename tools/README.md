# tools/ — asset pipeline

One-shot pipeline that turns raw sources in `modelo/` and `_source/img/` into
production-ready files in `public/models/` and `public/images/`. Run from this
folder, never from the repo root. The repo root is the Next.js app — don't
contaminate it with these dependencies.

## Setup

```bash
cd tools
npm install
```

## Run

```bash
npm run all          # process-images + compress-glb
npm run process-images
npm run compress-glb
npm run qa           # qa-boeing + qa-tortuga
npm run qa-boeing    # writes _source/qa/boeing-preview.png
npm run qa-tortuga   # writes _source/qa/tortuga-frame-{0..3}.png + grid
```

## Sanity seed pipeline

The readable source-of-truth for menu data lives at `sanity/seed/menu.json`. Sanity's
`dataset import` command requires NDJSON though, so before importing run the converter:

```bash
node tools/build-seed-ndjson.mjs                                                 # → sanity/seed/menu.ndjson
npx sanity@latest dataset import sanity/seed/menu.ndjson production --replace    # idempotent
```

`build-seed-ndjson.mjs` is reproducible from any machine with `node` — it reads the JSON,
emits one Sanity document per line with stable `_id`s and resolved `section -> menuSection`
references, and writes the NDJSON next to the JSON. Edit the JSON, re-run the converter,
re-import. Never edit the NDJSON by hand.

## Notes

- `compress-glb.mjs` skips `--simplify` for animated GLBs (`tortuga.glb`,
  `burbujas.glb`); welding/simplification can break skinning and shape keys.
- All scripts resolve paths from the repo root via `import.meta.url`, so the
  cwd doesn't matter — they always write to the right place.
- Output sizes after the pipeline: `public/models/` ~10 MB total (down from
  137 MB raw) and `public/images/` 106 AVIF+WebP variants from 27 originals.
- QA scripts spin up a tiny static server on 127.0.0.1 and use puppeteer's
  bundled headless Chromium with WebGL via ANGLE.
