import type { Token } from '@soniox/speech-to-text-web';

// Caption injection and native caption hiding

export class CaptionInjector {
  private captionContainer: HTMLElement | null = null;
  private nativeCaptionsHidden: boolean = false;
  private captionObserver: MutationObserver | null = null;

  // Multiple selectors for Meet's native captions (Meet changes these frequently)
  private readonly NATIVE_CAPTION_SELECTORS = [
    // By data attributes
    '[data-self-name*="caption" i]',
    '[data-caption-bubble]',
    '[data-subtitle]',

    // By jsname/jscontroller (Meet's internal IDs)
    '[jsname][jscontroller*="caption" i]',
    '[jscontroller*="subtitle" i]',

    // By class patterns (less reliable, but fallback)
    'div[class*="caption" i][class*="container" i]',
    'div[class*="subtitle" i]',

    // Specific known classes (update as Meet changes)
    '.iOzk7', // Historical Meet caption class
    '.iTTPOb', // Another historical class

    // By role and content
    '[role="status"]',
    '[role="alert"][class*="caption" i]',
  ];

  hideNativeCaptions(): void {
    if (this.nativeCaptionsHidden) {
      return;
    }

    console.log('Hiding native Meet captions...');

    // Hide all existing captions
    this.hideExistingCaptions();

    // Watch for new captions being added dynamically
    this.startCaptionObserver();

    this.nativeCaptionsHidden = true;
    console.log('Native captions hidden');
  }

  private hideExistingCaptions(): void {
    let hiddenCount = 0;

    for (const selector of this.NATIVE_CAPTION_SELECTORS) {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          // Only hide if it looks like a caption container
          if (this.isCaptionElement(htmlEl)) {
            htmlEl.style.display = 'none';
            htmlEl.setAttribute('data-soniox-hidden', 'true');
            hiddenCount++;
          }
        });
      } catch (error) {
        console.warn('Selector failed:', selector, error);
      }
    }

    console.log(`Hidden ${hiddenCount} caption elements`);
  }

  private isCaptionElement(element: HTMLElement): boolean {
    // Check if this element is likely a caption container
    const text = element.textContent?.trim() || '';
    const className = typeof element.className === 'string' ? element.className : element.className?.toString() || '';
    const role = element.getAttribute('role');

    // Skip if already hidden by us
    if (element.getAttribute('data-soniox-hidden') === 'true') {
      return false;
    }

    // Skip if it's our own caption
    if (element.id === 'soniox-captions') {
      return false;
    }

    // Check for caption-related attributes
    const hasCaptionAttr =
      element.getAttribute('data-self-name')?.includes('caption') ||
      element.hasAttribute('data-caption-bubble') ||
      element.hasAttribute('data-subtitle');

    if (hasCaptionAttr) {
      return true;
    }

    // Check for caption-related classes
    if (className && (className.toLowerCase().includes('caption') ||
        className.toLowerCase().includes('subtitle'))) {
      return true;
    }

    // Check role
    if (role === 'status' || role === 'alert') {
      // Only if it's positioned at bottom (likely a caption)
      const rect = element.getBoundingClientRect();
      if (rect.bottom > window.innerHeight * 0.5) {
        return true;
      }
    }

    return false;
  }

  private startCaptionObserver(): void {
    // Stop existing observer if any
    this.stopCaptionObserver();

    // Create new observer to watch for dynamically added captions
    this.captionObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement;
              if (this.isCaptionElement(element)) {
                element.style.display = 'none';
                element.setAttribute('data-soniox-hidden', 'true');
                console.log('Hid dynamically added caption');
              }

              // Also check children
              for (const selector of this.NATIVE_CAPTION_SELECTORS) {
                try {
                  const children = element.querySelectorAll(selector);
                  children.forEach((child) => {
                    const htmlChild = child as HTMLElement;
                    if (this.isCaptionElement(htmlChild)) {
                      htmlChild.style.display = 'none';
                      htmlChild.setAttribute('data-soniox-hidden', 'true');
                    }
                  });
                } catch (error) {
                  // Selector might be invalid
                }
              }
            }
          });
        }
      }
    });

    this.captionObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    console.log('Caption observer started');
  }

  private stopCaptionObserver(): void {
    if (this.captionObserver) {
      this.captionObserver.disconnect();
      this.captionObserver = null;
      console.log('Caption observer stopped');
    }
  }

  showNativeCaptions(): void {
    if (!this.nativeCaptionsHidden) {
      return;
    }

    console.log('Showing native Meet captions...');

    // Stop observer
    this.stopCaptionObserver();

    // Re-show all hidden captions
    const hiddenElements = document.querySelectorAll('[data-soniox-hidden="true"]');
    hiddenElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.display = '';
      htmlEl.removeAttribute('data-soniox-hidden');
    });

    this.nativeCaptionsHidden = false;
    console.log('Native captions shown');
  }

  createCaptionContainer(): HTMLElement {
    if (this.captionContainer) {
      return this.captionContainer;
    }

    const container = document.createElement('div');
    container.id = 'soniox-captions';
    container.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      width: 80%;
      max-width: 1200px;
      height: 200px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      font-size: 24px;
      line-height: 1.4;
      text-align: center;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      font-family: 'Google Sans', Roboto, Arial, sans-serif;
      pointer-events: none;
      overflow-y: auto;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    `;

    // Add scrollbar styling
    const style = document.createElement('style');
    style.textContent = `
      #soniox-captions::-webkit-scrollbar {
        width: 8px;
      }
      #soniox-captions::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
      }
      #soniox-captions::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 4px;
      }
      #soniox-captions::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.5);
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(container);
    this.captionContainer = container;
    return container;
  }

  updateCaptions(tokens: Token[]): void {
    console.log('[CaptionInjector] updateCaptions called with', tokens.length, 'tokens');

    if (!this.captionContainer) {
      this.createCaptionContainer();
      console.log('[CaptionInjector] Created caption container');
    }

    // Filter out endpoint tokens
    const filteredTokens = tokens.filter((t) => t.text !== '<end>');
    console.log('[CaptionInjector] After filtering <end>:', filteredTokens.length, 'tokens');

    // Separate final and non-final tokens
    const finalTokens = filteredTokens.filter((t) => t.is_final);
    const nonFinalTokens = filteredTokens.filter((t) => !t.is_final);

    // Group tokens by speaker
    const groupBySpeaker = (tokens: Token[]) => {
      const groups: { speaker: number | undefined; text: string; isFinal: boolean }[] = [];
      let currentSpeaker: number | undefined = undefined;
      let currentText = '';
      let currentIsFinal = false;

      for (const token of tokens) {
        if (token.speaker !== currentSpeaker && currentText) {
          // Speaker changed, save previous group
          groups.push({ speaker: currentSpeaker, text: currentText, isFinal: currentIsFinal });
          currentText = '';
        }
        currentSpeaker = token.speaker;
        currentText += token.text;
        currentIsFinal = token.is_final;
      }

      if (currentText) {
        groups.push({ speaker: currentSpeaker, text: currentText, isFinal: currentIsFinal });
      }

      return groups;
    };

    // Show last 3 speaker groups from final tokens
    const finalGroups = groupBySpeaker(finalTokens).slice(-3);
    const nonFinalGroups = groupBySpeaker(nonFinalTokens);

    let html = '';

    // For Phase 1: Individual mic capture
    // Each person only transcribes their own speech, so no speaker label needed
    // The speaker name is shown on the server-side aggregated view

    // Render final speaker groups
    // If translation enabled: final tokens can be either original (yellow) or translated (white)
    // We'll use white for final tokens (since they're either English or waiting-to-be-translated Vietnamese)
    for (const group of finalGroups) {
      html += `
        <div style="margin-bottom: 8px;">
          <span style="color: #FFA726; font-weight: 600; opacity: 0.95;">${this.escapeHtml(group.text)}</span>
        </div>
      `;
    }

    // Render non-final speaker groups (still speaking - show in green)
    for (const group of nonFinalGroups) {
      html += `
        <div style="margin-bottom: 8px;">
          <span style="color: #4CAF50; font-weight: 600;">${this.escapeHtml(group.text)}</span>
        </div>
      `;
    }

    console.log('[CaptionInjector] Setting HTML:', {
      htmlLength: html.length,
      finalGroups: finalGroups.length,
      nonFinalGroups: nonFinalGroups.length,
    });

    this.captionContainer!.innerHTML = html;

    // Auto-scroll to bottom when new content is added
    if (this.captionContainer) {
      this.captionContainer.scrollTop = this.captionContainer.scrollHeight;
    }
  }

  clearCaptions(): void {
    if (this.captionContainer) {
      this.captionContainer.innerHTML = '';
    }
  }

  destroy(): void {
    this.captionContainer?.remove();
    this.captionContainer = null;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
