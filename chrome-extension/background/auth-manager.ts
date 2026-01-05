import type { AuthState, UserInfo } from '../shared/types';
import { webAppAPI } from '../lib/web-app-api';
import { WEB_APP_URL, AUTH_LOGIN_PATH } from '../shared/constants';
import { MessageType, sendMessage } from '../shared/messaging';

export class AuthManager {
  private static instance: AuthManager;

  private constructor() {}

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  // Initiate login flow - opens web app login page
  async initiateLogin(): Promise<void> {
    const loginUrl = `${WEB_APP_URL}${AUTH_LOGIN_PATH}`;
    await chrome.tabs.create({ url: loginUrl });
  }

  // Handle auth callback with token
  async handleAuthCallback(token: string): Promise<void> {
    try {
      console.log('[AuthManager] Handling auth callback with token:', token.substring(0, 20) + '...');

      // Validate token with web app
      console.log('[AuthManager] Validating token with web app...');
      const response = await webAppAPI.validateToken(token);
      console.log('[AuthManager] Validation response:', response);

      if (!response.valid || !response.user) {
        throw new Error('Invalid token');
      }

      // Store auth state
      const authState: AuthState = {
        isAuthenticated: true,
        sessionToken: token,
        userEmail: response.user.email,
        userName: response.user.name || null,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      };

      console.log('[AuthManager] Storing auth state:', authState);
      await chrome.storage.local.set({ authState });

      // Verify storage
      const stored = await chrome.storage.local.get('authState');
      console.log('[AuthManager] Verified stored auth state:', stored);

      // Notify all contexts that auth succeeded
      console.log('[AuthManager] Sending AUTH_SUCCESS message...');
      await chrome.runtime.sendMessage({
        type: MessageType.AUTH_SUCCESS,
        payload: { user: response.user },
      }).catch(err => {
        console.warn('[AuthManager] Failed to send AUTH_SUCCESS message (popup might be closed):', err);
      });

      console.log('[AuthManager] Authentication successful:', response.user.email);
    } catch (error) {
      console.error('[AuthManager] Auth callback failed:', error);
      throw error;
    }
  }

  // Get current session token
  async getSessionToken(): Promise<string | null> {
    const { authState } = await chrome.storage.local.get('authState');

    if (!authState?.isAuthenticated) {
      return null;
    }

    // Check if token is expired
    if (authState.expiresAt && authState.expiresAt < Date.now()) {
      await this.logout();
      return null;
    }

    return authState.sessionToken;
  }

  // Get auth state
  async getAuthState(): Promise<AuthState> {
    const { authState } = await chrome.storage.local.get('authState');
    return authState || this.getDefaultAuthState();
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getSessionToken();
    return token !== null;
  }

  // Logout
  async logout(): Promise<void> {
    await chrome.storage.local.set({
      authState: this.getDefaultAuthState(),
    });

    // Notify all contexts
    await chrome.runtime.sendMessage({
      type: MessageType.AUTH_LOGOUT,
    });

    console.log('Logged out');
  }

  // Get default auth state
  private getDefaultAuthState(): AuthState {
    return {
      isAuthenticated: false,
      sessionToken: null,
      userEmail: null,
      userName: null,
      expiresAt: null,
    };
  }
}

export const authManager = AuthManager.getInstance();
