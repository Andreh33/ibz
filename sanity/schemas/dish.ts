import { defineField, defineType } from 'sanity';

export const dish = defineType({
  name: 'dish',
  title: 'Signature dish',
  type: 'document',
  fields: [
    defineField({ name: 'titleI18n', title: 'Title', type: 'i18nString', validation: (r) => r.required() }),
    defineField({ name: 'descriptionI18n', title: 'Description', type: 'i18nText' }),
    defineField({ name: 'image', title: 'Plated photo', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'price', title: 'Price (EUR)', type: 'number' }),
    defineField({ name: 'signature', title: 'Signature dish', type: 'boolean', initialValue: false }),
  ],
  preview: { select: { title: 'titleI18n.en', media: 'image' } },
});
