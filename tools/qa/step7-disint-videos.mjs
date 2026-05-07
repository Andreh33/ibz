import puppeteer from 'puppeteer';
import sharp from 'sharp';
import { mkdir, readdir, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, '_source/qa/step7-videos');
await mkdir(OUT, { recursive: true });

const W = 1280;
const H = 720;

// Human scroll speed: a fast wheel flick is ~3000–5000 px/s. We aim for
// 4000 px/s with 60fps frames → 67px per 16ms tick. That's the velocity
// the user said is realistic.
const SCROLL_VELOCITY_PX_PER_S = 4000;
const FRAME_INTERVAL_MS = 33; // ~30fps capture so files stay manageable
const SCROLL_PER_FRAME = (SCROLL_VELOCITY_PX_PER_S * FRAME_INTERVAL_MS) / 1000;

const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--enable-unsafe-swiftshader',
    '--use-gl=swiftshader',
    '--ignore-gpu-blocklist',
    `--window-size=${W},${H}`,
  ],
});

async function setup(page) {
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([
    { name: 'prefers-reduced-motion', value: 'no-preference' },
  ]);
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('[disint]') || text.includes('[disintegration]')) {
      console.log('  PAGE>', text);
    }
  });
  await page.goto(`http://localhost:3000/en`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await new Promise((r) => setTimeout(r, 8000));
  await page.addStyleTag({
    content: `
      .gsap-marker-start, .gsap-marker-end, .gsap-marker-scroller-start, .gsap-marker-scroller-end { display: none !important; }
      [data-nextjs-toast], [data-nextjs-dialog], #__next-build-watcher,
      nextjs-portal, [class*="__nextjs"] { display: none !important; }
    `,
  });
}

async function captureRange(label, fromY, toY) {
  console.log(`\n=== ${label} : ${fromY} → ${toY} ===`);
  const folder = join(OUT, label);
  await rm(folder, { recursive: true, force: true });
  await mkdir(folder, { recursive: true });

  const page = await browser.newPage();
  await setup(page);

  // Jump to ~200px before the start so the disint trigger can engage from
  // the natural ScrollTrigger flow.
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), Math.max(0, fromY - 200));
  await new Promise((r) => setTimeout(r, 1500));

  let y = fromY - 200;
  let frame = 0;
  while (y < toY) {
    y = Math.min(y + SCROLL_PER_FRAME, toY);
    await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y);
    // brief tick so the GSAP scrubbing/timeline can update
    await new Promise((r) => setTimeout(r, FRAME_INTERVAL_MS));
    const file = join(folder, `${String(frame).padStart(3, '0')}.png`);
    await page.screenshot({ path: file });
    frame++;
  }

  // Hold the final position for a bit so any lingering animation is captured.
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, FRAME_INTERVAL_MS));
    const file = join(folder, `${String(frame).padStart(3, '0')}.png`);
    await page.screenshot({ path: file });
    frame++;
  }
  await page.close();
  console.log(`  ${frame} frames captured to ${folder}`);
  return { folder, frames: frame };
}

async function buildContactSheet({ folder, frames }, outFile) {
  // Pick 6 evenly-spaced frames for the contact sheet.
  const files = (await readdir(folder)).filter((f) => f.endsWith('.png')).sort();
  const picks = [];
  const N = 6;
  for (let i = 0; i < N; i++) {
    const idx = Math.min(files.length - 1, Math.round((i * (files.length - 1)) / (N - 1)));
    picks.push(files[idx]);
  }
  const tileW = 480;
  const tileH = 270;
  const tiles = await Promise.all(
    picks.map((f) => sharp(join(folder, f)).resize({ width: tileW, height: tileH, fit: 'cover' }).toBuffer()),
  );
  const cols = 3, rows = 2;
  await sharp({
    create: { width: tileW * cols, height: tileH * rows, channels: 3, background: { r: 14, g: 32, b: 44 } },
  })
    .composite(
      tiles.map((buf, i) => ({
        input: buf,
        top: Math.floor(i / cols) * tileH,
        left: (i % cols) * tileW,
      })),
    )
    .png()
    .toFile(outFile);
  console.log(`  contact sheet → ${outFile}`);
}

try {
  // Sweep covers each act's dissolve window at human wheel speed (~4000
  // px/s). Each window starts ~400 px before the trigger fires (banner
  // fully visible) and ends after the next act's banner appears, so the
  // viewer can see banner intact → wobble → particles → next-act banner
  // arriving in one continuous capture.
  const a1 = await captureRange('act1-wordmark', 600, 2200);
  const a2 = await captureRange('act2-heritage', 2200, 3800);
  const a3 = await captureRange('act3-hidden-cove', 3400, 5100);

  await buildContactSheet(a1, join(OUT, 'act1-wordmark.png'));
  await buildContactSheet(a2, join(OUT, 'act2-heritage.png'));
  await buildContactSheet(a3, join(OUT, 'act3-hidden-cove.png'));
} finally {
  await browser.close();
}
