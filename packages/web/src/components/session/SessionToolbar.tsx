'use client';

import { useState, useRef, useEffect } from 'react';
import type { Context } from '@soniox/speech-to-text-web';

interface SessionToolbarProps {
  // Recording state
  isRecording: boolean;
  isPaused?: boolean;
  isScheduled?: boolean;
  onStartStop: () => void;

  // Microphone
  audioDevices: MediaDeviceInfo[];
  selectedMic: string;
  onMicChange: (deviceId: string) => void;

  // Tab Audio
  isTabAudioSupported: boolean;
  tabAudioStream: MediaStream | null;
  tabName: string;
  onStartTabAudio: () => void;
  onStopTabAudio: () => void;

  // Bilingual mode
  isBilingualMode: boolean;
  onToggleBilingual: () => void;

  // Context
  contextCount: number;
  onOpenContext: () => void;

  // Participants
  participantCount: number;
  onOpenParticipants: () => void;

  // Session actions
  isHost: boolean;
  onLeave: () => void;
  onEndSession: () => void;
}

export function SessionToolbar({
  isRecording,
  isPaused,
  isScheduled,
  onStartStop,
  audioDevices,
  selectedMic,
  onMicChange,
  isTabAudioSupported,
  tabAudioStream,
  tabName,
  onStartTabAudio,
  onStopTabAudio,
  isBilingualMode,
  onToggleBilingual,
  contextCount,
  onOpenContext,
  participantCount,
  onOpenParticipants,
  isHost,
  onLeave,
  onEndSession,
}: SessionToolbarProps) {
  const [showMicMenu, setShowMicMenu] = useState(false);
  const micMenuRef = useRef<HTMLDivElement>(null);

  // Close mic menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (micMenuRef.current && !micMenuRef.current.contains(event.target as Node)) {
        setShowMicMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="h-16 bg-white border-t border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
      {/* Left: Audio controls */}
      <div className="flex items-center gap-2">
        {/* Microphone with dropdown */}
        <div className="relative" ref={micMenuRef}>
          <button
            type="button"
            onClick={() => setShowMicMenu(!showMicMenu)}
            disabled={isRecording || isScheduled}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
              isRecording
                ? 'bg-red-50 text-red-600'
                : 'hover:bg-gray-100 text-gray-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label="Select microphone"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Mic dropdown menu */}
          {showMicMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Select Microphone
              </div>
              {audioDevices.map((device) => (
                <button
                  key={device.deviceId}
                  type="button"
                  onClick={() => {
                    onMicChange(device.deviceId);
                    setShowMicMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2 ${
                    selectedMic === device.deviceId ? 'bg-plum-50 text-plum-700' : 'text-gray-700'
                  }`}
                >
                  {selectedMic === device.deviceId && (
                    <svg className="w-4 h-4 text-plum-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  <span className={selectedMic === device.deviceId ? '' : 'ml-6'}>
                    {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tab Audio */}
        {isTabAudioSupported && (
          <button
            type="button"
            onClick={tabAudioStream ? onStopTabAudio : onStartTabAudio}
            disabled={isRecording || isScheduled}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
              tabAudioStream
                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'hover:bg-gray-100 text-gray-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={tabAudioStream ? `Recording: ${tabName}` : 'Record from browser tab'}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium">Tab Audio</span>
            {tabAudioStream && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        )}

        {/* Bilingual Toggle */}
        <button
          type="button"
          onClick={onToggleBilingual}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
            isBilingualMode
              ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          title={isBilingualMode ? 'Showing both languages' : 'Show both languages'}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          <span className="text-sm font-medium">Bilingual</span>
        </button>

        {/* Context */}
        <button
          type="button"
          onClick={onOpenContext}
          disabled={isRecording || isScheduled}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title="Manage context sets"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm font-medium">Context:</span>
          <span className={`text-sm font-semibold px-1.5 py-0.5 rounded ${
            contextCount > 0 ? 'bg-plum-100 text-plum-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {contextCount}
          </span>
        </button>

        {/* Participants */}
        <button
          type="button"
          onClick={onOpenParticipants}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
          title="View participants"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <span className="text-sm font-medium">Participants:</span>
          <span className="text-sm font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
            {participantCount}
          </span>
        </button>
      </div>

      {/* Center: Start/Stop button */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <button
          type="button"
          onClick={onStartStop}
          disabled={isScheduled}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl active:scale-95 ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-emerald-500 hover:bg-emerald-600'
          } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg`}
        >
          {isRecording ? (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              <span>Stop</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span>Start</span>
            </>
          )}
        </button>
      </div>

      {/* Right: Session actions */}
      <div className="flex items-center gap-2">
        {/* Leave button */}
        <button
          type="button"
          onClick={onLeave}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="text-sm font-medium">Leave</span>
        </button>

        {/* End Session (host only) */}
        {isHost && (
          <button
            type="button"
            onClick={onEndSession}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
          >
            <span className="text-sm font-medium">End Session</span>
          </button>
        )}
      </div>
    </div>
  );
}
