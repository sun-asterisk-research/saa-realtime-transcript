'use client';

import { useBilingualMode } from '@/contexts/BilingualModeContext';

export function BilingualToggle() {
  const { isBilingualMode, toggleBilingualMode } = useBilingualMode();

  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className="relative">
        <input
          type="checkbox"
          id="bilingual-mode"
          checked={isBilingualMode}
          onChange={toggleBilingualMode}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-plum-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-plum-500 transition-colors" />
      </div>
      <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors font-medium">
        Show Both Languages
      </span>
    </label>
  );
}
