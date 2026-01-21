'use client';

import { Button } from '@/components/button';
import { BilingualToggle } from '@/components/BilingualToggle';
import { FloatingBilingualButton } from '@/components/FloatingBilingualButton';
import { BilingualTranscriptDisplay } from '@/components/BilingualTranscriptDisplay';
import { useBilingualMode } from '@/contexts/BilingualModeContext';
import useTranscribe from '@/lib/useTranscribe';
import getAPIKey from '@/lib/utils';
import { isActiveState, type Context } from '@soniox/speech-to-text-web';
import { useCallback, useEffect, useRef, useState } from 'react';

// Context for Sun Asterisk Vietnam
const sunAsteriskContext: Context = {
  general: [
    { key: 'domain', value: 'Technology' },
    { key: 'topic', value: 'Software development and IT consulting' },
    { key: 'organization', value: 'Sun Asterisk Vietnam' },
    { key: 'country', value: 'Vietnam' },
    { key: 'industry', value: 'Digital transformation and software outsourcing' },
  ],
  text: 'Sun Asterisk là công ty công nghệ hàng đầu tại Việt Nam, chuyên về phát triển phần mềm, chuyển đổi số và tư vấn IT. Công ty có trụ sở chính tại Hà Nội và các văn phòng tại TP. Hồ Chí Minh, Đà Nẵng. Sun Asterisk cung cấp các dịch vụ như phát triển ứng dụng web, mobile, AI/ML, và các giải pháp cloud. Công ty hợp tác với nhiều đối tác Nhật Bản và quốc tế.',
  terms: [
    'Sun Asterisk',
    'Sun*',
    'Awesome Ars Academia',
    'xLab',
    'Viblo',
    'Hà Nội',
    'TP. Hồ Chí Minh',
    'Đà Nẵng',
    'chuyển đổi số',
    'digital transformation',
    'offshore development',
    'outsourcing',
    'agile',
    'scrum',
    'DevOps',
    'CI/CD',
    'microservices',
    'cloud computing',
    'AWS',
    'Azure',
    'GCP',
    'Morpheus',
    'Mormorph',
    'Agentic Coding',
    'Digital Creative Studio',
    'release'
  ],
  translation_terms: [
    { source: 'Sun Asterisk', target: 'Sun Asterisk' },
    { source: 'Sun*', target: 'Sun Asterisk' },
    { source: 'chuyển đổi số', target: 'digital transformation' },
    { source: 'phát triển phần mềm', target: 'software development' },
    { source: 'Hà Nội', target: 'Hanoi' },
    { source: 'TP. Hồ Chí Minh', target: 'Ho Chi Minh City' },
    { source: 'Đà Nẵng', target: 'Da Nang' },
    { source: 'công nghệ thông tin', target: 'information technology' },
    { source: 'trí tuệ nhân tạo', target: 'artificial intelligence' },
    { source: 'học máy', target: 'machine learning' },
    { source: 'mô môp', target: 'MoMorph' },
    { source: 'mo phe us', target: 'Morpheus' },
    { source: 'release', target: 'release' },

  ],
};

const TARGET_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'vi', label: 'Vietnamese' },
  { code: 'ja', label: 'Japanese' },
];

export default function LiveTranscript() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);
  const translationScrollRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<string>('en');
  const { isBilingualMode } = useBilingualMode();

  const { state, finalTokens, nonFinalTokens, startTranscription, stopTranscription } = useTranscribe({
    apiKey: getAPIKey,
    translationConfig: {
      type: 'one_way',
      target_language: targetLanguage,
    },
    context: sunAsteriskContext,
  });

  const targetLanguageLabel = TARGET_LANGUAGES.find((l) => l.code === targetLanguage)?.label || 'English';

  // Get available devices and auto-start camera
  useEffect(() => {
    async function getDevices() {
      try {
        // Request permission first
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

        // Show default camera immediately
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setVideoStream(stream);

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        const audioInputs = devices.filter((d) => d.kind === 'audioinput');

        setVideoDevices(videoInputs);
        setAudioDevices(audioInputs);

        // Auto-select first device
        if (videoInputs.length > 0) {
          setSelectedVideoDevice(videoInputs[0].deviceId);
        }
        if (audioInputs.length > 0) {
          setSelectedAudioDevice(audioInputs[0].deviceId);
        }
      } catch (err) {
        console.error('Error getting devices:', err);
      }
    }
    getDevices();
  }, []);

  // Start video preview when device is selected
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    async function startVideoPreview() {
      try {
        // Stop previous stream
        if (videoStream) {
          videoStream.getTracks().forEach((track) => track.stop());
        }

        const constraints: MediaStreamConstraints = {
          video: selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice } } : true,
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        currentStream = stream;
        setVideoStream(stream);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error starting video:', err);
      }
    }

    if (selectedVideoDevice) {
      startVideoPreview();
    }

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVideoDevice]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!transcriptRef.current) return;

    if (!document.fullscreenElement) {
      transcriptRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
    if (sourceRef.current) {
      sourceRef.current.scrollTop = sourceRef.current.scrollHeight;
    }
    if (translationScrollRef.current) {
      translationScrollRef.current.scrollTop = translationScrollRef.current.scrollHeight;
    }
  }, [finalTokens, nonFinalTokens]);

  // Separate tokens by translation status
  const allTokens = [...finalTokens, ...nonFinalTokens];
  const transcriptionTokens = allTokens.filter((token) => token.translation_status !== 'translation');
  const translationTokens = allTokens.filter((token) => token.translation_status === 'translation');

  return (
    <main className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-plum-600 to-plum-800 text-white py-4 px-6 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sun Asterisk</h1>
            <p className="text-sm text-plum-200">SAA 2025 Live Transcript</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isActiveState(state) ? 'bg-green-400 animate-pulse' : 'bg-white/40'}`} />
            <span className="text-sm text-plum-100">{isActiveState(state) ? 'Live' : 'Ready'}</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - 30% */}
        <div className="w-[30%] border-r border-plum-100 p-5 flex flex-col gap-5 bg-surface-light">
          {/* Video preview */}
          <div className="aspect-video bg-plum-900 rounded-xl overflow-hidden shadow-lg">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          </div>

          {/* Settings */}
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-text-primary flex items-center gap-2">
              <svg className="w-5 h-5 text-plum-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </h3>

            {/* Camera select */}
            <div>
              <label className="block text-sm text-text-secondary mb-1.5 font-medium">Camera</label>
              <select
                value={selectedVideoDevice}
                onChange={(e) => setSelectedVideoDevice(e.target.value)}
                className="w-full border border-plum-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:border-plum-500 focus:ring-2 focus:ring-plum-500/20 focus:outline-none transition-all">
                <option value="">Select camera...</option>
                {videoDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Microphone select */}
            <div>
              <label className="block text-sm text-text-secondary mb-1.5 font-medium">Microphone</label>
              <select
                value={selectedAudioDevice}
                onChange={(e) => setSelectedAudioDevice(e.target.value)}
                className="w-full border border-plum-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:border-plum-500 focus:ring-2 focus:ring-plum-500/20 focus:outline-none transition-all">
                <option value="">Select microphone...</option>
                {audioDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Language select */}
            <div>
              <label className="block text-sm text-text-secondary mb-1.5 font-medium">Target Language</label>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                disabled={isActiveState(state)}
                className="w-full border border-plum-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:border-plum-500 focus:ring-2 focus:ring-plum-500/20 focus:outline-none transition-all disabled:bg-surface-muted disabled:cursor-not-allowed">
                {TARGET_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Bilingual Mode Toggle */}
            <BilingualToggle />

            {/* Status */}
            <div className="p-4 bg-white rounded-xl border border-plum-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isActiveState(state) ? 'bg-green-500 animate-pulse-glow' : 'bg-gray-300'
                  }`}
                />
                <span className="text-sm text-text-primary font-medium">
                  {state === 'Init' && 'Ready'}
                  {state === 'RequestingMedia' && 'Requesting media...'}
                  {state === 'OpeningWebSocket' && 'Connecting...'}
                  {state === 'Running' && 'Transcribing...'}
                  {state === 'FinishingProcessing' && 'Finishing...'}
                  {state === 'Finished' && 'Finished'}
                  {state === 'Error' && 'Error'}
                  {state === 'Canceled' && 'Canceled'}
                </span>
              </div>
            </div>

            {/* Start/Stop button */}
            {isActiveState(state) ? (
              <Button
                onClick={stopTranscription}
                disabled={state === 'FinishingProcessing'}
                variant="secondary"
                size="lg"
                className="w-full">
                Stop Transcription
              </Button>
            ) : (
              <Button
                onClick={startTranscription}
                variant="primary"
                size="lg"
                className="w-full">
                Start Transcription
              </Button>
            )}
          </div>

          {/* Source Language Transcript */}
          <div className="flex-1 flex flex-col min-h-0">
            <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-plum-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              Source Language
            </h3>
            <div
              ref={sourceRef}
              className="flex-1 bg-white rounded-xl border border-plum-100 p-4 overflow-y-auto text-sm leading-relaxed shadow-sm custom-scrollbar">
              {transcriptionTokens.length === 0 ? (
                <span className="text-text-light">
                  {isActiveState(state) ? 'Listening...' : 'Original speech will appear here'}
                </span>
              ) : (
                transcriptionTokens.map((token, idx) => {
                  const isStreaming = !token.is_final;
                  return (
                    <span
                      key={idx}
                      className={`${isStreaming ? 'text-plum-600 font-semibold' : 'text-text-primary'} transition-all duration-300`}>
                      {token.text}
                    </span>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right panel - 70% */}
        <div
          ref={transcriptRef}
          className={`w-[70%] p-6 overflow-y-auto custom-scrollbar-dark ${isFullscreen ? 'fixed inset-0 w-full z-50' : ''}`}
          style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #6b1a1a 50%, #450a0a 100%)' }}>
          {/* Fullscreen button */}
          <button
            onClick={toggleFullscreen}
            className="fixed top-4 right-4 z-10 bg-white/10 backdrop-blur-sm text-white p-3 rounded-xl hover:bg-white/20 transition-all shadow-lg"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
            {isFullscreen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            )}
          </button>

          {/* Transcript content */}
          {isBilingualMode ? (
            <div className={`h-full overflow-y-auto ${isFullscreen ? 'pt-16 px-8' : 'px-4'}`}>
              {!isFullscreen && (
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-plum-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Bilingual Transcription
                </h2>
              )}
              <BilingualTranscriptDisplay
                tokens={allTokens}
                mode="one_way"
                targetLanguage={targetLanguage}
                showSpeaker={false}
              />
            </div>
          ) : (
            <div className={`flex flex-col items-center justify-center h-full ${isFullscreen ? 'pt-16 px-8' : ''}`}>
              {!isFullscreen && (
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-plum-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  Target Language ({targetLanguageLabel})
                </h2>
              )}
              {translationTokens.length === 0 ? (
                <div
                  className="flex items-center justify-center text-white/40"
                  style={{ fontSize: 'var(--text-placeholder)' }}>
                  {isActiveState(state) ? 'Listening...' : 'Click "Start" to begin transcription'}
                </div>
              ) : (
                <div
                  ref={translationScrollRef}
                  className="leading-relaxed overflow-y-auto w-full text-center"
                  style={{ fontSize: 'var(--text-subtitle)', maxHeight: '4.8lh' }}>
                  {translationTokens.map((token, idx) => {
                    const isStreaming = !token.is_final;
                    return (
                      <span
                        key={idx}
                        className={`${
                          isStreaming
                            ? 'text-plum-300'
                            : 'text-white'
                        }`}>
                        {token.text}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error display */}
      {state === 'Error' && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-slideUp">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Error occurred. Please try again.
        </div>
      )}

      {/* Floating Bilingual Button */}
      <FloatingBilingualButton />
    </main>
  );
}
