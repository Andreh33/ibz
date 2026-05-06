import { defineField, defineType } from 'sanity';

export const galleryImage = defineType({
  name: 'galleryImage',
  title: 'Gallery image',
  type: 'document',
  fields: [
    defineField({ name: 'image', title: 'Image', type: 'image', options: { hotspot: true }, validation: (r) => r.required() }),
    defineField({ name: 'captionI18n', title: 'Caption', type: 'i18nString' }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: { list: ['food', 'venue', 'family', 'cove', 'kitchen', 'other'] },
    }),
  ],
  preview: { select: { title: 'captionI18n.en', subtitle: 'category', media: 'image' } },
});
