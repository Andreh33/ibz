import puppeteer from 'puppeteer';
import path from 'node:path';
import { startStaticServer } from './_server.mjs';

const { server, ROOT, port } = await startStaticServer(39847);
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 500, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (m.type() === 'error') console.error('[page]', m.text()); });

  const url = `http://127.0.0.1:${port}/tools/qa/_viewer.html?url=/public/models/boeing/boeing.final.glb&w=800&h=500&anim=0`;
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__state?.ready === true, { timeout: 30000 });

  const state = await page.evaluate(() => window.__state);
  console.log('boeing state:', JSON.stringify(state));
  if (state.error) throw new Error('three error: ' + state.error);

  await new Promise((r) => setTimeout(r, 200));
  const out = path.join(ROOT, '_source/qa/boeing-preview.png');
  const canvas = await page.$('canvas');
  await canvas.screenshot({ path: out });
  console.log('wrote', out);
} finally {
  await browser.close();
  server.close();
}
