import type { SchemaTypeDefinition } from 'sanity';
import { chef } from './chef';
import { dish } from './dish';
import { event } from './event';
import { galleryImage } from './galleryImage';
import { i18nString, i18nText, i18nBlock } from './i18n';
import { menuItem } from './menuItem';
import { menuSection } from './menuSection';
import { pressMention } from './pressMention';
import { review } from './review';

export const schemaTypes: SchemaTypeDefinition[] = [
  i18nString,
  i18nText,
  i18nBlock,
  menuSection,
  menuItem,
  dish,
  review,
  pressMention,
  event,
  galleryImage,
  chef,
];
