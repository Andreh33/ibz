import puppeteer from 'puppeteer';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, '_source/qa/scaffold');
await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist'],
});

const W = 1280, H = 800;

async function shoot(path, file, opts = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.goto(`http://localhost:3000${path}`, { waitUntil: 'networkidle0', timeout: 60000 });
  if (opts.scrollY) {
    await page.evaluate((y) => window.scrollBy({ top: y, behavior: 'instant' }), opts.scrollY);
    await new Promise((r) => setTimeout(r, opts.wait ?? 1200));
  }
  await page.screenshot({ path: join(OUT, file), fullPage: false });
  await page.close();
  console.log('wrote', file);
}

try {
  // 6 locales — top of home
  for (const loc of ['en', 'es', 'de', 'fr', 'nl', 'it']) {
    await shoot(`/${loc}`, `home-${loc}.png`);
  }
  // ScrollTrigger probe — visible after scrolling past the probe section start
  await shoot(`/en`, `probe-scrolled.png`, { scrollY: H * 1.6, wait: 1800 });
  // Studio
  await shoot(`/studio`, `studio.png`, { wait: 4000 });

  // Build a 3x2 grid of locales
  const tiles = ['en', 'es', 'de', 'fr', 'nl', 'it'].map((l) => join(OUT, `home-${l}.png`));
  const TW = 640, TH = 400;
  const resized = await Promise.all(
    tiles.map((t) => sharp(t).resize({ width: TW, height: TH, fit: 'cover' }).toBuffer()),
  );
  await sharp({
    create: { width: TW * 3, height: TH * 2, channels: 3, background: { r: 245, g: 240, b: 230 } },
  })
    .composite(
      resized.map((buf, i) => ({ input: buf, top: Math.floor(i / 3) * TH, left: (i % 3) * TW })),
    )
    .png()
    .toFile(join(OUT, 'locales-grid.png'));
  console.log('wrote locales-grid.png');
} finally {
  await browser.close();
}
