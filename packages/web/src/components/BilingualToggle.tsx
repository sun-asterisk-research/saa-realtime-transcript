'use client';

import { useBilingualMode } from '@/contexts/BilingualModeContext';

export function BilingualToggle() {
  const { isBilingualMode, toggleBilingualMode } = useBilingualMode();

  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id="bilingual-mode"
        checked={isBilingualMode}
        onChange={toggleBilingualMode}
        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
      />
      <label htmlFor="bilingual-mode" className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
        Show Both Languages
      </label>
    </div>
  );
}
