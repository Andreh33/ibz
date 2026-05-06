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

const W = 1280, H = 1100;
const HOST = 'http://localhost:3001';

async function shootProbe(loc, file) {
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H });
  await page.goto(`${HOST}/${loc}`, { waitUntil: 'networkidle0', timeout: 60000 });
  // scroll past the hero so SanityProbe is centered
  await page.evaluate(() => {
    const probe = document.querySelector('section[class*="border-y"][class*="border-gold"]');
    if (probe) probe.scrollIntoView({ block: 'center', behavior: 'instant' });
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: join(OUT, file) });
  await page.close();
  console.log('wrote', file);
}

async function shootStudio(file) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto(`${HOST}/studio`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 12000));
  await page.screenshot({ path: join(OUT, file) });
  await page.close();
  console.log('wrote', file);
}

async function shootStudioMenuItems(file) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto(`${HOST}/studio/structure/menuItem`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 12000));
  await page.screenshot({ path: join(OUT, file) });
  await page.close();
  console.log('wrote', file);
}

try {
  await shootProbe('en', 'probe-en.png');
  await shootProbe('es', 'probe-es.png');
  await shootProbe('de', 'probe-de.png');
  await shootStudio('studio-loaded.png');
  await shootStudioMenuItems('studio-menuItems.png');

  // Compose a 3-row probe comparison
  const en = await sharp(join(OUT, 'probe-en.png')).resize({ width: 1100 }).toBuffer();
  const es = await sharp(join(OUT, 'probe-es.png')).resize({ width: 1100 }).toBuffer();
  const de = await sharp(join(OUT, 'probe-de.png')).resize({ width: 1100 }).toBuffer();
  const enM = await sharp(en).metadata();
  const esM = await sharp(es).metadata();
  const deM = await sharp(de).metadata();
  const totalH = (enM.height ?? 0) + (esM.height ?? 0) + (deM.height ?? 0);
  await sharp({
    create: { width: 1100, height: totalH, channels: 3, background: { r: 245, g: 240, b: 230 } },
  })
    .composite([
      { input: en, top: 0, left: 0 },
      { input: es, top: enM.height ?? 0, left: 0 },
      { input: de, top: (enM.height ?? 0) + (esM.height ?? 0), left: 0 },
    ])
    .png()
    .toFile(join(OUT, 'probe-i18n.png'));
  console.log('wrote probe-i18n.png');
} finally {
  await browser.close();
}
