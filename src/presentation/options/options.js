/**
 * Options Page Script - Multi-Profile Version
 *
 * Handles:
 * - Multiple profile management
 * - Custom fields for each profile
 * - Active profile selection
 * - API settings
 */

import { StorageService } from '../../infrastructure/chrome/StorageService.js';
import { UserProfile } from '../../domain/entities/UserProfile.js';

console.log('SmartForm Auto-Filler options page loaded');

// DOM Elements
const elements = {
  // Navigation
  backBtn: null,

  // Profile Management
  activeProfile: null,
  addProfile: null,
  saveProfile: null,
  deleteProfile: null,
  profileName: null,

  // Status
  actionStatusMessage: null,

  // API Configuration - Commented out for v1.0.0
  // apiKey: null,
  // toggleApiKey: null,
  // testConnection: null,
  // testResult: null,

  // Standard Profile Fields
  name: null,
  email: null,
  phone: null,
  address: null,
  company: null,
  jobTitle: null,
  bio: null,

  // Custom Fields
  addCustomField: null,
  customFieldsList: null
};

// State
let currentProfile = null;
let allProfiles = [];

/**
 * Initialize the page
 */
async function init() {
  // Get DOM elements
  elements.backBtn = document.getElementById('backBtn');
  elements.activeProfile = document.getElementById('activeProfile');
  elements.addProfile = document.getElementById('addProfile');
  elements.saveProfile = document.getElementById('saveProfile');
  elements.deleteProfile = document.getElementById('deleteProfile');
  elements.profileName = document.getElementById('profileName');
  elements.actionStatusMessage = document.getElementById('actionStatusMessage');
  // elements.apiKey = document.getElementById('apiKey');
  // elements.toggleApiKey = document.getElementById('toggleApiKey');
  // elements.testConnection = document.getElementById('testConnection');
  // elements.testResult = document.getElementById('testResult');
  elements.name = document.getElementById('name');
  elements.email = document.getElementById('email');
  elements.phone = document.getElementById('phone');
  elements.address = document.getElementById('address');
  elements.company = document.getElementById('company');
  elements.jobTitle = document.getElementById('jobTitle');
  elements.bio = document.getElementById('bio');
  elements.addCustomField = document.getElementById('addCustomField');
  elements.customFieldsList = document.getElementById('customFieldsList');

  // Attach event listeners
  attachEventListeners();

  // Load data
  await loadSettings();
  await loadProfiles();
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
  elements.backBtn.addEventListener('click', handleBack);
  elements.activeProfile.addEventListener('change', handleProfileChange);
  elements.addProfile.addEventListener('click', handleAddProfile);
  elements.saveProfile.addEventListener('click', handleSaveProfile);
  elements.deleteProfile.addEventListener('click', handleDeleteProfile);
  // elements.toggleApiKey.addEventListener('click', toggleApiKeyVisibility);
  // elements.testConnection.addEventListener('click', testApiConnection);
  elements.addCustomField.addEventListener('click', handleAddCustomField);
}

/**
 * Load API settings - Commented out for v1.0.0
 */
async function loadSettings() {
  // try {
  //   const settings = await StorageService.getSettings();
  //   if (settings && settings.apiKey) {
  //     elements.apiKey.value = settings.apiKey;
  //   }
  // } catch (error) {
  //   console.error('Error loading settings:', error);
  // }
}

/**
 * Load all profiles
 */
async function loadProfiles() {
  try {
    allProfiles = await StorageService.getAllProfiles();

    // If no profiles exist, create a default one
    if (allProfiles.length === 0) {
      const defaultProfile = new UserProfile({
        profileName: 'Default Profile',
        isActive: true
      });
      await StorageService.saveUserProfile(defaultProfile);
      allProfiles = [defaultProfile];
    }

    // Update profile selector
    updateProfileSelector();

    // Load active profile
    const activeProf = allProfiles.find(p => p.isActive) || allProfiles[0];
    if (activeProf) {
      loadProfileData(activeProf);
    }
  } catch (error) {
    console.error('Error loading profiles:', error);
    showStatus('Error loading profiles', 'error');
  }
}

/**
 * Update profile selector dropdown
 */
function updateProfileSelector() {
  elements.activeProfile.innerHTML = '';

  allProfiles.forEach(profile => {
    const option = document.createElement('option');
    option.value = profile.id;
    option.textContent = profile.profileName;
    if (profile.isActive) {
      option.selected = true;
    }
    elements.activeProfile.appendChild(option);
  });
}

/**
 * Load profile data into form
 */
function loadProfileData(profile) {
  currentProfile = profile;

  elements.profileName.value = profile.profileName || '';
  elements.name.value = profile.name || '';
  elements.email.value = profile.email || '';
  elements.phone.value = profile.phone || '';
  elements.address.value = profile.address || '';
  elements.company.value = profile.company || '';
  elements.jobTitle.value = profile.jobTitle || '';
  elements.bio.value = profile.bio || '';

  // Load custom fields
  elements.customFieldsList.innerHTML = '';
  if (profile.customFields && profile.customFields.length > 0) {
    profile.customFields.forEach(field => {
      addCustomFieldToUI(field.name, field.value, field.type);
    });
  }
}

/**
 * Handle profile change from dropdown
 */
async function handleProfileChange(e) {
  const profileId = e.target.value;

  if (!profileId) return;

  try {
    // Set as active profile
    await StorageService.setActiveProfile(profileId);

    // Reload profiles
    allProfiles = await StorageService.getAllProfiles();

    // Load selected profile
    const selectedProfile = allProfiles.find(p => p.id === profileId);
    if (selectedProfile) {
      loadProfileData(selectedProfile);
      showStatus('Active profile changed', 'success');
    }
  } catch (error) {
    console.error('Error changing profile:', error);
    showStatus('Error changing profile', 'error');
  }
}

/**
 * Handle add new profile
 */
function handleAddProfile() {
  const newProfile = new UserProfile({
    profileName: 'New Profile',
    isActive: false
  });

  allProfiles.push(newProfile);
  currentProfile = newProfile;

  updateProfileSelector();
  loadProfileData(newProfile);

  showStatus('New profile created. Remember to save!', 'info');
}

/**
 * Handle save profile
 */
async function handleSaveProfile() {
  try {
    if (!currentProfile) {
      showStatus('No profile selected', 'error');
      return;
    }

    // Update profile with form data
    currentProfile.profileName = elements.profileName.value.trim() || 'Unnamed Profile';
    currentProfile.name = elements.name.value.trim();
    currentProfile.email = elements.email.value.trim();
    currentProfile.phone = elements.phone.value.trim();
    currentProfile.address = elements.address.value.trim();
    currentProfile.company = elements.company.value.trim();
    currentProfile.jobTitle = elements.jobTitle.value.trim();
    currentProfile.bio = elements.bio.value.trim();

    // Collect custom fields
    currentProfile.customFields = [];
    const customFieldItems = elements.customFieldsList.querySelectorAll('.custom-field-item');
    customFieldItems.forEach(item => {
      const nameInput = item.querySelector('.field-name');
      const valueInput = item.querySelector('.field-value');
      const typeSelect = item.querySelector('.field-type');

      if (nameInput && valueInput && nameInput.value.trim()) {
        currentProfile.customFields.push({
          name: nameInput.value.trim(),
          value: valueInput.value.trim(),
          type: typeSelect ? typeSelect.value : 'text'
        });
      }
    });

    // Save profile
    await StorageService.saveUserProfile(currentProfile);

    // Also save API key - Commented out for v1.0.0
    // const apiKey = elements.apiKey.value.trim();
    // if (apiKey) {
    //   await StorageService.saveApiKey(apiKey);
    // }

    // Reload profiles
    allProfiles = await StorageService.getAllProfiles();
    updateProfileSelector();

    showStatus('Profile saved successfully!', 'success');
  } catch (error) {
    console.error('Error saving profile:', error);
    showStatus('Error saving profile: ' + error.message, 'error');
  }
}

/**
 * Handle delete profile
 */
async function handleDeleteProfile() {
  if (!currentProfile) {
    showStatus('No profile selected', 'error');
    return;
  }

  if (allProfiles.length === 1) {
    showStatus('Cannot delete the last profile', 'error');
    return;
  }

  const confirmed = confirm(`Delete profile "${currentProfile.profileName}"?`);
  if (!confirmed) return;

  try {
    await StorageService.deleteProfile(currentProfile.id);

    // Reload profiles
    allProfiles = await StorageService.getAllProfiles();

    if (allProfiles.length > 0) {
      // Set first profile as active
      await StorageService.setActiveProfile(allProfiles[0].id);
      allProfiles = await StorageService.getAllProfiles();

      updateProfileSelector();
      loadProfileData(allProfiles[0]);
    }

    showStatus('Profile deleted successfully', 'success');
  } catch (error) {
    console.error('Error deleting profile:', error);
    showStatus('Error deleting profile', 'error');
  }
}

/**
 * Handle add custom field
 */
function handleAddCustomField() {
  addCustomFieldToUI('', '', 'text');
}

/**
 * Add custom field to UI
 */
function addCustomFieldToUI(name = '', value = '', type = 'text') {
  const fieldItem = document.createElement('div');
  fieldItem.className = 'custom-field-item';

  fieldItem.innerHTML = `
    <input type="text" class="field-name" placeholder="Field name" value="${escapeHtml(name)}">
    <select class="field-type">
      <option value="text" ${type === 'text' ? 'selected' : ''}>Text</option>
      <option value="number" ${type === 'number' ? 'selected' : ''}>Number</option>
      <option value="email" ${type === 'email' ? 'selected' : ''}>Email</option>
      <option value="tel" ${type === 'tel' ? 'selected' : ''}>Phone</option>
      <option value="url" ${type === 'url' ? 'selected' : ''}>URL</option>
      <option value="date" ${type === 'date' ? 'selected' : ''}>Date</option>
    </select>
    <input type="${type}" class="field-value" placeholder="Field value" value="${escapeHtml(value)}">
    <button type="button" class="btn-remove">Remove</button>
  `;

  // Add remove handler
  const removeBtn = fieldItem.querySelector('.btn-remove');
  removeBtn.addEventListener('click', () => {
    fieldItem.remove();
  });

  elements.customFieldsList.appendChild(fieldItem);
}

/**
 * Handle back button click
 */
function handleBack() {
  chrome.action.openPopup().catch(() => {
    window.close();
  });
}

/**
 * Toggle API key visibility - Commented out for v1.0.0
 */
// function toggleApiKeyVisibility() {
//   const type = elements.apiKey.type;
//   elements.apiKey.type = type === 'password' ? 'text' : 'password';
//   elements.toggleApiKey.textContent = type === 'password' ? '🙈' : '👁️';
// }

/**
 * Test API connection - Commented out for v1.0.0
 */
// async function testApiConnection() {
//   const apiKey = elements.apiKey.value.trim();
//
//   if (!apiKey) {
//     showTestResult('Please enter an API key first', 'error');
//     return;
//   }
//
//   elements.testConnection.disabled = true;
//   elements.testConnection.textContent = 'Testing...';
//   showTestResult('Connecting to OpenAI...', 'loading');
//
//   try {
//     const response = await chrome.runtime.sendMessage({
//       action: 'test_api_key',
//       apiKey: apiKey
//     });
//
//     if (response.success) {
//       showTestResult('✓ Connection successful!', 'success');
//     } else {
//       showTestResult(`✗ ${response.error || 'Connection failed'}`, 'error');
//     }
//   } catch (error) {
//     console.error('Test connection error:', error);
//     showTestResult(`✗ ${error.message}`, 'error');
//   } finally {
//     elements.testConnection.disabled = false;
//     elements.testConnection.textContent = 'Test Connection';
//   }
// }

/**
 * Show test result - Commented out for v1.0.0
 */
// function showTestResult(message, type) {
//   elements.testResult.textContent = message;
//   elements.testResult.className = `test-result ${type}`;
//
//   setTimeout(() => {
//     elements.testResult.textContent = '';
//     elements.testResult.className = 'test-result';
//   }, 5000);
// }

/**
 * Show status message
 */
function showStatus(message, type = 'info') {
  elements.actionStatusMessage.textContent = message;
  elements.actionStatusMessage.className = `action-status ${type}`;

  setTimeout(() => {
    elements.actionStatusMessage.classList.add('hidden');
  }, 5000);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
