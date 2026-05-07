import puppeteer from 'puppeteer';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, '_source/qa/step6');
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

async function snap(locale, label, scrollY) {
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  await page.goto(`http://localhost:3000/${locale}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 8000));
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), scrollY);
  await new Promise((r) => setTimeout(r, 800));
  const info = await page.evaluate(() => ({
    scrollY: Math.round(window.scrollY),
    bodyH: document.documentElement.scrollHeight,
  }));
  await page.screenshot({ path: join(OUT, `${locale}-${label}.png`) });
  console.log(`  ${locale}-${label}.png  y=${info.scrollY}/${info.bodyH}`);
  await page.close();
}

try {
  // Act 2 stops — body height should now be act1 + pin + act2 (180vh) + act3 (100vh)
  // ≈ 1080 + 1500 + 1944 + 1080 ≈ 5604
  await snap('en', 'act2-headline', 3500);     // "40" in viewport
  await snap('en', 'act2-quote', 4400);        // quote in viewport
  await snap('en', 'act2-disintegrate', 4900); // mid-disintegration
  await snap('en', 'act3', 5400);              // act 3 placeholder
  await snap('es', 'act2-headline', 3500);
  await snap('de', 'act2-quote', 4400);

  // 2x3 grid for the report
  const tiles = await Promise.all(
    ['en-act2-headline', 'en-act2-quote', 'en-act2-disintegrate', 'en-act3', 'es-act2-headline', 'de-act2-quote']
      .map((f) => sharp(join(OUT, `${f}.png`)).resize({ width: 640, height: 360, fit: 'cover' }).toBuffer()),
  );
  await sharp({
    create: { width: 640 * 3, height: 360 * 2, channels: 3, background: { r: 200, g: 200, b: 200 } },
  })
    .composite(tiles.map((buf, i) => ({ input: buf, top: Math.floor(i / 3) * 360, left: (i % 3) * 640 })))
    .png()
    .toFile(join(OUT, 'flow.png'));
  console.log('wrote flow.png');
} finally {
  await browser.close();
}
