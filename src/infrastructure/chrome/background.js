/**
 * Background Service Worker
 *
 * Main background script that coordinates between popup and content scripts.
 * Handles Profile and Random fill modes.
 */
import { ProfileFillUseCase } from '../../application/useCases/ProfileFillUseCase.js';
import { RandomFillUseCase } from '../../application/useCases/RandomFillUseCase.js';

console.log('SmartForm Auto-Filler background service worker loaded');

/**
 * Message handler for extension communication
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);

  switch (request.action) {
    case 'profile_fill':
      handleProfileFill(request, sender, sendResponse);
      return true; // Keep channel open for async response

    case 'random_fill':
      handleRandomFill(request, sender, sendResponse);
      return false; // Synchronous response

    case 'content_ready':
      handleContentReady(request, sender);
      return false;

    case 'ping':
      sendResponse({ status: 'ready' });
      return false;

    default:
      sendResponse({ success: false, error: 'Unknown action' });
      return false;
  }
});

/**
 * Handle profile fill request from popup
 * Uses ProfileFillUseCase to fill with user profile data
 * @param {Object} request
 * @param {Object} sender
 * @param {Function} sendResponse
 */
async function handleProfileFill(request, sender, sendResponse) {
  try {
    const { fields } = request;

    console.log('Profile fill request:', {
      fieldCount: fields?.length
    });

    // Validate input
    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      throw new Error('No fields provided');
    }

    // Execute the use case (async - loads profile from storage)
    const useCase = new ProfileFillUseCase();
    const result = await useCase.execute({ fields });

    console.log('Profile fill complete:', {
      success: result.success,
      valueCount: Object.keys(result.fieldValues || {}).length
    });

    // Send result back to popup
    sendResponse(result);

  } catch (error) {
    console.error('Error in handleProfileFill:', error);

    sendResponse({
      success: false,
      fieldValues: {},
      error: error.message || 'Failed to fill with profile data'
    });
  }
}

/**
 * Handle random fill request from popup
 * Uses RandomFillUseCase for random data generation
 * @param {Object} request
 * @param {Object} sender
 * @param {Function} sendResponse
 */
function handleRandomFill(request, sender, sendResponse) {
  try {
    const { fields } = request;

    console.log('Random fill request:', {
      fieldCount: fields?.length
    });

    // Validate input
    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      throw new Error('No fields provided');
    }

    // Execute the use case (synchronous)
    const useCase = new RandomFillUseCase();
    const result = useCase.execute({ fields });

    console.log('Random fill complete:', {
      success: result.success,
      valueCount: Object.keys(result.fieldValues || {}).length
    });

    // Send result back to popup
    sendResponse(result);

  } catch (error) {
    console.error('Error in handleRandomFill:', error);

    sendResponse({
      success: false,
      fieldValues: {},
      error: error.message || 'Failed to generate random fill data'
    });
  }
}

/**
 * Handle content script ready notification
 * @param {Object} request
 * @param {Object} sender
 */
function handleContentReady(request, sender) {
  console.log('Content script ready:', {
    tabId: sender.tab?.id,
    url: request.url
  });
}

/**
 * Extension installation handler
 */
chrome.runtime.onInstalled.addListener((details) => {
  console.log('SmartForm Auto-Filler installed:', details.reason);

  if (details.reason === 'install') {
    // First time installation - initialize storage
    chrome.storage.local.set({
      profile: {
        name: '',
        email: '',
        phone: '',
        address: '',
        company: '',
        jobTitle: '',
        bio: ''
      }
    });

    console.log('Storage initialized');
  }
});
