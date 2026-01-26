'use client';

import { LOCALE_OPTIONS, type Locale } from '../_content';

interface LanguageSelectProps {
  value: Locale;
  onChange: (locale: Locale) => void;
}

export function LanguageSelect({ value, onChange }: LanguageSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <svg
        className="w-5 h-5 text-text-muted"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
        />
      </svg>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Locale)}
        className="bg-white border border-border-primary rounded-lg px-3 py-2 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-plum-500 focus:border-plum-500 cursor-pointer hover:border-plum-400 transition-colors"
      >
        {LOCALE_OPTIONS.map((option) => (
          <option key={option.code} value={option.code}>
            {option.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
}
