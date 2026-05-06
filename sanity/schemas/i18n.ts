import { defineField, defineType } from 'sanity';

const LOCALES = ['en', 'es', 'de', 'fr', 'nl', 'it'] as const;

export const i18nString = defineType({
  name: 'i18nString',
  title: 'i18n String',
  type: 'object',
  fields: LOCALES.map((l) =>
    defineField({ name: l, type: 'string', title: l.toUpperCase() }),
  ),
});

export const i18nText = defineType({
  name: 'i18nText',
  title: 'i18n Text',
  type: 'object',
  fields: LOCALES.map((l) =>
    defineField({ name: l, type: 'text', title: l.toUpperCase(), rows: 3 }),
  ),
});

export const i18nBlock = defineType({
  name: 'i18nBlock',
  title: 'i18n Rich Text',
  type: 'object',
  fields: LOCALES.map((l) =>
    defineField({
      name: l,
      title: l.toUpperCase(),
      type: 'array',
      of: [{ type: 'block' }],
    }),
  ),
});
