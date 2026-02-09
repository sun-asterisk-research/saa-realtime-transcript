'use client';

import type { Participant } from '@/lib/supabase/types';

interface ParticipantsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  currentParticipantId: string;
  isHost: boolean;
  onInvite: () => void;
}

export function ParticipantsPanel({
  isOpen,
  onClose,
  participants,
  currentParticipantId,
  isHost,
  onInvite,
}: ParticipantsPanelProps) {
  if (!isOpen) return null;

  const activeParticipants = participants.filter((p) => !p.left_at);
  const leftParticipants = participants.filter((p) => p.left_at);

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
          <h2 className="font-semibold text-gray-900">
            Participants ({activeParticipants.length})
          </h2>
          <div className="flex items-center gap-2">
            {isHost && (
              <button
                type="button"
                onClick={onInvite}
                className="text-sm text-plum-600 hover:text-plum-700 font-medium cursor-pointer"
              >
                + Invite
              </button>
            )}
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
        </div>

        {/* Participant list */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Active participants */}
          <div className="space-y-2">
            {activeParticipants.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50"
              >
                <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {p.name}
                    </span>
                    {p.is_host && (
                      <span className="text-xs text-plum-600 font-medium">(Host)</span>
                    )}
                    {p.id === currentParticipantId && (
                      <span className="text-xs text-gray-500">(You)</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Left participants */}
          {leftParticipants.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">
                Left
              </p>
              <div className="space-y-2">
                {leftParticipants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg"
                  >
                    <div className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
                    <span className="text-sm text-gray-400 truncate">
                      {p.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
