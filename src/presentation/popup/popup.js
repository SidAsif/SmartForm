/**
 * Popup Script
 *
 * Presentation layer for the extension popup.
 * Handles UI interactions and coordinates with messaging service.
 */
import { MessagingService } from '../../infrastructure/chrome/MessagingService.js';

// UI Elements
const elements = {
  profileFillBtn: null,
  randomFillBtn: null,
  statusArea: null,
  statusMessage: null,
  fieldCount: null,
  fieldCountValue: null,
  settingsLink: null
};

// State
let extractedFields = [];
let isProcessing = false;

/**
 * Initialize the popup
 */
async function init() {
  // Get DOM elements
  elements.profileFillBtn = document.getElementById('profileFillBtn');
  elements.randomFillBtn = document.getElementById('randomFillBtn');
  elements.statusArea = document.getElementById('statusArea');
  elements.statusMessage = document.getElementById('statusMessage');
  elements.fieldCount = document.getElementById('fieldCount');
  elements.fieldCountValue = document.getElementById('fieldCountValue');
  elements.settingsLink = document.getElementById('settingsLink');

  // Attach event listeners
  elements.profileFillBtn.addEventListener('click', handleProfileFill);
  elements.randomFillBtn.addEventListener('click', handleRandomFill);
  elements.settingsLink.addEventListener('click', handleSettingsClick);

  // Extract fields on load
  await extractFieldsFromPage();
}

/**
 * Extract fields from the current page
 */
async function extractFieldsFromPage() {
  try {
    showStatus('Detecting form fields...', 'loading');

    const fields = await MessagingService.extractFields();

    extractedFields = fields;

    if (fields.length === 0) {
      showStatus('No form fields detected on this page.', 'info');
      disableButtons();
    } else {
      showFieldCount(fields.length);
      hideStatus();
      enableButtons();
    }
  } catch (error) {
    console.error('Error extracting fields:', error);

    // Check if it's a connection error (normal on chrome:// pages)
    if (error.message && error.message.includes('Could not establish connection')) {
      showStatus(
        'Cannot run on this page. Extension works on regular websites only.',
        'info'
      );
    } else if (error.message && error.message.includes('Cannot inject scripts on browser pages')) {
      showStatus(
        'Cannot run on browser pages. Please open a website with forms.',
        'info'
      );
    } else {
      showStatus(
        `Error: ${error.message || 'Could not detect form fields. Please refresh the page.'}`,
        'error'
      );
    }

    disableButtons();
  }
}

/**
 * Handle Profile Fill button click (no AI)
 */
async function handleProfileFill() {
  if (isProcessing) return;

  if (extractedFields.length === 0) {
    showStatus('No form fields detected on this page.', 'error');
    return;
  }

  try {
    isProcessing = true;
    setButtonLoading(elements.profileFillBtn, true);
    showStatus('Filling form with your profile data...', 'loading');

    // Send to background for profile fill (no AI)
    const result = await chrome.runtime.sendMessage({
      action: 'profile_fill',
      fields: extractedFields
    });

    if (result.success && result.fieldValues) {
      // Send fill request to content script
      const fillResult = await chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
        return chrome.tabs.sendMessage(tabs[0].id, {
          action: 'fill_fields',
          data: result.fieldValues
        });
      });

      showStatus(
        `Profile fill complete! Filled ${fillResult.filled || 0} fields.`,
        'success'
      );
    } else {
      throw new Error(result.error || 'Profile fill failed');
    }
  } catch (error) {
    console.error('Profile fill error:', error);
    showStatus(
      `Error: ${error.message || 'Failed to fill with profile'}`,
      'error'
    );
  } finally {
    isProcessing = false;
    setButtonLoading(elements.profileFillBtn, false);
  }
}

/**
 * Handle Random Fill button click (no AI)
 */
async function handleRandomFill() {
  if (isProcessing) return;

  if (extractedFields.length === 0) {
    showStatus('No form fields detected on this page.', 'error');
    return;
  }

  try {
    isProcessing = true;
    setButtonLoading(elements.randomFillBtn, true);
    showStatus('Filling form with random data...', 'loading');

    // Send to background for random fill (no AI)
    const result = await chrome.runtime.sendMessage({
      action: 'random_fill',
      fields: extractedFields
    });

    if (result.success && result.fieldValues) {
      // Send fill request to content script
      const fillResult = await chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
        return chrome.tabs.sendMessage(tabs[0].id, {
          action: 'fill_fields',
          data: result.fieldValues
        });
      });

      showStatus(
        `Random fill complete! Filled ${fillResult.filled || 0} fields.`,
        'success'
      );
    } else {
      throw new Error(result.error || 'Random fill failed');
    }
  } catch (error) {
    console.error('Random fill error:', error);
    showStatus(
      `Error: ${error.message || 'Failed to random fill'}`,
      'error'
    );
  } finally {
    isProcessing = false;
    setButtonLoading(elements.randomFillBtn, false);
  }
}


/**
 * Handle settings link click
 * @param {Event} e
 */
function handleSettingsClick(e) {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
}

/**
 * Show status message
 * @param {string} message
 * @param {string} type - 'success', 'error', 'info', 'loading'
 */
function showStatus(message, type = 'info') {
  elements.statusArea.className = `status-area ${type}`;
  elements.statusMessage.textContent = message;
}

/**
 * Hide status message
 */
function hideStatus() {
  elements.statusArea.classList.add('hidden');
}

/**
 * Show field count
 * @param {number} count
 */
function showFieldCount(count) {
  elements.fieldCountValue.textContent = count;
  elements.fieldCount.classList.remove('hidden');
}

/**
 * Set button loading state
 * @param {HTMLButtonElement} button
 * @param {boolean} loading
 */
function setButtonLoading(button, loading) {
  if (loading) {
    button.classList.add('loading');
    button.disabled = true;
  } else {
    button.classList.remove('loading');
    button.disabled = false;
  }
}

/**
 * Enable action buttons
 */
function enableButtons() {
  elements.profileFillBtn.disabled = false;
  elements.randomFillBtn.disabled = false;
}

/**
 * Disable action buttons
 */
function disableButtons() {
  elements.profileFillBtn.disabled = true;
  elements.randomFillBtn.disabled = true;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
