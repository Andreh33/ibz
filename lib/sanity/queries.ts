import { defineQuery } from 'next-sanity';

export const menuSectionsQuery = defineQuery(`
  *[_type == "menuSection"] | order(order asc) {
    _id,
    titleI18n,
    "slug": slug.current,
    order
  }
`);

export const menuItemsBySectionQuery = defineQuery(`
  *[_type == "menuItem" && section._ref == $sectionId] {
    _id,
    titleI18n,
    descriptionI18n,
    price,
    priceLabel,
    isNew,
    isVegan,
    isVegetarian,
    isGlutenFree,
    "image": image.asset->url
  }
`);

export const reviewsQuery = defineQuery(`
  *[_type == "review"] | order(_createdAt desc)[0...3] {
    _id, author, source, bodyI18n, rating, locale
  }
`);

export const allDishesQuery = defineQuery(`
  *[_type == "menuItem"] | order(price asc) {
    _id,
    titleI18n,
    price,
    priceLabel
  }
`);
