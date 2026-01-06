import type { Context } from '@soniox/speech-to-text-web';
import type {
  ValidateTokenResponse,
  TemporaryApiKeyResponse,
  ContextSetWithDetails,
  SessionContextsResponse,
  JoinMeetSessionResponse,
  MeetSessionWithParticipants,
  MeetTranscript,
} from '../shared/types';
import {
  WEB_APP_URL,
  API_VALIDATE_TOKEN_PATH,
  API_GET_TEMP_API_KEY_PATH,
  API_CONTEXT_SETS_PATH,
  API_SESSION_CONTEXTS_PATH,
} from '../shared/constants';

export class WebAppAPI {
  private baseUrl: string;

  constructor(baseUrl: string = WEB_APP_URL) {
    this.baseUrl = baseUrl;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    // Get session token from chrome.storage
    const { authState } = await chrome.storage.local.get('authState');
    const token = authState?.sessionToken;

    if (!token) {
      throw new Error('No authentication token found');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  // Validate session token
  async validateToken(token: string): Promise<ValidateTokenResponse> {
    const response = await fetch(`${this.baseUrl}${API_VALIDATE_TOKEN_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error(`Failed to validate token: ${response.statusText}`);
    }

    return response.json();
  }

  // Fetch temporary Soniox API key
  async getTemporaryApiKey(): Promise<string> {
    const response = await fetch(`${this.baseUrl}${API_GET_TEMP_API_KEY_PATH}`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication token expired');
      }
      throw new Error(`Failed to get temporary API key: ${response.statusText}`);
    }

    const data: TemporaryApiKeyResponse = await response.json();
    return data.apiKey;
  }

  // Fetch user's context sets
  async getContextSets(): Promise<ContextSetWithDetails[]> {
    const response = await fetch(`${this.baseUrl}${API_CONTEXT_SETS_PATH}`, {
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get context sets: ${response.statusText}`);
    }

    const data = await response.json();
    // API returns { contextSets, total, limit, offset }
    return data.contextSets || [];
  }

  // Fetch session contexts (if joining a session)
  async getSessionContexts(sessionCode: string): Promise<Context> {
    const response = await fetch(`${this.baseUrl}${API_SESSION_CONTEXTS_PATH}/${sessionCode}/contexts`, {
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get session contexts: ${response.statusText}`);
    }

    const data: SessionContextsResponse = await response.json();
    return data.mergedContext;
  }

  // Fetch temporary API key with retry logic
  async getTemporaryApiKeyWithRetry(maxRetries: number = 3): Promise<string> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.getTemporaryApiKey();
      } catch (error) {
        if (i === maxRetries - 1) throw error;

        // Exponential backoff: 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }
    throw new Error('Max retries exceeded');
  }

  // Meet Session APIs
  async joinMeetSession(
    meetingCode: string,
    displayName: string,
    email?: string
  ): Promise<JoinMeetSessionResponse> {
    const response = await fetch(`${this.baseUrl}/api/meet-sessions`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ meetingCode, displayName, email }),
    });

    if (!response.ok) {
      throw new Error(`Failed to join meet session: ${response.statusText}`);
    }

    return response.json();
  }

  async getMeetSession(meetingCode: string): Promise<MeetSessionWithParticipants> {
    const response = await fetch(`${this.baseUrl}/api/meet-sessions/${meetingCode}`, {
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get meet session: ${response.statusText}`);
    }

    return response.json();
  }

  async uploadMeetTranscript(
    meetingCode: string,
    participantId: string,
    text: string,
    translatedText: string | undefined,
    isFinal: boolean,
    startTime: Date,
    endTime?: Date
  ): Promise<MeetTranscript> {
    const response = await fetch(`${this.baseUrl}/api/meet-sessions/${meetingCode}/transcripts`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({
        participantId,
        text,
        translatedText: translatedText || null,
        isFinal,
        startTime: startTime.toISOString(),
        endTime: endTime?.toISOString() || null,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to upload transcript: ${response.statusText}`);
    }

    return response.json();
  }

  async leaveMeetSession(meetingCode: string, participantId: string): Promise<void> {
    // Update participant as inactive (left_at timestamp set by trigger)
    // This is done via PATCH to participant directly
    // For now, we don't need explicit leave API - just stop uploading transcripts
    console.log('[WebAppAPI] Leaving meet session:', meetingCode, participantId);
  }
}

// Singleton instance
export const webAppAPI = new WebAppAPI();
