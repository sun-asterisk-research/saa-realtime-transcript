'use client';

import Link from 'next/link';
import type { Session } from '@/lib/supabase/types';

interface SessionHeaderProps {
  session: Session;
  code: string;
  participantCount: number;
  onOpenSettings?: () => void;
  onOpenParticipants?: () => void;
}

export function SessionHeader({
  session,
  code,
  participantCount,
  onOpenSettings,
  onOpenParticipants,
}: SessionHeaderProps) {
  const modeLabel = session.mode === 'one_way'
    ? `One-way → ${session.target_language?.toUpperCase()}`
    : `${session.language_a?.toUpperCase()} ↔ ${session.language_b?.toUpperCase()}`;

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
      {/* Left: Back + Title + Mode */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/"
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Back to home"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-gray-900 truncate">
              {session.title || `Session`}
            </h1>
            <span className="text-sm text-amber-600 font-medium flex-shrink-0">
              {modeLabel}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Code: {code}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Participants */}
        <button
          type="button"
          onClick={onOpenParticipants}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="View participants"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">{participantCount}</span>
        </button>

        {/* Settings */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Settings"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Display View */}
        <Link
          href={`/session/${code}/display`}
          target="_blank"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          <span className="text-sm font-medium text-gray-700">Display</span>
        </Link>
      </div>
    </header>
  );
}
