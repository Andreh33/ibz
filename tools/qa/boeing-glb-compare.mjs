// Render both the ORIGINAL Sketchfab GLB and our CURRENT boeing.final.glb
// in unlit mode (MeshBasicMaterial with .map) so the only thing visible is
// the raw baseColorTexture sample. If the two renders differ, our processed
// GLB has lost livery detail vs the source.

import puppeteer from 'puppeteer';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startStaticServer } from './_server.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, '_source/qa');
await mkdir(OUT, { recursive: true });

const { server, port } = await startStaticServer(39855);

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=swiftshader', '--ignore-gpu-blocklist'],
});

async function shoot(glbUrl, outFile) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 360 });
  page.on('console', (m) => { if (m.type() === 'error') console.error('[err]', m.text().slice(0, 200)); });
  const url = `http://127.0.0.1:${port}/tools/qa/_viewer.html?url=${encodeURIComponent(glbUrl)}&w=1280&h=360&cam=side-close&unlit=1`;
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__state?.ready === true, { timeout: 30000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 400));
  const canvas = await page.$('canvas');
  await canvas.screenshot({ path: outFile });
  await page.close();
  console.log('wrote', outFile);
}

try {
  await shoot(
    '/modelo/boeing/source/Atlas%20Air%20Boeing%20747-100%20N3203Y.glb',
    join(OUT, 'boeing-unlit-original-fresh.png'),
  );
  await shoot(
    '/public/models/boeing/boeing.final.glb',
    join(OUT, 'boeing-unlit-final-current.png'),
  );

  // Stack vertically for side-by-side comparison.
  const top = await sharp(join(OUT, 'boeing-unlit-original-fresh.png')).toBuffer();
  const bot = await sharp(join(OUT, 'boeing-unlit-final-current.png')).toBuffer();
  const m = await sharp(top).metadata();
  await sharp({
    create: { width: m.width, height: m.height * 2 + 8, channels: 3, background: { r: 200, g: 200, b: 200 } },
  })
    .composite([
      { input: top, top: 0, left: 0 },
      { input: bot, top: m.height + 8, left: 0 },
    ])
    .png()
    .toFile(join(OUT, 'boeing-unlit-compare.png'));
  console.log('wrote boeing-unlit-compare.png');
} finally {
  await browser.close();
  server.close();
}
