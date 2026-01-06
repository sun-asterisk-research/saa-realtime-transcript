import { webAppAPI } from './web-app-api';
import type { MeetSession, MeetSessionParticipant } from '../shared/types';

interface TranscriptBuffer {
  text: string;
  translatedText: string | undefined;
  isFinal: boolean;
  startTime: Date;
  endTime?: Date;
}

export class SessionManager {
  private session: MeetSession | null = null;
  private participant: MeetSessionParticipant | null = null;
  private transcriptBuffer: TranscriptBuffer[] = [];
  private uploadInterval: NodeJS.Timeout | null = null;
  private isUploading: boolean = false;

  async joinSession(
    meetingCode: string,
    displayName: string,
    email?: string
  ): Promise<void> {
    console.log('[SessionManager] Joining session:', meetingCode, 'as', displayName);

    try {
      const response = await webAppAPI.joinMeetSession(meetingCode, displayName, email);
      this.session = response.session;
      this.participant = response.participant;

      console.log('[SessionManager] Joined session:', this.session.id);
      console.log('[SessionManager] Participant ID:', this.participant.id);

      // Start periodic transcript upload
      this.startTranscriptUpload();
    } catch (error) {
      console.error('[SessionManager] Failed to join session:', error);
      throw error;
    }
  }

  queueTranscript(
    text: string,
    translatedText: string | undefined,
    isFinal: boolean,
    startTime: Date,
    endTime?: Date
  ): void {
    if (!this.session || !this.participant) {
      console.warn('[SessionManager] Not in session, buffering transcript');
    }

    // Add to buffer
    this.transcriptBuffer.push({
      text,
      translatedText,
      isFinal,
      startTime,
      endTime,
    });

    console.log('[SessionManager] Queued transcript. Buffer size:', this.transcriptBuffer.length);
  }

  private startTranscriptUpload(): void {
    // Upload buffered transcripts every 2 seconds
    this.uploadInterval = setInterval(() => {
      this.flushTranscriptBuffer();
    }, 2000);

    console.log('[SessionManager] Started transcript upload interval');
  }

  private async flushTranscriptBuffer(): Promise<void> {
    if (this.transcriptBuffer.length === 0 || this.isUploading) {
      return;
    }

    if (!this.session || !this.participant) {
      console.warn('[SessionManager] Not in session, cannot flush buffer');
      return;
    }

    this.isUploading = true;

    const toUpload = [...this.transcriptBuffer];
    this.transcriptBuffer = [];

    console.log('[SessionManager] Flushing', toUpload.length, 'transcripts');

    for (const transcript of toUpload) {
      try {
        await webAppAPI.uploadMeetTranscript(
          this.session.meeting_code,
          this.participant.id,
          transcript.text,
          transcript.translatedText,
          transcript.isFinal,
          transcript.startTime,
          transcript.endTime
        );
      } catch (error) {
        console.error('[SessionManager] Failed to upload transcript:', error);
        // Re-add to buffer for retry
        this.transcriptBuffer.push(transcript);
      }
    }

    this.isUploading = false;
  }

  async leaveSession(): Promise<void> {
    console.log('[SessionManager] Leaving session');

    if (this.uploadInterval) {
      clearInterval(this.uploadInterval);
      this.uploadInterval = null;
    }

    // Flush remaining transcripts
    await this.flushTranscriptBuffer();

    if (this.session && this.participant) {
      await webAppAPI.leaveMeetSession(this.session.meeting_code, this.participant.id);
    }

    this.session = null;
    this.participant = null;
  }

  getSession(): MeetSession | null {
    return this.session;
  }

  getParticipant(): MeetSessionParticipant | null {
    return this.participant;
  }

  isInSession(): boolean {
    return this.session !== null && this.participant !== null;
  }
}
