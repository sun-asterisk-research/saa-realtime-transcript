'use client';

import { Button } from '@/components/button';
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
    <main className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-primary text-white py-4 px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Sun Asterisk</h1>
            <p className="text-sm opacity-90">SAA 2025 Live Transcript</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - 30% */}
        <div className="w-[30%] border-r border-gray-200 p-4 flex flex-col gap-4 bg-gray-50">
          {/* Video preview */}
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          </div>

          {/* Settings */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-gray-700">Settings</h3>

            {/* Camera select */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Camera</label>
              <select
                value={selectedVideoDevice}
                onChange={(e) => setSelectedVideoDevice(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
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
              <label className="block text-sm text-gray-600 mb-1">Microphone</label>
              <select
                value={selectedAudioDevice}
                onChange={(e) => setSelectedAudioDevice(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
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
              <label className="block text-sm text-gray-600 mb-1">Target Language</label>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                disabled={isActiveState(state)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed">
                {TARGET_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="mt-2 p-3 bg-white rounded-md border border-gray-200">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isActiveState(state) ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                  }`}
                />
                <span className="text-sm text-gray-600">
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
                className="w-full bg-gray-600 text-white hover:bg-gray-700 border-gray-600">
                Stop Transcription
              </Button>
            ) : (
              <Button
                onClick={startTranscription}
                className="w-full bg-primary text-white hover:bg-primary/90 border-primary">
                Start Transcription
              </Button>
            )}
          </div>

          {/* Source Language Transcript */}
          <div className="flex-1 flex flex-col min-h-0">
            <h3 className="font-semibold text-gray-700 mb-2">Source Language</h3>
            <div
              ref={sourceRef}
              className="flex-1 bg-white rounded-lg border border-gray-200 p-3 overflow-y-auto text-sm leading-relaxed">
              {transcriptionTokens.length === 0 ? (
                <span className="text-gray-400">
                  {isActiveState(state) ? 'Listening...' : 'Original speech will appear here'}
                </span>
              ) : (
                transcriptionTokens.map((token, idx) => {
                  const isStreaming = !token.is_final;
                  return (
                    <span
                      key={idx}
                      className={`${isStreaming ? 'text-primary font-bold text-[1.15em]' : 'text-gray-700'} transition-all duration-300`}>
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
          className={`w-[70%] p-6 overflow-y-auto ${isFullscreen ? 'fixed inset-0 w-full z-50' : ''}`}
          style={{ backgroundColor: '#092432' }}>
          {/* Fullscreen button */}
          <button
            onClick={toggleFullscreen}
            className="fixed top-4 right-4 z-10 bg-gray-800 text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
            {isFullscreen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
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
                className="h-6 w-6"
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
          <div className={`flex flex-col items-center justify-center h-full ${isFullscreen ? 'pt-16 px-8' : ''}`}>
            {!isFullscreen && (
              <h2 className="text-xl font-semibold text-white mb-4">
                Target Language ({targetLanguageLabel})
              </h2>
            )}
            {translationTokens.length === 0 ? (
              <div
                className="flex items-center justify-center text-white/50"
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
                          ? 'text-primary'
                          : 'text-white'
                      }`}>
                      {token.text}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error display */}
      {state === 'Error' && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          Error occurred. Please try again.
        </div>
      )}
    </main>
  );
}
