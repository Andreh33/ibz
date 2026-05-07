import puppeteer from 'puppeteer';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, '_source/qa/step3');
await mkdir(OUT, { recursive: true });

const HOST = 'http://localhost:3000';
const W = 1280, H = 800;

const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--enable-unsafe-swiftshader',
    '--use-gl=swiftshader',
    '--ignore-gpu-blocklist',
  ],
});

async function captureFlow(locale) {
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.setCacheEnabled(false);

  const glbRequests = [];
  const allReqs = [];
  page.on('request', (req) => {
    const u = req.url();
    allReqs.push(u);
    if (u.endsWith('.glb')) glbRequests.push(u.replace(HOST, ''));
  });
  page.on('requestfailed', (req) => {
    if (req.url().endsWith('.glb')) console.log('GLB FAILED', req.url(), req.failure()?.errorText);
  });

  // Selective throttle: only delay .glb responses, not page chunks. This keeps SceneRoot
  // hydrating fast while making the GLB download long enough to capture intermediate progress.
  await page.setRequestInterception(true);
  page.on('request', async (req) => {
    if (req.url().endsWith('.glb')) {
      await new Promise((r) => setTimeout(r, 1200));
    }
    req.continue().catch(() => {});
  });

  page.on('console', (m) => { if (m.type() === 'error') console.error(`[page-${locale}]`, m.text().slice(0, 200)); });

  const navP = page.goto(`${HOST}/${locale}`, { waitUntil: 'networkidle0', timeout: 60000 });

  // Mid-progress: snapshot when progress crosses ~40-70%
  await page.waitForFunction(
    () => {
      const m = document.querySelector('p.font-mono.tabular-nums');
      if (!m) return false;
      const pct = parseInt((m.textContent ?? '0').replace('%', ''), 10);
      return pct >= 35 && pct < 90;
    },
    { timeout: 15000 },
  ).catch(() => null);
  await page.screenshot({ path: join(OUT, `preloader-mid-${locale}.png`) });

  // Full-progress before exit
  await page.waitForFunction(
    () => {
      const m = document.querySelector('p.font-mono.tabular-nums');
      const txt = m?.textContent ?? '';
      return txt.includes('100');
    },
    { timeout: 15000 },
  ).catch(() => null);
  await new Promise((r) => setTimeout(r, 250));
  await page.screenshot({ path: join(OUT, `preloader-full-${locale}.png`) });

  // After wipe — preloader unmounted
  await page.waitForFunction(
    () => !document.querySelector('[aria-busy]'),
    { timeout: 5000 },
  ).catch(() => null);
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: join(OUT, `home-post-wipe-${locale}.png`) });

  await navP.catch(() => null);
  console.log(`  ${locale} total reqs: ${allReqs.length}, model reqs: ${allReqs.filter((r) => r.includes('/models/')).length}`);
  await page.close();
  return glbRequests;
}

try {
  console.log('--- /en flow ---');
  const enGlbs = await captureFlow('en');
  console.log('GLB requests on /en:', enGlbs);
  console.log('--- /es flow ---');
  await captureFlow('es');
  console.log('--- /de flow ---');
  await captureFlow('de');

  // Composite the three EN states for the report
  const mid = await sharp(join(OUT, 'preloader-mid-en.png')).resize({ width: 600 }).toBuffer();
  const full = await sharp(join(OUT, 'preloader-full-en.png')).resize({ width: 600 }).toBuffer();
  const post = await sharp(join(OUT, 'home-post-wipe-en.png')).resize({ width: 600 }).toBuffer();
  const m = await sharp(mid).metadata();
  const totalH = (m.height ?? 0) * 3 + 20;
  await sharp({
    create: { width: 600, height: totalH, channels: 3, background: { r: 245, g: 240, b: 230 } },
  })
    .composite([
      { input: mid, top: 0, left: 0 },
      { input: full, top: (m.height ?? 0) + 10, left: 0 },
      { input: post, top: (m.height ?? 0) * 2 + 20, left: 0 },
    ])
    .png()
    .toFile(join(OUT, 'flow-en.png'));
  console.log('wrote flow-en.png');
} finally {
  await browser.close();
}
