import { MessageType, sendMessage } from '../shared/messaging';

// Audio capture from Google Meet tab
// TODO: Implement in Phase 2

export class MeetAudioCapture {
  private audioStream: MediaStream | null = null;

  async captureTabAudio(): Promise<MediaStream> {
    console.log('[AudioCapture] Starting microphone capture...');

    // For Google Meet, we can capture the user's microphone instead of tab audio
    // This is simpler and doesn't require complex tab capture permissions
    // Since the user is speaking into their mic, this captures their audio
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log('[AudioCapture] Microphone stream captured successfully');
      this.audioStream = stream;
      return stream;
    } catch (error) {
      console.error('[AudioCapture] getUserMedia failed:', error);
      throw new Error(`Failed to capture microphone: ${(error as Error).message}`);
    }
  }

  stopCapture(): void {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }
  }
}
