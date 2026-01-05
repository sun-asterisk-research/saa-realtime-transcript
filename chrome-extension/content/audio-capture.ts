import { MessageType, sendMessage } from '../shared/messaging';

// Audio capture from Google Meet tab
// TODO: Implement in Phase 2

export class MeetAudioCapture {
  private audioStream: MediaStream | null = null;

  async captureTabAudio(): Promise<MediaStream> {
    // Request tab capture from service worker
    const response = await sendMessage({ type: MessageType.REQUEST_TAB_CAPTURE });

    if (response.error || !response.streamId) {
      throw new Error(`Failed to get stream ID: ${response.error || 'Unknown error'}`);
    }

    // Use stream ID to capture audio
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: response.streamId,
        },
      } as any,
    });

    this.audioStream = stream;
    return stream;
  }

  stopCapture(): void {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }
  }
}
