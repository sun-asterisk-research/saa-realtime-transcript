'use client';

import type { Section as SectionType, SubSection } from '../_content';
import { ImagePlaceholder } from './ImagePlaceholder';

interface SectionProps {
  section: SectionType;
}

function renderContent(content: string[], className?: string) {
  return content.map((paragraph, index) => {
    // Check if the paragraph contains bold markers **text**
    const parts = paragraph.split(/(\*\*[^*]+\*\*)/g);

    return (
      <p key={index} className={className || 'text-text-secondary leading-relaxed'}>
        {parts.map((part, partIndex) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={partIndex} className="font-semibold text-text-primary">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        })}
      </p>
    );
  });
}

function SubSectionComponent({ subsection }: { subsection: SubSection }) {
  return (
    <div id={subsection.id} className="scroll-mt-20">
      <h4 className="text-lg font-semibold text-text-primary mt-8 mb-4">
        {subsection.title}
      </h4>

      {subsection.content && (
        <div className="space-y-3">{renderContent(subsection.content)}</div>
      )}

      {subsection.image && (
        <ImagePlaceholder src={subsection.image.src} alt={subsection.image.alt} />
      )}

      {subsection.note && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 my-4 rounded-r-lg">
          <p className="text-amber-800 text-sm">{subsection.note}</p>
        </div>
      )}

      {subsection.tips && subsection.tips.length > 0 && (
        <div className="bg-plum-50 border border-plum-200 rounded-lg p-4 my-4">
          <h5 className="text-sm font-semibold text-plum-700 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            Tips
          </h5>
          <ul className="space-y-1">
            {subsection.tips.map((tip, index) => (
              <li key={index} className="text-sm text-plum-800 flex items-start gap-2">
                <span className="text-plum-500 mt-1">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function Section({ section }: SectionProps) {
  return (
    <section id={section.id} className="scroll-mt-20 mb-16">
      <h2 className="text-2xl font-bold text-text-primary mb-2">{section.title}</h2>

      {section.description && (
        <p className="text-text-muted mb-6">{section.description}</p>
      )}

      {section.content && (
        <div className="space-y-3">{renderContent(section.content)}</div>
      )}

      {section.image && (
        <ImagePlaceholder src={section.image.src} alt={section.image.alt} />
      )}

      {section.note && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 my-4 rounded-r-lg">
          <p className="text-amber-800 text-sm font-medium">{section.note}</p>
        </div>
      )}

      {section.tips && section.tips.length > 0 && (
        <div className="bg-plum-50 border border-plum-200 rounded-lg p-4 my-4">
          <h5 className="text-sm font-semibold text-plum-700 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            Tips
          </h5>
          <ul className="space-y-1">
            {section.tips.map((tip, index) => (
              <li key={index} className="text-sm text-plum-800 flex items-start gap-2">
                <span className="text-plum-500 mt-1">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {section.subsections && section.subsections.length > 0 && (
        <div className="mt-6">
          {section.subsections.map((subsection) => (
            <SubSectionComponent key={subsection.id} subsection={subsection} />
          ))}
        </div>
      )}
    </section>
  );
}
