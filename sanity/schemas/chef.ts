import { defineField, defineType } from 'sanity';

export const chef = defineType({
  name: 'chef',
  title: 'Chef',
  type: 'document',
  fields: [
    defineField({ name: 'nameI18n', title: 'Name', type: 'i18nString', validation: (r) => r.required() }),
    defineField({ name: 'bioI18n', title: 'Biography', type: 'i18nBlock' }),
    defineField({ name: 'portrait', title: 'Portrait', type: 'image', options: { hotspot: true } }),
  ],
  preview: { select: { title: 'nameI18n.en', media: 'portrait' } },
});
