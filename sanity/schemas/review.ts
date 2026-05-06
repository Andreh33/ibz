import { defineField, defineType } from 'sanity';

export const review = defineType({
  name: 'review',
  title: 'Guest review',
  type: 'document',
  fields: [
    defineField({ name: 'author', title: 'Author', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'source', title: 'Source', type: 'string', description: 'Google, TripAdvisor, in-house, etc.' }),
    defineField({ name: 'bodyI18n', title: 'Body', type: 'i18nText', validation: (r) => r.required() }),
    defineField({ name: 'rating', title: 'Rating (1–5)', type: 'number', validation: (r) => r.min(1).max(5) }),
    defineField({
      name: 'locale',
      title: 'Original locale',
      type: 'string',
      options: { list: ['en', 'es', 'de', 'fr', 'nl', 'it'] },
    }),
  ],
  preview: { select: { title: 'author', subtitle: 'source' } },
});
