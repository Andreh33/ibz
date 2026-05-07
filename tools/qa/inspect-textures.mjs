// Pulls the dev-mode __disintCaptures array off window after page load to
// see exactly what html2canvas produced for each banner. If any of them are
// blank, that's the disintegration's input problem.

import puppeteer from 'puppeteer';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, '_source/qa/step7-videos');
await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--enable-unsafe-swiftshader',
    '--use-gl=swiftshader',
    '--ignore-gpu-blocklist',
  ],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([
    { name: 'prefers-reduced-motion', value: 'no-preference' },
  ]);
  await page.goto('http://localhost:3000/en', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 10000));
  const captures = await page.evaluate(() => (window).__disintCaptures || []);
  console.log('captures:', captures.length);
  for (let i = 0; i < captures.length; i++) {
    const dataUrl = captures[i];
    const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
    const file = join(OUT, `texture-${i}.png`);
    await writeFile(file, buf);
    console.log('wrote', file, 'size:', buf.length);
  }
} finally {
  await browser.close();
}
