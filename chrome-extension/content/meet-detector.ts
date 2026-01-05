// Meet page detection and mic button monitoring

export class MeetDetector {
  isMeetPage(): boolean {
    return window.location.hostname === 'meet.google.com' && window.location.pathname.length > 1;
  }

  async waitForMeetUI(): Promise<void> {
    return new Promise((resolve) => {
      // Check if Meet UI is already loaded
      if (this.isMeetUILoaded()) {
        console.log('Meet UI already loaded');
        resolve();
        return;
      }

      console.log('Waiting for Meet UI to load...');

      const observer = new MutationObserver(() => {
        if (this.isMeetUILoaded()) {
          console.log('Meet UI loaded');
          observer.disconnect();
          resolve();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      // Timeout after 60 seconds (user might be on lobby for a while)
      setTimeout(() => {
        console.log('Meet UI load timeout - user may still be in lobby');
        observer.disconnect();
        resolve();
      }, 60000);
    });
  }

  private isMeetUILoaded(): boolean {
    // Check for in-meeting UI elements (NOT lobby elements)
    // These selectors should only match when user has joined the meeting
    const selectors = [
      // Mic button with data-is-muted (only exists in meeting, not lobby)
      '[role="button"][data-is-muted]',
      '[data-is-muted="true"]',
      '[data-is-muted="false"]',

      // Meet's main controls container (bottom bar with controls)
      '[jsname="HfuNzb"]',

      // Meeting participants/people panel
      '[data-participant-id]',

      // Self video tile
      '[data-self-name][data-initial-participant-id]',
    ];

    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          console.log('Found in-meeting UI element:', selector);
          return true;
        }
      } catch (error) {
        // Invalid selector, continue
      }
    }

    return false;
  }
}

export class MicButtonMonitor {
  private micButton: HTMLElement | null = null;
  private _isMuted: boolean = false;
  private observer: MutationObserver | null = null;
  private onChange: ((isMuted: boolean) => void) | null = null;
  private domObserver: MutationObserver | null = null;
  private isMonitoring: boolean = false;
  private restartTimeout: NodeJS.Timeout | null = null;

  // Public getter for mute state
  get isMuted(): boolean {
    return this._isMuted;
  }

  // Multiple selectors to find mic button (Meet changes these frequently)
  private readonly MIC_BUTTON_SELECTORS = [
    // Most specific - Meet's jsname identifier
    '[jsname="hw0c9"]',

    // By data-is-muted attribute (works for both button and div)
    '[role="button"][data-is-muted]',
    '[data-is-muted]',

    // By data-tooltip
    '[data-tooltip*="microphone" i]',
    '[data-tooltip*="mic" i]',

    // By aria-label
    '[aria-label*="turn off microphone" i]',
    '[aria-label*="turn on microphone" i]',
    '[aria-label*="microphone" i]',
    '[aria-label*="mute" i]',

    // By jsname/jscontroller (Meet's internal IDs) - support both button and div
    '[jsname][data-is-muted]',
    'div[jscontroller] [role="button"][aria-label*="mic" i]',

    // By class patterns (less reliable, but fallback)
    '[role="button"][class*="mic" i]',
    'button[class*="mic" i]',
  ];

  async findMicButton(): Promise<HTMLElement | null> {
    console.log('Searching for mic button...');

    // Try each selector
    for (const selector of this.MIC_BUTTON_SELECTORS) {
      try {
        const elements = document.querySelectorAll(selector);
        for (const element of Array.from(elements)) {
          if (this.isMicButton(element as HTMLElement)) {
            this.micButton = element as HTMLElement;
            console.log('Found mic button with selector:', selector);
            return this.micButton;
          }
        }
      } catch (error) {
        // Selector might be invalid, continue to next
        console.warn('Selector failed:', selector, error);
      }
    }

    console.warn('Mic button not found');
    return null;
  }

  private isMicButton(element: HTMLElement): boolean {
    // Verify this is actually the mic button by checking:
    // 1. It's a button or has button role
    // 2. It has mic-related text/aria-label
    // 3. It's visible

    const tagName = element.tagName.toLowerCase();
    const role = element.getAttribute('role');
    const ariaLabel = (element.getAttribute('aria-label') || '').toLowerCase();
    const dataTooltip = (element.getAttribute('data-tooltip') || '').toLowerCase();

    // Must be a button
    if (tagName !== 'button' && role !== 'button') {
      return false;
    }

    // Must have mic-related text
    const hasMicText =
      ariaLabel.includes('mic') ||
      ariaLabel.includes('mute') ||
      dataTooltip.includes('mic') ||
      dataTooltip.includes('mute');

    if (!hasMicText) {
      return false;
    }

    // Must be visible
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return false;
    }

    return true;
  }

  startMonitoring(onChange: (isMuted: boolean) => void): void {
    if (!this.micButton) {
      console.warn('Cannot start monitoring: mic button not found');
      return;
    }

    this.onChange = onChange;
    this.isMonitoring = true;

    // Check initial state
    this._isMuted = this.checkMutedState();
    console.log('Initial mic state:', this._isMuted ? 'MUTED' : 'UNMUTED');

    // Watch for attribute changes on the button
    this.observer = new MutationObserver(() => {
      // Check if button is still in DOM
      if (!this.isMicButtonValid()) {
        console.warn('Mic button removed from DOM, attempting to re-find...');
        this.restartMonitoring();
        return;
      }

      const newMuted = this.checkMutedState();
      if (newMuted !== this._isMuted) {
        this._isMuted = newMuted;
        console.log('Mic state changed:', this._isMuted ? 'MUTED' : 'UNMUTED');
        this.onChange?.(this._isMuted);
      }
    });

    this.observer.observe(this.micButton, {
      attributes: true,
      attributeFilter: ['data-is-muted', 'aria-label', 'data-tooltip', 'class'],
      subtree: true,
    });

    // Also watch for icon changes (some Meet versions use icon swaps)
    const icon = this.micButton.querySelector('[class*="icon" i], svg, i');
    if (icon) {
      this.observer.observe(icon, {
        attributes: true,
        characterData: true,
        childList: true,
        subtree: true,
      });
    }

    // Watch for DOM changes (button being replaced when transitioning lobby -> meeting)
    this.startDomObserver();

    console.log('Mic button monitoring started');
  }

  stopMonitoring(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.domObserver?.disconnect();
    this.domObserver = null;
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    this.onChange = null;
    this.isMonitoring = false;
    console.log('Mic button monitoring stopped');
  }

  private isMicButtonValid(): boolean {
    if (!this.micButton) return false;
    // Check if button is still in the document
    return document.body.contains(this.micButton);
  }

  private async restartMonitoring(): Promise<void> {
    if (!this.isMonitoring) return;

    // Debounce: clear any pending restart
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
    }

    // Wait 500ms before attempting restart (avoid rapid re-attempts during DOM changes)
    this.restartTimeout = setTimeout(async () => {
      console.log('Restarting mic button monitoring...');

      // Stop current monitoring
      this.observer?.disconnect();
      this.observer = null;

      // Try to find the mic button again
      const newButton = await this.findMicButton();

      if (newButton && this.onChange) {
        console.log('Successfully re-found mic button, restarting monitoring');
        this.startMonitoring(this.onChange);
      } else {
        console.warn('Failed to re-find mic button, will retry on next DOM change');
      }

      this.restartTimeout = null;
    }, 500);
  }

  private startDomObserver(): void {
    // Stop existing observer if any
    this.domObserver?.disconnect();

    // Watch for DOM changes that might indicate button replacement
    this.domObserver = new MutationObserver((mutations) => {
      // Debounce: only check every few mutations
      if (!this.isMicButtonValid() && this.isMonitoring) {
        console.log('DOM changed and mic button is invalid, attempting to re-find...');
        this.restartMonitoring();
      }
    });

    // Observe the entire document for changes
    this.domObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    console.log('DOM observer started for mic button changes');
  }

  private checkMutedState(): boolean {
    if (!this.micButton) return false;

    // Method 1: Check data-is-muted attribute
    const dataMuted = this.micButton.getAttribute('data-is-muted');
    if (dataMuted === 'true') return true;
    if (dataMuted === 'false') return false;

    // Method 2: Check aria-label
    const ariaLabel = (this.micButton.getAttribute('aria-label') || '').toLowerCase();

    // "Turn on microphone" or "Unmute" means currently muted
    if (ariaLabel.includes('turn on') || ariaLabel.includes('unmute')) {
      return true;
    }

    // "Turn off microphone" or "Mute" means currently unmuted
    if (ariaLabel.includes('turn off') ||
        (ariaLabel.includes('mute') && !ariaLabel.includes('unmute'))) {
      return false;
    }

    // Method 3: Check icon classes or content
    const icon = this.micButton.querySelector('[class*="icon" i], svg, i');
    if (icon) {
      const iconClass = icon.className;
      const iconText = icon.textContent || '';

      // Look for "mic_off" icon
      if (iconClass.includes('mic_off') || iconText.includes('mic_off')) {
        return true;
      }

      // Look for "mic" icon (not mic_off)
      if (iconClass.includes('mic') && !iconClass.includes('off')) {
        return false;
      }
    }

    // Method 4: Check button classes
    const buttonClass = this.micButton.className;
    if (buttonClass.includes('muted') || buttonClass.includes('off')) {
      return true;
    }

    // Default: assume unmuted (safer default)
    return false;
  }

  getCurrentState(): boolean {
    return this.isMuted;
  }
}
