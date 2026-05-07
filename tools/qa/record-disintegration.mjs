// Captures each scroll step as a PNG frame, then stitches with ffmpeg into webm.
// More reliable than puppeteer's screencast for synchronizing visuals to scroll
// position — one PNG = one scroll step at known y.

import puppeteer from 'puppeteer';
import { spawnSync } from 'node:child_process';
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, '_source/qa');
const TMP = join(ROOT, '_source/qa/_video-frames-tmp');
await mkdir(OUT, { recursive: true });

const HOST = 'http://localhost:3000';
const FFMPEG = String.raw`C:\Users\Andres\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin\ffmpeg.exe`;

async function recordFrames({ outDir, reducedMotion }) {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--enable-unsafe-swiftshader',
      '--use-gl=swiftshader',
      '--ignore-gpu-blocklist',
      '--window-size=1920,1080',
      '--hide-scrollbars',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    await page.emulateMediaFeatures([
      {
        name: 'prefers-reduced-motion',
        value: reducedMotion ? 'reduce' : 'no-preference',
      },
    ]);
    await page.goto(`${HOST}/en`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 8000));

    // Land at start, dwell briefly to settle.
    await page.evaluate(() => window.scrollTo({ top: 1700, behavior: 'instant' }));
    await new Promise((r) => setTimeout(r, 1200));

    let frame = 0;

    // Pre-scroll dwell — 30 frames at the start (1.5s at 20fps).
    for (let i = 0; i < 30; i++) {
      await page.screenshot({ path: join(outDir, `f${String(frame++).padStart(4, '0')}.png`) });
      await new Promise((r) => setTimeout(r, 16));
    }

    // Stepped scroll 1700 → 2500 at 12px per frame ≈ 240 px/s at 20fps playback.
    const startY = 1700;
    const endY = 2500;
    const step = 12;
    let y = startY;
    while (y <= endY) {
      await page.evaluate((targetY) => window.scrollTo({ top: targetY, behavior: 'instant' }), y);
      // Allow scroll handlers + r3f frame to update before screenshot.
      await new Promise((r) => setTimeout(r, 30));
      await page.screenshot({ path: join(outDir, `f${String(frame++).padStart(4, '0')}.png`) });
      y += step;
    }

    // Post-scroll dwell — 30 frames (1.5s).
    for (let i = 0; i < 30; i++) {
      await page.screenshot({ path: join(outDir, `f${String(frame++).padStart(4, '0')}.png`) });
      await new Promise((r) => setTimeout(r, 16));
    }

    console.log(`  ${reducedMotion ? 'reduced' : 'normal'}: ${frame} frames`);
  } finally {
    await browser.close();
  }
}

function stitch(framesDir, outFile, fps = 20) {
  const r = spawnSync(
    FFMPEG,
    [
      '-y',
      '-framerate',
      String(fps),
      '-i',
      join(framesDir, 'f%04d.png'),
      '-c:v',
      'libvpx-vp9',
      '-b:v',
      '0',
      '-crf',
      '32',
      '-pix_fmt',
      'yuv420p',
      '-loglevel',
      'error',
      outFile,
    ],
    { stdio: 'inherit' },
  );
  if (r.status !== 0) throw new Error(`ffmpeg failed (status ${r.status})`);
}

console.log('--- recording normal ---');
const normalDir = join(TMP, 'normal');
await recordFrames({ outDir: normalDir, reducedMotion: false });
stitch(normalDir, join(OUT, 'disintegration.webm'));
console.log('wrote disintegration.webm');

console.log('--- recording reduced ---');
const reducedDir = join(TMP, 'reduced');
await recordFrames({ outDir: reducedDir, reducedMotion: true });
stitch(reducedDir, join(OUT, 'disintegration-reduced-motion.webm'));
console.log('wrote disintegration-reduced-motion.webm');

// Optional cleanup
await rm(TMP, { recursive: true, force: true });
console.log('done');
