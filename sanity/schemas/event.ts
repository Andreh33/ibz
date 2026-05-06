import { defineField, defineType } from 'sanity';

export const event = defineType({
  name: 'event',
  title: 'Event',
  type: 'document',
  fields: [
    defineField({ name: 'titleI18n', title: 'Title', type: 'i18nString', validation: (r) => r.required() }),
    defineField({ name: 'date', title: 'Date', type: 'datetime', validation: (r) => r.required() }),
    defineField({ name: 'descriptionI18n', title: 'Description', type: 'i18nText' }),
    defineField({ name: 'image', title: 'Image', type: 'image', options: { hotspot: true } }),
  ],
  preview: { select: { title: 'titleI18n.en', subtitle: 'date', media: 'image' } },
});
