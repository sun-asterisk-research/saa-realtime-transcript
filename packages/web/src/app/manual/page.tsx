'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getContent, type Locale } from './_content';
import { LanguageSelect, Section, TableOfContents } from './_components';

const STORAGE_KEY = 'manual-locale';

export default function ManualPage() {
  const [locale, setLocale] = useState<Locale>('en');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load saved locale from localStorage
    const savedLocale = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (savedLocale && ['en', 'ja', 'vi'].includes(savedLocale)) {
      setLocale(savedLocale);
    }
    setIsLoaded(true);
  }, []);

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
  };

  const content = getContent(locale);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <span className="text-sm font-medium">Back to Home</span>
              </Link>
              <div className="h-6 w-px bg-border-primary" />
              <h1 className="text-lg font-semibold text-text-primary">{content.title}</h1>
            </div>
            <LanguageSelect value={locale} onChange={handleLocaleChange} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-12">
          {/* Sidebar - Table of Contents */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <TableOfContents
                title={content.tableOfContentsTitle}
                sections={content.sections}
              />
            </div>
          </aside>

          {/* Content */}
          <div className="min-w-0">
            {/* Hero */}
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-text-primary mb-4">{content.title}</h1>
              <p className="text-lg text-text-secondary">{content.subtitle}</p>
              <p className="text-sm text-text-muted mt-2">
                Last updated: {content.lastUpdated}
              </p>
            </div>

            {/* Mobile Table of Contents */}
            <div className="lg:hidden mb-8">
              <details className="bg-surface-secondary rounded-lg">
                <summary className="px-4 py-3 cursor-pointer text-sm font-semibold text-text-primary">
                  {content.tableOfContentsTitle}
                </summary>
                <div className="px-4 pb-4">
                  <ul className="space-y-2">
                    {content.sections.map((section) => (
                      <li key={section.id}>
                        <a
                          href={`#${section.id}`}
                          className="text-sm text-text-secondary hover:text-plum-600 transition-colors"
                        >
                          {section.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            </div>

            {/* Sections */}
            {content.sections.map((section) => (
              <Section key={section.id} section={section} />
            ))}

            {/* Footer */}
            <footer className="border-t border-border-primary pt-8 mt-16">
              <p className="text-text-muted text-sm">
                {content.footer.helpText}{' '}
                <a
                  href={`mailto:${content.footer.contactLink}`}
                  className="text-plum-600 hover:text-plum-700 underline"
                >
                  {content.footer.contactLink}
                </a>
              </p>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}
