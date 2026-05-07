import puppeteer from 'puppeteer';
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, '_source/qa/tanda1');
await mkdir(OUT, { recursive: true });
const W = 1280, H = 720;

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
  await page.emulateMediaFeatures([
    { name: 'prefers-reduced-motion', value: 'no-preference' },
  ]);
  await page.goto(`http://localhost:3000/en`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 9000));
  await page.addStyleTag({
    content: `
      .gsap-marker-start, .gsap-marker-end, .gsap-marker-scroller-start, .gsap-marker-scroller-end { display: none !important; }
      [data-nextjs-toast], [data-nextjs-dialog], #__next-build-watcher,
      nextjs-portal, [class*="__nextjs"] { display: none !important; }
    `,
  });
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), scrollY);
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: join(OUT, `${label}.png`) });
  console.log(`  ${label}.png`);
  await page.close();
}

try {
  await snap('act1-wordmark', 200);    // Act 1 wordmark + Boeing
  await snap('act2-heritage', 2150);   // Act 2 — "40" centred just before trigger
  await snap('act3-cove', 3700);       // Act 3 mid
  await snap('act3-water-emerging', 4400); // Act 3 last 25% — water rising from below
} finally {
  await browser.close();
}
