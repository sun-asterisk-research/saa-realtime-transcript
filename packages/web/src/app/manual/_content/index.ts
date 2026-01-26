import { enContent } from './en';
import { jaContent } from './ja';
import { viContent } from './vi';
import type { Locale, ManualContent } from './types';

export * from './types';

export const contentMap: Record<Locale, ManualContent> = {
  en: enContent,
  ja: jaContent,
  vi: viContent,
};

export function getContent(locale: Locale): ManualContent {
  return contentMap[locale];
}
