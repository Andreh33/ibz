import puppeteer from 'puppeteer';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, '_source/qa/step9a');
await mkdir(OUT, { recursive: true });

const W = 1280;
const H = 720;

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
  await page.goto(`http://localhost:3000/en`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
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
  const info = await page.evaluate(() => ({
    scrollY: Math.round(window.scrollY),
    bodyH: document.documentElement.scrollHeight,
  }));
  await page.screenshot({ path: join(OUT, `${label}.png`) });
  console.log(`  ${label}.png  y=${info.scrollY}/${info.bodyH}`);
  await page.close();
}

try {
  // Act 5 pin starts after Act 4 pin spacer ≈ scroll 6500. Pin distance
  // 4500 → Act 5 occupies scroll 6500 → 11000 with the tortuga + dishes
  // scrub mapped across that range. We sample 5 beats:
  //   intro    — header visible, first plate centered (a5 ≈ 0.05)
  //   2nd dish — track shifted, header faded (a5 ≈ 0.25)
  //   middle   — turtle silhouette mid-viewport, dish 3-4 visible (a5 ≈ 0.5)
  //   late     — turtle past centre, dishes 4-5 (a5 ≈ 0.75)
  //   end      — last plate centered, turtle exiting left (a5 ≈ 0.95)
  const base = 7220; // Act 5 pin start (Act 4 spacer ends at ≈7217)
  await snap('act5-01-intro', base + 100);
  await snap('act5-02-second', base + 900);
  await snap('act5-03-middle', base + 2100);
  await snap('act5-04-late', base + 3300);
  await snap('act5-05-end', base + 4350);

  const tiles = ['act5-01-intro', 'act5-02-second', 'act5-03-middle', 'act5-04-late', 'act5-05-end'];
  const labels = [
    'Intro — header visible, dish 1 centred',
    'Dish 2 centred, header fading out',
    'Mid-act — tortuga sweeping across, dish 3-4',
    'Late — tortuga past centre, dishes 4-5',
    'End — last plate centred, tortuga exiting left',
  ];
  const tileBufs = await Promise.all(
    tiles.map((f) => sharp(join(OUT, `${f}.png`)).resize({ width: 1280, height: 720, fit: 'cover' }).toBuffer()),
  );
  const labelH = 56, gap = 24;
  const totalH = (720 + labelH + gap) * tiles.length - gap;
  const overlays = [];
  for (let i = 0; i < tiles.length; i++) {
    const top = i * (720 + labelH + gap);
    overlays.push({
      input: Buffer.from(`<svg width='1280' height='${labelH}'><rect width='100%' height='100%' fill='#0E202C'/><text x='24' y='36' fill='#F5F0E6' font-family='monospace' font-size='18' letter-spacing='2'>${labels[i]}</text></svg>`),
      top,
      left: 0,
    });
    overlays.push({ input: tileBufs[i], top: top + labelH, left: 0 });
  }
  await sharp({
    create: { width: 1280, height: totalH, channels: 3, background: { r: 14, g: 32, b: 44 } },
  })
    .composite(overlays)
    .png()
    .toFile(join(OUT, 'step9a-flow.png'));
  console.log('wrote step9a-flow.png');
} finally {
  await browser.close();
}
