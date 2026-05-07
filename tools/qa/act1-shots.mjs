import puppeteer from 'puppeteer';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, '_source/qa/step4');
await mkdir(OUT, { recursive: true });

const HOST = 'http://localhost:3000';
const W = 1920, H = 1080;

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

async function snap(locale, scrolls) {
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.setCacheEnabled(false);

  const reqs = { glb: [] };
  page.on('request', (r) => {
    if (r.url().endsWith('.glb')) reqs.glb.push(r.url().replace(HOST, ''));
  });

  await page.goto(`${HOST}/${locale}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  // Wait for preloader to fully exit + first paint of canvases
  await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), { timeout: 15000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 2500));

  for (const s of scrolls) {
    await page.evaluate((y) => {
      window.scrollTo({ top: y, behavior: 'instant' });
    }, s.y);
    // Lenis + ScrollTrigger need a tick or two to catch up
    await new Promise((r) => setTimeout(r, 700));
    const state = await page.evaluate(() => ({
      scrollY: Math.round(window.scrollY),
      bodyH: document.documentElement.scrollHeight,
    }));
    const file = `${locale}-${s.label}.png`;
    await page.screenshot({ path: join(OUT, file) });
    console.log(`  ${locale} ${s.label} y=${state.scrollY}/${state.bodyH}`);
  }

  console.log(`  ${locale} GLB requests:`, reqs.glb);
  await page.close();
}

try {
  await snap('en', [
    { label: 'act1-0', y: 0 },
    { label: 'act1-25', y: 380 },
    { label: 'act1-50', y: 760 },
    { label: 'act1-75', y: 1140 },
    { label: 'act1-100', y: 1500 },
    { label: 'act2', y: 2400 },
  ]);
  await snap('es', [{ label: 'act1-50', y: 760 }]);
  await snap('de', [{ label: 'act1-50', y: 760 }]);

  // 6-frame strip of EN: vertical 2x3 grid
  const frames = ['act1-0', 'act1-25', 'act1-50', 'act1-75', 'act1-100', 'act2'];
  const TW = 640, TH = 360;
  const tiles = await Promise.all(
    frames.map((f) => sharp(join(OUT, `en-${f}.png`)).resize({ width: TW, height: TH, fit: 'cover' }).toBuffer()),
  );
  await sharp({
    create: { width: TW * 3, height: TH * 2, channels: 3, background: { r: 245, g: 240, b: 230 } },
  })
    .composite(tiles.map((buf, i) => ({ input: buf, top: Math.floor(i / 3) * TH, left: (i % 3) * TW })))
    .png()
    .toFile(join(OUT, 'flow-en.png'));
  console.log('wrote flow-en.png');
} finally {
  await browser.close();
}
