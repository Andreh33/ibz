import sharp from 'sharp';
import { readdir, mkdir } from 'node:fs/promises';
import { extname, basename, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, '_source/img');
const DEST = join(ROOT, 'public/images');
const WIDTHS = [640, 1080, 1600, 2560];
const EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

await mkdir(DEST, { recursive: true });

const subdirs = await readdir(SRC, { withFileTypes: true });
const files = [];
for (const d of subdirs) {
  if (!d.isDirectory()) continue;
  const dir = join(SRC, d.name);
  for (const f of await readdir(dir)) {
    if (EXT.has(extname(f).toLowerCase())) files.push(join(dir, f));
  }
}

let processed = 0, skipped = 0;
for (const file of files) {
  const name = basename(file, extname(file)).replace(/\s+/g, '-');
  const meta = await sharp(file).metadata();
  const srcW = meta.width ?? 0;
  for (const w of WIDTHS) {
    if (w > srcW) continue;
    const base = sharp(file).resize({ width: w, withoutEnlargement: true });
    const avifPath = join(DEST, `${name}-${w}.avif`);
    const webpPath = join(DEST, `${name}-${w}.webp`);
    await base.clone().avif({ quality: 55, effort: 4 }).toFile(avifPath);
    await base.clone().webp({ quality: 78 }).toFile(webpPath);
    processed += 2;
  }
  if (srcW < WIDTHS[0]) {
    const base = sharp(file);
    const avifPath = join(DEST, `${name}-orig.avif`);
    const webpPath = join(DEST, `${name}-orig.webp`);
    await base.clone().avif({ quality: 60, effort: 4 }).toFile(avifPath);
    await base.clone().webp({ quality: 82 }).toFile(webpPath);
    processed += 2;
    skipped += 1;
  }
}

console.log(`processed=${processed} variants from ${files.length} originals (small=${skipped})`);
