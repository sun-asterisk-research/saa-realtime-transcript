'use client';

import { useEffect, useState } from 'react';
import type { Section } from '../_content';

interface TableOfContentsProps {
  title: string;
  sections: Section[];
}

export function TableOfContents({ title, sections }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0px -80% 0px',
        threshold: 0,
      }
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);

      section.subsections?.forEach((subsection) => {
        const subElement = document.getElementById(subsection.id);
        if (subElement) observer.observe(subElement);
      });
    });

    return () => observer.disconnect();
  }, [sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <nav className="sticky top-20">
      <h3 className="text-sm font-semibold text-text-primary mb-4">{title}</h3>
      <ul className="space-y-1">
        {sections.map((section) => (
          <li key={section.id}>
            <button
              type="button"
              onClick={() => scrollToSection(section.id)}
              className={`w-full text-left text-sm py-1.5 px-3 rounded-md transition-colors ${
                activeId === section.id
                  ? 'bg-plum-100 text-plum-700 font-medium'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
              }`}
            >
              {section.title}
            </button>
            {section.subsections && section.subsections.length > 0 && (
              <ul className="ml-4 mt-1 space-y-1">
                {section.subsections.map((subsection) => (
                  <li key={subsection.id}>
                    <button
                      type="button"
                      onClick={() => scrollToSection(subsection.id)}
                      className={`w-full text-left text-xs py-1 px-3 rounded-md transition-colors ${
                        activeId === subsection.id
                          ? 'bg-plum-50 text-plum-600 font-medium'
                          : 'text-text-muted hover:text-text-secondary hover:bg-surface-secondary'
                      }`}
                    >
                      {subsection.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
