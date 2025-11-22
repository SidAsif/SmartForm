/**
 * MessagingService
 *
 * Infrastructure service for Chrome extension messaging.
 * Provides a clean interface for popup ↔ background ↔ content script communication.
 */
export class MessagingService {
  /**
   * Send message to the active tab's content script
   * @param {Object} message
   * @returns {Promise<any>}
   */
  static async sendToActiveTab(message) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.id) {
        throw new Error('No active tab found');
      }

      const response = await chrome.tabs.sendMessage(tab.id, message);
      return response;
    } catch (error) {
      console.error('Error sending message to active tab:', error);
      throw error;
    }
  }

  /**
   * Send message to a specific tab
   * @param {number} tabId
   * @param {Object} message
   * @returns {Promise<any>}
   */
  static async sendToTab(tabId, message) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, message);
      return response;
    } catch (error) {
      console.error(`Error sending message to tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Send message to background script
   * @param {Object} message
   * @returns {Promise<any>}
   */
  static async sendToBackground(message) {
    try {
      const response = await chrome.runtime.sendMessage(message);
      return response;
    } catch (error) {
      console.error('Error sending message to background:', error);
      throw error;
    }
  }

  /**
   * Get the active tab
   * @returns {Promise<chrome.tabs.Tab>}
   */
  static async getActiveTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab) {
        throw new Error('No active tab found');
      }

      return tab;
    } catch (error) {
      console.error('Error getting active tab:', error);
      throw error;
    }
  }

  /**
   * Inject content script into the active tab
   * @returns {Promise<void>}
   */
  static async injectContentScript() {
    try {
      const tab = await this.getActiveTab();

      // Check if we can inject scripts on this URL
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
        throw new Error('Cannot inject scripts on browser pages');
      }

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

      console.log('Content script injected successfully');
    } catch (error) {
      console.error('Error injecting content script:', error);
      throw error;
    }
  }

  /**
   * Check if content script is ready in the active tab
   * @returns {Promise<boolean>}
   */
  static async isContentScriptReady() {
    try {
      const response = await this.sendToActiveTab({ action: 'ping' });
      return response && response.status === 'ready';
    } catch (error) {
      return false;
    }
  }

  /**
   * Wait for content script to be ready
   * @param {number} maxAttempts
   * @param {number} delayMs
   * @returns {Promise<boolean>}
   */
  static async waitForContentScript(maxAttempts = 5, delayMs = 200) {
    for (let i = 0; i < maxAttempts; i++) {
      const isReady = await this.isContentScriptReady();

      if (isReady) {
        return true;
      }

      await this.delay(delayMs);
    }

    return false;
  }

  /**
   * Delay helper
   * @param {number} ms
   * @returns {Promise<void>}
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Extract fields from the active tab
   * @returns {Promise<Array>}
   */
  static async extractFields() {
    try {
      // Check if content script is ready
      let isReady = await this.isContentScriptReady();

      // If not ready, try to inject it
      if (!isReady) {
        console.log('Content script not ready, injecting...');
        await this.injectContentScript();

        // Wait for it to be ready after injection
        isReady = await this.waitForContentScript();

        if (!isReady) {
          throw new Error('Content script failed to initialize. Please try again.');
        }
      }

      const response = await this.sendToActiveTab({ action: 'extract_fields' });

      if (!response || !response.success) {
        throw new Error(response?.error || 'Failed to extract fields');
      }

      return response.fields || [];
    } catch (error) {
      console.error('Error extracting fields:', error);
      throw error;
    }
  }

  /**
   * Fill fields in the active tab
   * @param {Object} fieldValues - Mapping of selector to value
   * @returns {Promise<Object>}
   */
  static async fillFields(fieldValues) {
    try {
      const response = await this.sendToActiveTab({
        action: 'fill_fields',
        data: { fieldValues }
      });

      if (!response || !response.success) {
        throw new Error(response?.error || 'Failed to fill fields');
      }

      return {
        filled: response.filled || 0,
        failed: response.failed || 0,
        results: response.results || []
      };
    } catch (error) {
      console.error('Error filling fields:', error);
      throw error;
    }
  }
}
