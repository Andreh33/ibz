import puppeteer from 'puppeteer';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, '_source/qa/step7');
await mkdir(OUT, { recursive: true });

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

async function snap(label, scrollY) {
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  await page.goto(`http://localhost:3000/en`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 8000));
  // Hide GSAP ScrollTrigger debug markers + Next.js dev indicators so the
  // captured screenshots match the production look.
  await page.addStyleTag({
    content: `
      .gsap-marker-start, .gsap-marker-end, .gsap-marker-scroller-start, .gsap-marker-scroller-end {
        display: none !important;
      }
      [data-nextjs-toast], [data-nextjs-dialog], #__next-build-watcher,
      nextjs-portal, [class*="__nextjs"] {
        display: none !important;
      }
    `,
  });
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), scrollY);
  await new Promise((r) => setTimeout(r, 1200));
  const info = await page.evaluate(() => ({
    scrollY: Math.round(window.scrollY),
    bodyH: document.documentElement.scrollHeight,
  }));
  await page.screenshot({ path: join(OUT, `${label}.png`) });
  console.log(`  ${label}.png  y=${info.scrollY}/${info.bodyH}`);
  await page.close();
}

try {
  // Sweep across Act 3 to find the right frames for the new layout.
  await snap('act1-liquid-1850', 1850);     // wordmark just starting to wobble
  await snap('act1-liquid-1865', 1865);     // wobble building
  await snap('act1-liquid-1880', 1880);     // wordmark mid liquid wobble
  await snap('act1-liquid-1900', 1900);     // wobble peak
  await snap('act1-liquid-1920', 1920);     // wordmark dust phase
  await snap('act3-trace-25', 4560);        // silhouette starting trace
  await snap('act3-trace-60', 4650);        // silhouette mid-trace
  await snap('act3-trace-95', 4730);        // silhouette near complete + pin reveal
  await snap('act3-pin-stable', 4800);      // pin stable, silhouette mid-viewport
  await snap('act3-data-bottom', 5100);     // scrolled to data grid
  await snap('act3-disint-5350', 5350);
  await snap('act3-disint-5400', 5400);
  await snap('act3-disint-5450', 5450);

  // 3x3 mosaic for the report (9 tiles)
  const tileFiles = [
    'act1-liquid-1850',
    'act1-liquid-1880',
    'act1-liquid-1920',
    'act3-trace-25',
    'act3-trace-60',
    'act3-trace-95',
    'act3-pin-stable',
    'act3-data-bottom',
    'act3-disint-5400',
  ];
  const tiles = await Promise.all(
    tileFiles.map((f) =>
      sharp(join(OUT, `${f}.png`)).resize({ width: 640, height: 360, fit: 'cover' }).toBuffer(),
    ),
  );
  await sharp({
    create: {
      width: 640 * 3,
      height: 360 * 3,
      channels: 3,
      background: { r: 200, g: 200, b: 200 },
    },
  })
    .composite(
      tiles.map((buf, i) => ({
        input: buf,
        top: Math.floor(i / 3) * 360,
        left: (i % 3) * 640,
      })),
    )
    .png()
    .toFile(join(OUT, 'flow.png'));
  console.log('wrote flow.png');
} finally {
  await browser.close();
}
