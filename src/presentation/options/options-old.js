/**
 * Options Page Script
 *
 * Handles saving/loading of settings and user profile.
 * All data is stored in chrome.storage.local.
 */

console.log('SmartForm Auto-Filler options page loaded');

// DOM Elements
const elements = {
  // Navigation
  backBtn: document.getElementById('backBtn'),

  // Status
  statusMessage: document.getElementById('statusMessage'),

  // API Configuration
  apiKey: document.getElementById('apiKey'),
  toggleApiKey: document.getElementById('toggleApiKey'),
  testConnection: document.getElementById('testConnection'),
  testResult: document.getElementById('testResult'),

  // User Profile
  name: document.getElementById('name'),
  email: document.getElementById('email'),
  phone: document.getElementById('phone'),
  address: document.getElementById('address'),
  company: document.getElementById('company'),
  jobTitle: document.getElementById('jobTitle'),
  bio: document.getElementById('bio'),

  // Actions
  saveSettings: document.getElementById('saveSettings'),
  clearData: document.getElementById('clearData')
};

/**
 * Initialize the page
 */
async function init() {
  await loadSettings();
  attachEventListeners();
}

/**
 * Load settings from storage
 */
async function loadSettings() {
  try {
    const data = await chrome.storage.local.get(['settings', 'profile']);

    // Load API settings
    if (data.settings && data.settings.apiKey) {
      elements.apiKey.value = data.settings.apiKey;
    }

    // Load profile
    if (data.profile) {
      elements.name.value = data.profile.name || '';
      elements.email.value = data.profile.email || '';
      elements.phone.value = data.profile.phone || '';
      elements.address.value = data.profile.address || '';
      elements.company.value = data.profile.company || '';
      elements.jobTitle.value = data.profile.jobTitle || '';
      elements.bio.value = data.profile.bio || '';
    }

    console.log('Settings loaded successfully');
  } catch (error) {
    console.error('Error loading settings:', error);
    showStatus('Error loading settings', 'error');
  }
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
  // Back button
  elements.backBtn.addEventListener('click', handleBack);

  // Toggle API key visibility
  elements.toggleApiKey.addEventListener('click', toggleApiKeyVisibility);

  // Test connection
  elements.testConnection.addEventListener('click', testApiConnection);

  // Save settings
  elements.saveSettings.addEventListener('click', saveSettings);

  // Clear data
  elements.clearData.addEventListener('click', clearAllData);
}

/**
 * Handle back button click - redirect to extension popup
 */
function handleBack() {
  // Try to open the popup, then close this options page
  chrome.action.openPopup().catch(() => {
    // If openPopup fails (some browsers don't support it), just close
    window.close();
  });
}

/**
 * Toggle API key visibility
 */
function toggleApiKeyVisibility() {
  const type = elements.apiKey.type;
  elements.apiKey.type = type === 'password' ? 'text' : 'password';
  elements.toggleApiKey.textContent = type === 'password' ? '🙈' : '👁️';
}

/**
 * Test API connection
 */
async function testApiConnection() {
  const apiKey = elements.apiKey.value.trim();

  if (!apiKey) {
    showTestResult('Please enter an API key first', 'error');
    return;
  }

  // Disable button and show loading
  elements.testConnection.disabled = true;
  elements.testConnection.textContent = 'Testing...';
  showTestResult('Connecting to OpenAI...', 'loading');

  try {
    // Send test request to background script
    const response = await chrome.runtime.sendMessage({
      action: 'test_api_key',
      apiKey: apiKey
    });

    if (response.success) {
      showTestResult('✓ Connection successful!', 'success');
    } else {
      showTestResult(`✗ ${response.error || 'Connection failed'}`, 'error');
    }
  } catch (error) {
    console.error('Test connection error:', error);
    showTestResult(`✗ ${error.message}`, 'error');
  } finally {
    elements.testConnection.disabled = false;
    elements.testConnection.textContent = 'Test Connection';
  }
}

/**
 * Show test result
 */
function showTestResult(message, type) {
  elements.testResult.textContent = message;
  elements.testResult.className = `test-result ${type}`;

  // Clear after 5 seconds
  setTimeout(() => {
    elements.testResult.textContent = '';
    elements.testResult.className = 'test-result';
  }, 5000);
}

/**
 * Save all settings
 */
async function saveSettings() {
  try {
    // Disable button
    elements.saveSettings.disabled = true;
    elements.saveSettings.textContent = 'Saving...';

    // Collect settings data
    const settings = {
      apiKey: elements.apiKey.value.trim()
    };

    // Collect profile data
    const profile = {
      name: elements.name.value.trim(),
      email: elements.email.value.trim(),
      phone: elements.phone.value.trim(),
      address: elements.address.value.trim(),
      company: elements.company.value.trim(),
      jobTitle: elements.jobTitle.value.trim(),
      bio: elements.bio.value.trim()
    };

    // Validate API key only if provided
    if (settings.apiKey && !settings.apiKey.startsWith('sk-')) {
      showStatus('Invalid API key format. OpenAI API keys start with "sk-"', 'error');
      return;
    }

    // Check if at least something is being saved
    const hasApiKey = !!settings.apiKey;
    const hasProfile = Object.values(profile).some(value => value !== '');

    if (!hasApiKey && !hasProfile) {
      showStatus('Please enter either an API key or profile information', 'error');
      return;
    }

    // Save to storage
    await chrome.storage.local.set({
      settings: settings,
      profile: profile
    });

    console.log('Settings saved successfully');

    // Show appropriate success message
    if (hasApiKey && hasProfile) {
      showStatus('Settings and profile saved successfully!', 'success');
    } else if (hasApiKey) {
      showStatus('API key saved successfully!', 'success');
    } else {
      showStatus('Profile saved successfully!', 'success');
    }

  } catch (error) {
    console.error('Error saving settings:', error);
    showStatus(`Error saving settings: ${error.message}`, 'error');
  } finally {
    elements.saveSettings.disabled = false;
    elements.saveSettings.textContent = 'Save All Settings';
  }
}

/**
 * Clear all data
 */
async function clearAllData() {
  const confirmed = confirm(
    'Are you sure you want to clear all data?\n\n' +
    'This will remove:\n' +
    '- Your API key\n' +
    '- Your profile information\n' +
    '- All settings\n\n' +
    'This action cannot be undone.'
  );

  if (!confirmed) {
    return;
  }

  try {
    // Clear storage
    await chrome.storage.local.clear();

    // Clear form fields
    elements.apiKey.value = '';
    elements.name.value = '';
    elements.email.value = '';
    elements.phone.value = '';
    elements.address.value = '';
    elements.company.value = '';
    elements.jobTitle.value = '';
    elements.bio.value = '';

    console.log('All data cleared');
    showStatus('All data cleared successfully', 'info');

  } catch (error) {
    console.error('Error clearing data:', error);
    showStatus(`Error clearing data: ${error.message}`, 'error');
  }
}

/**
 * Show status message
 */
function showStatus(message, type = 'info') {
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = `status-message ${type}`;

  // Auto-hide after 5 seconds
  setTimeout(() => {
    elements.statusMessage.classList.add('hidden');
  }, 5000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
