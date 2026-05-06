// Converts sanity/seed/menu.json (readable source-of-truth) into
// sanity/seed/menu.ndjson (one Sanity doc per line, with _type + _id +
// resolved references) so `sanity dataset import` can ingest it.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(ROOT, 'sanity/seed/menu.json');
const OUT = resolve(ROOT, 'sanity/seed/menu.ndjson');

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const seed = JSON.parse(await readFile(SRC, 'utf8'));
const lines = [];

for (const s of seed.sections) {
  lines.push(JSON.stringify({
    _type: 'menuSection',
    _id: `section-${s.id}`,
    titleI18n: { _type: 'i18nString', ...s.titleI18n },
    slug: { _type: 'slug', current: s.id },
    order: s.order ?? 0,
  }));
}

for (const item of seed.items) {
  const enTitle = item.titleI18n.en ?? '';
  const id = `item-${slug(enTitle).slice(0, 40)}`;
  lines.push(JSON.stringify({
    _type: 'menuItem',
    _id: id,
    section: { _type: 'reference', _ref: `section-${item.section}` },
    titleI18n: { _type: 'i18nString', ...item.titleI18n },
    descriptionI18n: item.descriptionI18n
      ? { _type: 'i18nText', ...item.descriptionI18n }
      : undefined,
    price: item.price,
    priceLabel: item.priceLabel,
    isNew: item.isNew ?? false,
    isVegan: item.isVegan ?? false,
    isVegetarian: item.isVegetarian ?? false,
    isGlutenFree: item.isGlutenFree ?? false,
  }));
}

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, lines.join('\n') + '\n', 'utf8');
console.log(`wrote ${OUT} (${lines.length} docs: ${seed.sections.length} sections + ${seed.items.length} items)`);
