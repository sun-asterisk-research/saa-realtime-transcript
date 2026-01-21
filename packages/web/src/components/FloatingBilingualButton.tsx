'use client';

import { useBilingualMode } from '@/contexts/BilingualModeContext';
import { cn } from '@/lib/utils';

export function FloatingBilingualButton() {
  const { isBilingualMode, toggleBilingualMode } = useBilingualMode();

  return (
    <button
      onClick={toggleBilingualMode}
      className={cn(
        'fixed bottom-4 right-4 z-50',
        'w-14 h-14 rounded-full shadow-lg',
        'flex items-center justify-center',
        'transition-all duration-200 hover:scale-110',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        isBilingualMode
          ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white'
          : 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500 text-white'
      )}
      title={isBilingualMode ? 'Disable Bilingual Display' : 'Enable Bilingual Display'}
      aria-label="Toggle Bilingual Display"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
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
    </button>
  );
}
