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

      // Timeout after 15 seconds
      setTimeout(() => {
        console.log('Meet UI load timeout');
        observer.disconnect();
        resolve();
      }, 15000);
    });
  }

  private isMeetUILoaded(): boolean {
    // Check for Meet's main container elements
    const selectors = [
      '[data-meeting-title]',
      '[data-self-name]',
      '[jsname="HfuNzb"]', // Meet's main controls container
      'div[data-meeting-code]',
    ];

    for (const selector of selectors) {
      if (document.querySelector(selector)) {
        return true;
      }
    }

    return false;
  }
}

export class MicButtonMonitor {
  private micButton: HTMLElement | null = null;
  private isMuted: boolean = false;
  private observer: MutationObserver | null = null;
  private onChange: ((isMuted: boolean) => void) | null = null;

  // Multiple selectors to find mic button (Meet changes these frequently)
  private readonly MIC_BUTTON_SELECTORS = [
    // By data-tooltip
    '[data-tooltip*="microphone" i]',
    '[data-tooltip*="mic" i]',

    // By aria-label
    '[aria-label*="microphone" i]',
    '[aria-label*="turn on microphone" i]',
    '[aria-label*="turn off microphone" i]',
    '[aria-label*="mute" i]',

    // By jsname/jscontroller (Meet's internal IDs)
    'button[jsname][data-is-muted]',
    'div[jscontroller] button[aria-label*="mic" i]',

    // By class patterns (less reliable, but fallback)
    'button[class*="mic" i][class*="button" i]',
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

    // Check initial state
    this.isMuted = this.checkMutedState();
    console.log('Initial mic state:', this.isMuted ? 'MUTED' : 'UNMUTED');

    // Watch for attribute changes on the button
    this.observer = new MutationObserver(() => {
      const newMuted = this.checkMutedState();
      if (newMuted !== this.isMuted) {
        this.isMuted = newMuted;
        console.log('Mic state changed:', this.isMuted ? 'MUTED' : 'UNMUTED');
        this.onChange?.(this.isMuted);
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

    console.log('Mic button monitoring started');
  }

  stopMonitoring(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.onChange = null;
    console.log('Mic button monitoring stopped');
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
