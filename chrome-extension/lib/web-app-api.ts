import type { Context } from '@soniox/speech-to-text-web';
import type {
  ValidateTokenResponse,
  TemporaryApiKeyResponse,
  ContextSetWithDetails,
  SessionContextsResponse,
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

    return response.json();
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
}

// Singleton instance
export const webAppAPI = new WebAppAPI();
