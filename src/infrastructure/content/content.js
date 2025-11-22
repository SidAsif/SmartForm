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

// Store extracted fields with their container references (needed for Google Forms)
let extractedFieldsData = {};

/**
 * Handle field extraction request
 * @param {Function} sendResponse
 */
function handleExtractFields(sendResponse) {
  try {
    const useCase = new ExtractFieldsUseCase();
    const result = useCase.execute();

    console.log('Extracted fields:', result);

    // Store fields data locally (with DOM references that can't be serialized)
    extractedFieldsData = {};
    result.fields.forEach(field => {
      extractedFieldsData[field.selector] = field;
    });

    console.log(`[Content] Stored ${Object.keys(extractedFieldsData).length} fields locally`);

    // Send back fields without the _container property (it can't be serialized)
    const fieldsToSend = result.fields.map(field => {
      const { _container, ...serializableField } = field;
      return serializableField;
    });

    sendResponse({
      success: true,
      fields: fieldsToSend,
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
      fieldCount: Object.keys(data || {}).length,
      hasStoredFieldsData: Object.keys(extractedFieldsData).length > 0
    });

    // Validate input
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid field data provided');
    }

    // Execute the fill fields use case with stored fields data
    const useCase = new FillFieldsUseCase();
    const result = useCase.execute({
      fieldValues: data,
      fieldsData: extractedFieldsData // Pass the stored fields data with DOM references
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
 * Notify background that content script is ready
 */
function notifyReady() {
  chrome.runtime.sendMessage({
    action: 'content_ready',
    url: window.location.href
  }).catch(() => {
    // Ignore errors if background script isn't ready
  });
}

// Initialize
notifyReady();
