'use client';

import { Select } from '@/components/select';
import type { Session } from '@/lib/supabase/types';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session;
  displayLanguage: string;
  onDisplayLanguageChange: (language: string) => void;
  isBilingualMode: boolean;
}

export function SettingsPanel({
  isOpen,
  onClose,
  session,
  displayLanguage,
  onDisplayLanguageChange,
  isBilingualMode,
}: SettingsPanelProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Session Info */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Session Info</h3>
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div>
                <span className="text-xs text-gray-500">Title</span>
                <p className="text-sm text-gray-900">{session.title || 'Untitled'}</p>
              </div>
              {session.description && (
                <div>
                  <span className="text-xs text-gray-500">Description</span>
                  <p className="text-sm text-gray-900">{session.description}</p>
                </div>
              )}
              <div>
                <span className="text-xs text-gray-500">Mode</span>
                <p className="text-sm text-gray-900">
                  {session.mode === 'one_way'
                    ? `One-way → ${session.target_language?.toUpperCase()}`
                    : `Two-way (${session.language_a?.toUpperCase()} ↔ ${session.language_b?.toUpperCase()})`}
                </p>
              </div>
              {session.enable_speaker_diarization && (
                <div>
                  <span className="text-xs text-gray-500">Speaker Diarization</span>
                  <p className="text-sm text-emerald-600">Enabled</p>
                </div>
              )}
            </div>
          </div>

          {/* Display Language */}
          {session.mode === 'two_way' && session.language_a && session.language_b && !isBilingualMode && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Display Language</h3>
              <Select
                value={displayLanguage}
                onChange={(e) => onDisplayLanguageChange(e.target.value)}
                className="text-sm"
              >
                <option value={session.language_a}>{session.language_a.toUpperCase()}</option>
                <option value={session.language_b}>{session.language_b.toUpperCase()}</option>
              </Select>
              <p className="text-xs text-gray-500 mt-1.5">
                All transcripts will be shown in this language
              </p>
            </div>
          )}

          {isBilingualMode && (
            <div className="bg-amber-50 rounded-lg p-3 mb-6">
              <p className="text-sm text-amber-700">
                Display language setting is disabled while bilingual mode is active.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
