import { MessageType, sendMessage } from '../shared/messaging';

// Audio capture from Google Meet tab
// TODO: Implement in Phase 2

export class MeetAudioCapture {
  private audioStream: MediaStream | null = null;

  async captureTabAudio(): Promise<MediaStream> {
    console.log('[AudioCapture] Requesting tab capture stream ID...');

    // Request tab capture from service worker
    const response = await sendMessage({ type: MessageType.REQUEST_TAB_CAPTURE });

    if (response.error || !response.streamId) {
      console.error('[AudioCapture] Failed to get stream ID:', response.error);
      throw new Error(`Failed to get stream ID: ${response.error || 'Unknown error'}`);
    }

    console.log('[AudioCapture] Got stream ID:', response.streamId);

    // Use stream ID to capture audio
    // Note: Chrome Manifest V3 uses different constraints format
    try {
      console.log('[AudioCapture] Calling getUserMedia with stream ID...');

      // Try new format first (Manifest V3)
      const constraints: any = {
        audio: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: response.streamId,
        },
      };

      console.log('[AudioCapture] Constraints:', JSON.stringify(constraints));
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      console.log('[AudioCapture] Audio stream captured successfully');
      this.audioStream = stream;
      return stream;
    } catch (error) {
      console.error('[AudioCapture] getUserMedia failed:', error);
      throw new Error(`Error starting tab capture: ${(error as Error).message}`);
    }
  }

  stopCapture(): void {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }
  }
}
