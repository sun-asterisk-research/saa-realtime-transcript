/**
 * Tab Audio Capture Utilities
 *
 * Provides functions to capture audio from a Chrome tab and mix it with
 * microphone audio for transcription. This allows users to transcribe
 * meeting audio from Chrome tabs (Google Meet, Teams, etc.) without
 * needing external speakers.
 *
 * Browser Support:
 * - Chrome/Edge: Full support (Chrome 74+)
 * - Firefox: Not supported (ignores audio parameter)
 * - Safari: Not supported
 */

export interface TabAudioCaptureResult {
  stream: MediaStream;
  tabName: string;
}

/**
 * Check if the browser supports tab audio capture
 */
export function isTabAudioCaptureSupported(): boolean {
  // Check if getDisplayMedia is available
  if (!navigator.mediaDevices?.getDisplayMedia) {
    return false;
  }

  // Chrome/Edge support tab audio capture, Firefox/Safari do not
  const isChromium = /Chrome|Chromium|Edg/.test(navigator.userAgent);
  return isChromium;
}

/**
 * Capture audio from a browser tab.
 * Opens Chrome's tab picker dialog for the user to select a tab.
 *
 * Note: getDisplayMedia always requires video, but we only use the audio track.
 * The video track is immediately stopped after capture.
 *
 * @returns Promise with the audio stream and tab name, or null if cancelled/failed
 */
export async function captureTabAudio(): Promise<TabAudioCaptureResult | null> {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true, // Required - can't capture audio-only
      audio: {
        // Keep audio playing locally (don't mute the tab)
        suppressLocalAudioPlayback: false,
      },
      // Don't show our own tab in the picker
      selfBrowserSurface: 'exclude',
    } as DisplayMediaStreamOptions);

    // Stop the video track immediately - we only need audio
    const videoTracks = stream.getVideoTracks();
    videoTracks.forEach((track) => track.stop());

    // Check if we got audio
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      console.warn('[TabAudioCapture] No audio track captured. User may have unchecked "Share audio".');
      stream.getTracks().forEach((track) => track.stop());
      return null;
    }

    // Get tab name from the audio track label
    const tabName = audioTracks[0].label || 'Browser Tab';

    return { stream, tabName };
  } catch (error) {
    // User cancelled the picker or other error
    if (error instanceof Error && error.name === 'NotAllowedError') {
      console.debug('[TabAudioCapture] User cancelled tab selection');
      return null;
    }
    console.error('[TabAudioCapture] Error capturing tab audio:', error);
    throw error;
  }
}

/**
 * Stop tab audio capture
 */
export function stopTabAudioCapture(stream: MediaStream): void {
  stream.getTracks().forEach((track) => track.stop());
}

/**
 * Mix microphone and tab audio streams into a single stream.
 * Uses Web Audio API's ChannelMerger to combine both audio sources.
 *
 * @param micStream - The microphone MediaStream
 * @param tabStream - The tab audio MediaStream
 * @returns Object containing the mixed stream and AudioContext (for cleanup)
 */
export function mixAudioStreams(
  micStream: MediaStream,
  tabStream: MediaStream
): { mixedStream: MediaStream; audioContext: AudioContext } {
  const audioContext = new AudioContext();

  // Create source nodes from both streams
  const micSource = audioContext.createMediaStreamSource(micStream);
  const tabSource = audioContext.createMediaStreamSource(tabStream);

  // Create gain nodes for volume control
  const micGain = audioContext.createGain();
  const tabGain = audioContext.createGain();

  // Set default volumes (can be adjusted later)
  micGain.gain.value = 1.0;
  tabGain.gain.value = 1.0;

  // Connect sources to gain nodes
  micSource.connect(micGain);
  tabSource.connect(tabGain);

  // Create a channel merger to combine both audio streams
  // Using 2 inputs, both going to a mono output
  const merger = audioContext.createChannelMerger(2);
  micGain.connect(merger, 0, 0);
  tabGain.connect(merger, 0, 1);

  // Create destination stream
  const destination = audioContext.createMediaStreamDestination();
  merger.connect(destination);

  return {
    mixedStream: destination.stream,
    audioContext,
  };
}
