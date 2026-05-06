import puppeteer from 'puppeteer';
import sharp from 'sharp';
import path from 'node:path';
import { startStaticServer } from './_server.mjs';

const { server, ROOT, port } = await startStaticServer(39848);
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist'],
});

try {
  const page = await browser.newPage();
  const W = 400, H = 400;
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (m.type() === 'error') console.error('[page]', m.text()); });

  const url = `http://127.0.0.1:${port}/tools/qa/_viewer.html?url=/public/models/tortuga.final.glb&w=${W}&h=${H}&anim=1`;
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__state?.ready === true, { timeout: 30000 });

  const state = await page.evaluate(() => window.__state);
  console.log('tortuga state:', JSON.stringify(state));
  if (state.error) throw new Error('three error: ' + state.error);
  if (!state.hasAnim) throw new Error('no animation found in tortuga.final.glb');

  const frames = [];
  for (let i = 0; i < 4; i++) {
    const t = i * 0.25;
    const ok = await page.evaluate((tt) => window.__renderAtT(tt), t);
    if (!ok) throw new Error('renderAtT returned false at t=' + t);
    await new Promise((r) => setTimeout(r, 60));
    const out = path.join(ROOT, `_source/qa/tortuga-frame-${i}.png`);
    const canvas = await page.$('canvas');
    await canvas.screenshot({ path: out });
    frames.push(out);
    console.log('wrote', out);
  }

  const grid = path.join(ROOT, '_source/qa/tortuga-grid.png');
  await sharp({
    create: { width: W * 2, height: H * 2, channels: 3, background: { r: 245, g: 240, b: 230 } },
  })
    .composite([
      { input: frames[0], top: 0, left: 0 },
      { input: frames[1], top: 0, left: W },
      { input: frames[2], top: H, left: 0 },
      { input: frames[3], top: H, left: W },
    ])
    .png()
    .toFile(grid);
  console.log('wrote', grid);
} finally {
  await browser.close();
  server.close();
}
