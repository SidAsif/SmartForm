(() => {
  // src/infrastructure/chrome/MessagingService.js
  var MessagingService = class {
    /**
     * Send message to the active tab's content script
     * @param {Object} message
     * @returns {Promise<any>}
     */
    static async sendToActiveTab(message) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.id) {
          throw new Error("No active tab found");
        }
        const response = await chrome.tabs.sendMessage(tab.id, message);
        return response;
      } catch (error) {
        console.error("Error sending message to active tab:", error);
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
        console.error("Error sending message to background:", error);
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
          throw new Error("No active tab found");
        }
        return tab;
      } catch (error) {
        console.error("Error getting active tab:", error);
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
        if (tab.url.startsWith("chrome://") || tab.url.startsWith("edge://") || tab.url.startsWith("about:")) {
          throw new Error("Cannot inject scripts on browser pages");
        }
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"]
        });
        console.log("Content script injected successfully");
      } catch (error) {
        console.error("Error injecting content script:", error);
        throw error;
      }
    }
    /**
     * Check if content script is ready in the active tab
     * @returns {Promise<boolean>}
     */
    static async isContentScriptReady() {
      try {
        const response = await this.sendToActiveTab({ action: "ping" });
        return response && response.status === "ready";
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
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
    /**
     * Extract fields from the active tab
     * @returns {Promise<Array>}
     */
    static async extractFields() {
      try {
        let isReady = await this.isContentScriptReady();
        if (!isReady) {
          console.log("Content script not ready, injecting...");
          await this.injectContentScript();
          isReady = await this.waitForContentScript();
          if (!isReady) {
            throw new Error("Content script failed to initialize. Please try again.");
          }
        }
        const response = await this.sendToActiveTab({ action: "extract_fields" });
        if (!response || !response.success) {
          throw new Error(response?.error || "Failed to extract fields");
        }
        return response.fields || [];
      } catch (error) {
        console.error("Error extracting fields:", error);
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
          action: "fill_fields",
          data: { fieldValues }
        });
        if (!response || !response.success) {
          throw new Error(response?.error || "Failed to fill fields");
        }
        return {
          filled: response.filled || 0,
          failed: response.failed || 0,
          results: response.results || []
        };
      } catch (error) {
        console.error("Error filling fields:", error);
        throw error;
      }
    }
  };

  // src/presentation/popup/popup.js
  var elements = {
    profileFillBtn: null,
    randomFillBtn: null,
    statusArea: null,
    statusMessage: null,
    fieldCount: null,
    fieldCountValue: null,
    settingsLink: null
  };
  var extractedFields = [];
  var isProcessing = false;
  async function init() {
    elements.profileFillBtn = document.getElementById("profileFillBtn");
    elements.randomFillBtn = document.getElementById("randomFillBtn");
    elements.statusArea = document.getElementById("statusArea");
    elements.statusMessage = document.getElementById("statusMessage");
    elements.fieldCount = document.getElementById("fieldCount");
    elements.fieldCountValue = document.getElementById("fieldCountValue");
    elements.settingsLink = document.getElementById("settingsLink");
    elements.profileFillBtn.addEventListener("click", handleProfileFill);
    elements.randomFillBtn.addEventListener("click", handleRandomFill);
    elements.settingsLink.addEventListener("click", handleSettingsClick);
    await extractFieldsFromPage();
  }
  async function extractFieldsFromPage() {
    try {
      showStatus("Detecting form fields...", "loading");
      const fields = await MessagingService.extractFields();
      extractedFields = fields;
      if (fields.length === 0) {
        showStatus("No form fields detected on this page.", "info");
        disableButtons();
      } else {
        showFieldCount(fields.length);
        hideStatus();
        enableButtons();
      }
    } catch (error) {
      console.error("Error extracting fields:", error);
      if (error.message && error.message.includes("Could not establish connection")) {
        showStatus(
          "Cannot run on this page. Extension works on regular websites only.",
          "info"
        );
      } else if (error.message && error.message.includes("Cannot inject scripts on browser pages")) {
        showStatus(
          "Cannot run on browser pages. Please open a website with forms.",
          "info"
        );
      } else {
        showStatus(
          `Error: ${error.message || "Could not detect form fields. Please refresh the page."}`,
          "error"
        );
      }
      disableButtons();
    }
  }
  async function handleProfileFill() {
    if (isProcessing)
      return;
    if (extractedFields.length === 0) {
      showStatus("No form fields detected on this page.", "error");
      return;
    }
    try {
      isProcessing = true;
      setButtonLoading(elements.profileFillBtn, true);
      showStatus("Filling form with your profile data...", "loading");
      const result = await chrome.runtime.sendMessage({
        action: "profile_fill",
        fields: extractedFields
      });
      if (result.success && result.fieldValues) {
        const fillResult = await chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
          return chrome.tabs.sendMessage(tabs[0].id, {
            action: "fill_fields",
            data: result.fieldValues
          });
        });
        showStatus(
          `Profile fill complete! Filled ${fillResult.filled || 0} fields.`,
          "success"
        );
      } else {
        throw new Error(result.error || "Profile fill failed");
      }
    } catch (error) {
      console.error("Profile fill error:", error);
      showStatus(
        `Error: ${error.message || "Failed to fill with profile"}`,
        "error"
      );
    } finally {
      isProcessing = false;
      setButtonLoading(elements.profileFillBtn, false);
    }
  }
  async function handleRandomFill() {
    if (isProcessing)
      return;
    if (extractedFields.length === 0) {
      showStatus("No form fields detected on this page.", "error");
      return;
    }
    try {
      isProcessing = true;
      setButtonLoading(elements.randomFillBtn, true);
      showStatus("Filling form with random data...", "loading");
      const result = await chrome.runtime.sendMessage({
        action: "random_fill",
        fields: extractedFields
      });
      if (result.success && result.fieldValues) {
        const fillResult = await chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
          return chrome.tabs.sendMessage(tabs[0].id, {
            action: "fill_fields",
            data: result.fieldValues
          });
        });
        showStatus(
          `Random fill complete! Filled ${fillResult.filled || 0} fields.`,
          "success"
        );
      } else {
        throw new Error(result.error || "Random fill failed");
      }
    } catch (error) {
      console.error("Random fill error:", error);
      showStatus(
        `Error: ${error.message || "Failed to random fill"}`,
        "error"
      );
    } finally {
      isProcessing = false;
      setButtonLoading(elements.randomFillBtn, false);
    }
  }
  function handleSettingsClick(e) {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  }
  function showStatus(message, type = "info") {
    elements.statusArea.className = `status-area ${type}`;
    elements.statusMessage.textContent = message;
  }
  function hideStatus() {
    elements.statusArea.classList.add("hidden");
  }
  function showFieldCount(count) {
    elements.fieldCountValue.textContent = count;
    elements.fieldCount.classList.remove("hidden");
  }
  function setButtonLoading(button, loading) {
    if (loading) {
      button.classList.add("loading");
      button.disabled = true;
    } else {
      button.classList.remove("loading");
      button.disabled = false;
    }
  }
  function enableButtons() {
    elements.profileFillBtn.disabled = false;
    elements.randomFillBtn.disabled = false;
  }
  function disableButtons() {
    elements.profileFillBtn.disabled = true;
    elements.randomFillBtn.disabled = true;
  }
  document.addEventListener("DOMContentLoaded", init);
})();
