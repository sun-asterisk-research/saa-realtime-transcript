export type Locale = 'en' | 'ja' | 'vi';

export interface ImageInfo {
  src: string;
  alt: string;
}

export interface SubSection {
  id: string;
  title: string;
  content: string[];
  image?: ImageInfo;
  note?: string;
  tips?: string[];
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  content?: string[];
  image?: ImageInfo;
  note?: string;
  tips?: string[];
  subsections?: SubSection[];
}

export interface ManualContent {
  locale: Locale;
  title: string;
  subtitle: string;
  lastUpdated: string;
  tableOfContentsTitle: string;
  sections: Section[];
  footer: {
    helpText: string;
    contactLink: string;
  };
}

export interface LocaleOption {
  code: Locale;
  name: string;
  nativeName: string;
}

export const LOCALE_OPTIONS: LocaleOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
];
