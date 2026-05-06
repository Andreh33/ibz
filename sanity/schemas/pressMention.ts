import { defineField, defineType } from 'sanity';

export const pressMention = defineType({
  name: 'pressMention',
  title: 'Press mention',
  type: 'document',
  fields: [
    defineField({ name: 'outlet', title: 'Outlet', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'quoteI18n', title: 'Quote', type: 'i18nText' }),
    defineField({ name: 'link', title: 'Link', type: 'url' }),
    defineField({ name: 'date', title: 'Date', type: 'date' }),
  ],
  preview: { select: { title: 'outlet', subtitle: 'date' } },
});
