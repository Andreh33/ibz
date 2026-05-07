import puppeteer from 'puppeteer';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, '_source/qa/step8');
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
  page.on('console', (msg) => {
    const t = msg.text();
    if (t.includes('[disint]') || t.includes('[water]') || t.includes('[act4]')) {
      console.log('  PAGE>', t);
    }
  });
  await page.goto(`http://localhost:3000/en`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await new Promise((r) => setTimeout(r, 8000));
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
  // Act 4 pin starts after Acts 1–3. Body height likely ≈ 7–8k. The Act 4
  // pin runs ~1500px, with act4Progress 0→1 mapped across that range.
  // Sweep at 5 key beats:
  //   pre-cross  — sky cobalt, water above viewport (a4 ≈ 0.10)
  //   approach   — water descending into viewport (a4 ≈ 0.25)
  //   mid-cross  — flash + chromatic aberration peak (a4 ≈ 0.40)
  //   post-cross — submerged: turquoise sky, caustics + god rays (a4 ≈ 0.65)
  //   final      — headline visible, stable underwater scene (a4 ≈ 0.90)
  //
  // The puppeteer body height for /en at viewport 720 was 7004 in step 7;
  // adding Act 4 pin (1500) → ≈ 8504. Pin starts at the section's docTop
  // ≈ 5004 (Act 1 pin spacer 1500 + ScrollHint slack + Act 2 + Act 3).
  // We approximate the offsets and let the act4Progress be visible in
  // captured frames via the visual state.
  const base = 5000; // approximate Act 4 pin start
  await snap('act4-01-pre', base + 100);     // a4 ≈ 0.07
  await snap('act4-02-approach', base + 400); // a4 ≈ 0.27
  await snap('act4-03-cross', base + 600);    // a4 ≈ 0.40 (flash peak)
  await snap('act4-04-submerged', base + 1000); // a4 ≈ 0.67
  await snap('act4-05-final', base + 1350);   // a4 ≈ 0.90

  // Composite 5-tile contact sheet
  const tiles = ['act4-01-pre', 'act4-02-approach', 'act4-03-cross', 'act4-04-submerged', 'act4-05-final'];
  const labels = [
    'Pre-cross — sky cobalt, water above',
    'Approach — water descending',
    'Mid-cross — flash + chromatic aberration',
    'Submerged — caustics + god rays',
    'Final — headline visible, stable underwater',
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
    .toFile(join(OUT, 'step8-flow.png'));
  console.log('wrote step8-flow.png');
} finally {
  await browser.close();
}
