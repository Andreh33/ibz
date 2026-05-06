import { defineField, defineType } from 'sanity';

export const menuSection = defineType({
  name: 'menuSection',
  title: 'Menu section',
  type: 'document',
  fields: [
    defineField({ name: 'titleI18n', title: 'Title', type: 'i18nString', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: (doc) => (doc.titleI18n as { en?: string } | undefined)?.en ?? '' },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'order', title: 'Order', type: 'number', initialValue: 0 }),
  ],
  preview: {
    select: { title: 'titleI18n.en', order: 'order' },
    prepare: ({ title, order }) => ({ title: title ?? '(untitled)', subtitle: `order: ${order ?? 0}` }),
  },
});
