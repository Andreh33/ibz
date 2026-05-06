// Parses _source/html/menu-{locale}.html into sanity/seed/menu.json.
//
// Status: stub. The live theboathouseibiza.com /menu/ uses Elementor blocks
// without semantic class names, so the structured extraction is pending.
// For step 2, sanity/seed/menu.json was hand-seeded with the canonical
// signature dishes from CLAUDE.md §12. Refine this parser in step 10.

import { load } from 'cheerio';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LOCALES = ['en', 'es', 'de', 'fr', 'nl', 'it'];

for (const locale of LOCALES) {
  const file = resolve(ROOT, `_source/html/menu${locale === 'en' ? '-' : `-${locale}`}.html`);
  const html = await readFile(file, 'utf8');
  const $ = load(html);
  const prices = new Set();
  $('*').each((_, el) => {
    const text = $(el).text();
    const m = text.match(/€\s?\d+[.,]\d{2}/g);
    if (m) m.forEach((p) => prices.add(p.trim()));
  });
  console.log(`[${locale}] ${prices.size} unique price tokens`);
}

console.log('\nstub — update sanity/seed/menu.json by hand for now');
