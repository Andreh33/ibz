import { defineField, defineType } from 'sanity';

export const menuItem = defineType({
  name: 'menuItem',
  title: 'Menu item',
  type: 'document',
  fields: [
    defineField({
      name: 'section',
      title: 'Section',
      type: 'reference',
      to: [{ type: 'menuSection' }],
      validation: (r) => r.required(),
    }),
    defineField({ name: 'titleI18n', title: 'Title', type: 'i18nString', validation: (r) => r.required() }),
    defineField({ name: 'descriptionI18n', title: 'Description', type: 'i18nText' }),
    defineField({ name: 'price', title: 'Price (EUR)', type: 'number' }),
    // TODO Phase 10 — convert priceLabel to `i18nString` so "/ person, min 2", "for 1 kg",
    // "for 1.2 kg" etc. translate per locale. Currently a flat string for scaffolding speed.
    defineField({ name: 'priceLabel', title: 'Price label', type: 'string', description: 'Eg "/ person" or "for 1.2 kg"' }),
    defineField({ name: 'isNew', title: 'New', type: 'boolean', initialValue: false }),
    defineField({ name: 'isVegan', title: 'Vegan', type: 'boolean', initialValue: false }),
    defineField({ name: 'isVegetarian', title: 'Vegetarian', type: 'boolean', initialValue: false }),
    defineField({ name: 'isGlutenFree', title: 'Gluten-free', type: 'boolean', initialValue: false }),
    defineField({ name: 'image', title: 'Image', type: 'image', options: { hotspot: true } }),
  ],
  preview: {
    select: { title: 'titleI18n.en', price: 'price' },
    prepare: ({ title, price }) => ({ title: title ?? '(untitled)', subtitle: price ? `€${price}` : undefined }),
  },
});
