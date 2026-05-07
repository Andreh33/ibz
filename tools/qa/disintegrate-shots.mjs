import puppeteer from 'puppeteer';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, '_source/qa/step5');
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

async function snap() {
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });

  page.on('console', (m) => {
    if (m.type() === 'error') console.error('[err]', m.text().slice(0, 200));
    if (m.type() === 'warning' && /disintegration|html2canvas/.test(m.text())) console.error('[warn]', m.text().slice(0, 200));
  });

  await page.goto(`${HOST}/en`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  // wait for preloader exit + html2canvas snapshot to land + ScrollTrigger refresh
  await new Promise((r) => setTimeout(r, 6000));

  // Touch ScrollTrigger.refresh in case layout settled after capture
  await page.evaluate(() => {
    if (typeof window !== 'undefined' && window.ScrollTrigger) window.ScrollTrigger.refresh();
  }).catch(() => {});

  const stops = [
    { label: 'pre-pin', y: 0 },
    { label: 'mid-pin', y: 760 },
    { label: 'pin-end', y: 1500 },
    { label: 'pre-disint', y: 1700 },
    { label: 'disint-25', y: 1870 },
    { label: 'disint-50', y: 2030 },
    { label: 'disint-75', y: 2180 },
    { label: 'disint-end', y: 2350 },
    { label: 'act2', y: 2700 },
  ];

  for (const s of stops) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), s.y);
    await new Promise((r) => setTimeout(r, 700));
    const file = `${s.label}.png`;
    await page.screenshot({ path: join(OUT, file) });
    const info = await page.evaluate(() => ({
      scrollY: Math.round(window.scrollY),
      bodyH: document.documentElement.scrollHeight,
    }));
    console.log(`  ${s.label} y=${info.scrollY}/${info.bodyH}`);
  }

  await page.close();
}

try {
  await snap();

  // Build a flow strip 3x3 of all 9 frames
  const labels = [
    'pre-pin', 'mid-pin', 'pin-end',
    'pre-disint', 'disint-25', 'disint-50',
    'disint-75', 'disint-end', 'act2',
  ];
  const TW = 640, TH = 360;
  const tiles = await Promise.all(
    labels.map((l) =>
      sharp(join(OUT, `${l}.png`)).resize({ width: TW, height: TH, fit: 'cover' }).toBuffer(),
    ),
  );
  await sharp({
    create: { width: TW * 3, height: TH * 3, channels: 3, background: { r: 245, g: 240, b: 230 } },
  })
    .composite(
      tiles.map((buf, i) => ({ input: buf, top: Math.floor(i / 3) * TH, left: (i % 3) * TW })),
    )
    .png()
    .toFile(join(OUT, 'flow.png'));
  console.log('wrote flow.png');
} finally {
  await browser.close();
}
