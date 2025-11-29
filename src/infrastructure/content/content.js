/**
 * Content Script
 *
 * Main entry point for the content script that runs on all web pages.
 * Handles communication with the extension popup and coordinates field extraction/filling.
 */
import { ExtractFieldsUseCase } from '../../application/useCases/ExtractFieldsUseCase.js';
import { FillFieldsUseCase } from '../../application/useCases/FillFieldsUseCase.js';

console.log('SmartForm Auto-Filler content script loaded');

/**
 * Message handler for communication with popup/background
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);

  switch (request.action) {
    case 'extract_fields':
      handleExtractFields(sendResponse);
      return true; // Keep channel open for async response

    case 'fill_fields':
      handleFillFields(request.data, sendResponse);
      return true;

    case 'ping':
      sendResponse({ status: 'ready' });
      return false;

    default:
      sendResponse({ success: false, error: 'Unknown action' });
      return false;
  }
});

/**
 * Handle field extraction request
 * @param {Function} sendResponse
 */
function handleExtractFields(sendResponse) {
  try {
    const useCase = new ExtractFieldsUseCase();
    const result = useCase.execute();

    console.log('Extracted fields:', result);

    sendResponse({
      success: true,
      fields: result.fields,
      count: result.count,
      stats: result.stats
    });
  } catch (error) {
    console.error('Error extracting fields:', error);

    sendResponse({
      success: false,
      error: error.message,
      fields: []
    });
  }
}

/**
 * Handle fill fields request
 * @param {Object} data - Contains fieldValues: { selector: value }
 * @param {Function} sendResponse
 */
function handleFillFields(data, sendResponse) {
  try {
    console.log('Filling fields with data:', {
      fieldCount: Object.keys(data || {}).length
    });

    // Validate input
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid field data provided');
    }

    // Execute the fill fields use case
    const useCase = new FillFieldsUseCase();
    const result = useCase.execute({
      fieldValues: data
    });

    console.log('Field filling complete:', result);

    sendResponse(result);

  } catch (error) {
    console.error('Error filling fields:', error);

    sendResponse({
      success: false,
      filled: 0,
      error: error.message
    });
  }
}

/**
 * Notify background that content script is ready and update badge with field count
 */
function notifyReady() {
  chrome.runtime.sendMessage({
    action: 'content_ready',
    url: window.location.href
  }).catch(() => {
    // Ignore errors if background script isn't ready
  });

  // Update badge with number of detected fields
  updateBadge();
}

/**
 * Update extension badge with number of form fields detected on the page
 */
function updateBadge() {
  try {
    const useCase = new ExtractFieldsUseCase();
    const result = useCase.execute();

    // Send field count to background for badge update
    chrome.runtime.sendMessage({
      action: 'update_badge',
      count: result.count
    }).catch(() => {
      // Ignore errors if background script isn't ready
    });
  } catch (error) {
    console.error('Error updating badge:', error);
  }
}

// Initialize
notifyReady();

// Update badge when page changes (for SPAs)
let lastUrl = window.location.href;
new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    updateBadge();
  }
}).observe(document.body, { childList: true, subtree: true });
