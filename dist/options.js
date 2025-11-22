(() => {
  // src/domain/entities/UserProfile.js
  var UserProfile = class _UserProfile {
    /**
     * @param {Object} params
     * @param {string} [params.id] - Unique profile ID
     * @param {string} [params.profileName] - Name of the profile (e.g., "Work", "Personal")
     * @param {boolean} [params.isActive] - Whether this profile is currently active
     * @param {string} [params.name] - User's full name
     * @param {string} [params.email] - User's email address
     * @param {string} [params.phone] - User's phone number
     * @param {string} [params.address] - User's address
     * @param {string} [params.company] - User's company name
     * @param {string} [params.jobTitle] - User's job title
     * @param {string} [params.bio] - User's bio or description
     * @param {Array} [params.customFields] - Array of custom fields {name, value, type}
     */
    constructor({
      id = null,
      profileName = "Default Profile",
      isActive = false,
      name = "",
      email = "",
      phone = "",
      address = "",
      company = "",
      jobTitle = "",
      bio = "",
      customFields = []
    } = {}) {
      this.id = id || this.generateId();
      this.profileName = profileName;
      this.isActive = isActive;
      this.name = name;
      this.email = email;
      this.phone = phone;
      this.address = address;
      this.company = company;
      this.jobTitle = jobTitle;
      this.bio = bio;
      this.customFields = customFields;
    }
    /**
     * Generate a unique ID for the profile
     * @returns {string}
     */
    generateId() {
      return "profile_" + Date.now() + "_" + Math.random().toString(36).substring(2, 11);
    }
    /**
     * Check if profile has any data
     * @returns {boolean}
     */
    hasData() {
      const hasStandardFields = !!(this.name || this.email || this.phone || this.address || this.company || this.jobTitle || this.bio);
      const hasCustomFields = this.customFields && this.customFields.length > 0;
      return hasStandardFields || hasCustomFields;
    }
    /**
     * Get a custom field value by name
     * @param {string} fieldName
     * @returns {string|null}
     */
    getCustomField(fieldName) {
      const field = this.customFields.find((f) => f.name.toLowerCase() === fieldName.toLowerCase());
      return field ? field.value : null;
    }
    /**
     * Add or update a custom field
     * @param {string} name
     * @param {string} value
     * @param {string} type - 'text', 'number', 'email', 'tel', 'url', etc.
     */
    setCustomField(name, value, type = "text") {
      const existingIndex = this.customFields.findIndex((f) => f.name === name);
      if (existingIndex >= 0) {
        this.customFields[existingIndex] = { name, value, type };
      } else {
        this.customFields.push({ name, value, type });
      }
    }
    /**
     * Remove a custom field
     * @param {string} name
     */
    removeCustomField(name) {
      this.customFields = this.customFields.filter((f) => f.name !== name);
    }
    /**
     * Get profile as a formatted string for AI context
     * @returns {string}
     */
    toContextString() {
      const parts = [];
      if (this.name)
        parts.push(`Name: ${this.name}`);
      if (this.email)
        parts.push(`Email: ${this.email}`);
      if (this.phone)
        parts.push(`Phone: ${this.phone}`);
      if (this.address)
        parts.push(`Address: ${this.address}`);
      if (this.company)
        parts.push(`Company: ${this.company}`);
      if (this.jobTitle)
        parts.push(`Job Title: ${this.jobTitle}`);
      if (this.bio)
        parts.push(`Bio: ${this.bio}`);
      this.customFields.forEach((field) => {
        if (field.value) {
          parts.push(`${field.name}: ${field.value}`);
        }
      });
      return parts.join("\n");
    }
    /**
     * Convert to plain object for storage
     * @returns {Object}
     */
    toJSON() {
      return {
        id: this.id,
        profileName: this.profileName,
        isActive: this.isActive,
        name: this.name,
        email: this.email,
        phone: this.phone,
        address: this.address,
        company: this.company,
        jobTitle: this.jobTitle,
        bio: this.bio,
        customFields: this.customFields
      };
    }
    /**
     * Create UserProfile from plain object
     * @param {Object} data
     * @returns {UserProfile}
     */
    static fromJSON(data) {
      return new _UserProfile(data || {});
    }
    /**
     * Create an empty profile
     * @returns {UserProfile}
     */
    static empty() {
      return new _UserProfile();
    }
  };

  // src/infrastructure/chrome/StorageService.js
  var StorageService = class {
    /**
     * Get all profiles from storage
     * @returns {Promise<Array<UserProfile>>}
     */
    static async getAllProfiles() {
      try {
        const result = await chrome.storage.local.get("profiles");
        if (result.profiles && Array.isArray(result.profiles)) {
          return result.profiles.map((p) => UserProfile.fromJSON(p));
        }
        return [];
      } catch (error) {
        console.error("Error getting profiles:", error);
        return [];
      }
    }
    /**
     * Get active user profile from storage
     * @returns {Promise<UserProfile>}
     */
    static async getUserProfile() {
      try {
        const profiles = await this.getAllProfiles();
        const activeProfile = profiles.find((p) => p.isActive);
        if (activeProfile) {
          return activeProfile;
        }
        return profiles.length > 0 ? profiles[0] : UserProfile.empty();
      } catch (error) {
        console.error("Error getting user profile:", error);
        return UserProfile.empty();
      }
    }
    /**
     * Save all profiles to storage
     * @param {Array<UserProfile>} profiles
     * @returns {Promise<void>}
     */
    static async saveAllProfiles(profiles) {
      try {
        await chrome.storage.local.set({
          profiles: profiles.map((p) => p.toJSON())
        });
      } catch (error) {
        console.error("Error saving profiles:", error);
        throw error;
      }
    }
    /**
     * Save a single profile (add or update)
     * @param {UserProfile} profile
     * @returns {Promise<void>}
     */
    static async saveUserProfile(profile) {
      try {
        const profiles = await this.getAllProfiles();
        const existingIndex = profiles.findIndex((p) => p.id === profile.id);
        if (existingIndex >= 0) {
          profiles[existingIndex] = profile;
        } else {
          profiles.push(profile);
        }
        await this.saveAllProfiles(profiles);
      } catch (error) {
        console.error("Error saving user profile:", error);
        throw error;
      }
    }
    /**
     * Delete a profile by ID
     * @param {string} profileId
     * @returns {Promise<void>}
     */
    static async deleteProfile(profileId) {
      try {
        const profiles = await this.getAllProfiles();
        const filtered = profiles.filter((p) => p.id !== profileId);
        await this.saveAllProfiles(filtered);
      } catch (error) {
        console.error("Error deleting profile:", error);
        throw error;
      }
    }
    /**
     * Set active profile by ID
     * @param {string} profileId
     * @returns {Promise<void>}
     */
    static async setActiveProfile(profileId) {
      try {
        const profiles = await this.getAllProfiles();
        profiles.forEach((p) => {
          p.isActive = p.id === profileId;
        });
        await this.saveAllProfiles(profiles);
      } catch (error) {
        console.error("Error setting active profile:", error);
        throw error;
      }
    }
    /**
     * Get OpenAI API key from storage
     * @returns {Promise<string>}
     */
    static async getApiKey() {
      try {
        const result = await chrome.storage.local.get("settings");
        if (result.settings && result.settings.apiKey) {
          return result.settings.apiKey;
        }
        return "";
      } catch (error) {
        console.error("Error getting API key:", error);
        return "";
      }
    }
    /**
     * Save OpenAI API key to storage
     * @param {string} apiKey
     * @returns {Promise<void>}
     */
    static async saveApiKey(apiKey) {
      try {
        const result = await chrome.storage.local.get("settings");
        const settings = result.settings || {};
        settings.apiKey = apiKey;
        await chrome.storage.local.set({ settings });
      } catch (error) {
        console.error("Error saving API key:", error);
        throw error;
      }
    }
    /**
     * Get all settings
     * @returns {Promise<Object>}
     */
    static async getSettings() {
      try {
        const result = await chrome.storage.local.get("settings");
        return result.settings || {};
      } catch (error) {
        console.error("Error getting settings:", error);
        return {};
      }
    }
    /**
     * Save settings
     * @param {Object} settings
     * @returns {Promise<void>}
     */
    static async saveSettings(settings) {
      try {
        await chrome.storage.local.set({ settings });
      } catch (error) {
        console.error("Error saving settings:", error);
        throw error;
      }
    }
    /**
     * Clear all storage
     * @returns {Promise<void>}
     */
    static async clearAll() {
      try {
        await chrome.storage.local.clear();
      } catch (error) {
        console.error("Error clearing storage:", error);
        throw error;
      }
    }
  };

  // src/presentation/options/options.js
  console.log("SmartForm Auto-Filler options page loaded");
  var elements = {
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
  var currentProfile = null;
  var allProfiles = [];
  async function init() {
    elements.backBtn = document.getElementById("backBtn");
    elements.activeProfile = document.getElementById("activeProfile");
    elements.addProfile = document.getElementById("addProfile");
    elements.saveProfile = document.getElementById("saveProfile");
    elements.deleteProfile = document.getElementById("deleteProfile");
    elements.profileName = document.getElementById("profileName");
    elements.actionStatusMessage = document.getElementById("actionStatusMessage");
    elements.name = document.getElementById("name");
    elements.email = document.getElementById("email");
    elements.phone = document.getElementById("phone");
    elements.address = document.getElementById("address");
    elements.company = document.getElementById("company");
    elements.jobTitle = document.getElementById("jobTitle");
    elements.bio = document.getElementById("bio");
    elements.addCustomField = document.getElementById("addCustomField");
    elements.customFieldsList = document.getElementById("customFieldsList");
    attachEventListeners();
    await loadSettings();
    await loadProfiles();
  }
  function attachEventListeners() {
    elements.backBtn.addEventListener("click", handleBack);
    elements.activeProfile.addEventListener("change", handleProfileChange);
    elements.addProfile.addEventListener("click", handleAddProfile);
    elements.saveProfile.addEventListener("click", handleSaveProfile);
    elements.deleteProfile.addEventListener("click", handleDeleteProfile);
    elements.addCustomField.addEventListener("click", handleAddCustomField);
  }
  async function loadSettings() {
  }
  async function loadProfiles() {
    try {
      allProfiles = await StorageService.getAllProfiles();
      if (allProfiles.length === 0) {
        const defaultProfile = new UserProfile({
          profileName: "Default Profile",
          isActive: true
        });
        await StorageService.saveUserProfile(defaultProfile);
        allProfiles = [defaultProfile];
      }
      updateProfileSelector();
      const activeProf = allProfiles.find((p) => p.isActive) || allProfiles[0];
      if (activeProf) {
        loadProfileData(activeProf);
      }
    } catch (error) {
      console.error("Error loading profiles:", error);
      showStatus("Error loading profiles", "error");
    }
  }
  function updateProfileSelector() {
    elements.activeProfile.innerHTML = "";
    allProfiles.forEach((profile) => {
      const option = document.createElement("option");
      option.value = profile.id;
      option.textContent = profile.profileName;
      if (profile.isActive) {
        option.selected = true;
      }
      elements.activeProfile.appendChild(option);
    });
  }
  function loadProfileData(profile) {
    currentProfile = profile;
    elements.profileName.value = profile.profileName || "";
    elements.name.value = profile.name || "";
    elements.email.value = profile.email || "";
    elements.phone.value = profile.phone || "";
    elements.address.value = profile.address || "";
    elements.company.value = profile.company || "";
    elements.jobTitle.value = profile.jobTitle || "";
    elements.bio.value = profile.bio || "";
    elements.customFieldsList.innerHTML = "";
    if (profile.customFields && profile.customFields.length > 0) {
      profile.customFields.forEach((field) => {
        addCustomFieldToUI(field.name, field.value, field.type);
      });
    }
  }
  async function handleProfileChange(e) {
    const profileId = e.target.value;
    if (!profileId)
      return;
    try {
      await StorageService.setActiveProfile(profileId);
      allProfiles = await StorageService.getAllProfiles();
      const selectedProfile = allProfiles.find((p) => p.id === profileId);
      if (selectedProfile) {
        loadProfileData(selectedProfile);
        showStatus("Active profile changed", "success");
      }
    } catch (error) {
      console.error("Error changing profile:", error);
      showStatus("Error changing profile", "error");
    }
  }
  function handleAddProfile() {
    const newProfile = new UserProfile({
      profileName: "New Profile",
      isActive: false
    });
    allProfiles.push(newProfile);
    currentProfile = newProfile;
    updateProfileSelector();
    loadProfileData(newProfile);
    showStatus("New profile created. Remember to save!", "info");
  }
  async function handleSaveProfile() {
    try {
      if (!currentProfile) {
        showStatus("No profile selected", "error");
        return;
      }
      currentProfile.profileName = elements.profileName.value.trim() || "Unnamed Profile";
      currentProfile.name = elements.name.value.trim();
      currentProfile.email = elements.email.value.trim();
      currentProfile.phone = elements.phone.value.trim();
      currentProfile.address = elements.address.value.trim();
      currentProfile.company = elements.company.value.trim();
      currentProfile.jobTitle = elements.jobTitle.value.trim();
      currentProfile.bio = elements.bio.value.trim();
      currentProfile.customFields = [];
      const customFieldItems = elements.customFieldsList.querySelectorAll(".custom-field-item");
      customFieldItems.forEach((item) => {
        const nameInput = item.querySelector(".field-name");
        const valueInput = item.querySelector(".field-value");
        const typeSelect = item.querySelector(".field-type");
        if (nameInput && valueInput && nameInput.value.trim()) {
          currentProfile.customFields.push({
            name: nameInput.value.trim(),
            value: valueInput.value.trim(),
            type: typeSelect ? typeSelect.value : "text"
          });
        }
      });
      await StorageService.saveUserProfile(currentProfile);
      allProfiles = await StorageService.getAllProfiles();
      updateProfileSelector();
      showStatus("Profile saved successfully!", "success");
    } catch (error) {
      console.error("Error saving profile:", error);
      showStatus("Error saving profile: " + error.message, "error");
    }
  }
  async function handleDeleteProfile() {
    if (!currentProfile) {
      showStatus("No profile selected", "error");
      return;
    }
    if (allProfiles.length === 1) {
      showStatus("Cannot delete the last profile", "error");
      return;
    }
    const confirmed = confirm(`Delete profile "${currentProfile.profileName}"?`);
    if (!confirmed)
      return;
    try {
      await StorageService.deleteProfile(currentProfile.id);
      allProfiles = await StorageService.getAllProfiles();
      if (allProfiles.length > 0) {
        await StorageService.setActiveProfile(allProfiles[0].id);
        allProfiles = await StorageService.getAllProfiles();
        updateProfileSelector();
        loadProfileData(allProfiles[0]);
      }
      showStatus("Profile deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting profile:", error);
      showStatus("Error deleting profile", "error");
    }
  }
  function handleAddCustomField() {
    addCustomFieldToUI("", "", "text");
  }
  function addCustomFieldToUI(name = "", value = "", type = "text") {
    const fieldItem = document.createElement("div");
    fieldItem.className = "custom-field-item";
    fieldItem.innerHTML = `
    <input type="text" class="field-name" placeholder="Field name" value="${escapeHtml(name)}">
    <select class="field-type">
      <option value="text" ${type === "text" ? "selected" : ""}>Text</option>
      <option value="number" ${type === "number" ? "selected" : ""}>Number</option>
      <option value="email" ${type === "email" ? "selected" : ""}>Email</option>
      <option value="tel" ${type === "tel" ? "selected" : ""}>Phone</option>
      <option value="url" ${type === "url" ? "selected" : ""}>URL</option>
      <option value="date" ${type === "date" ? "selected" : ""}>Date</option>
    </select>
    <input type="${type}" class="field-value" placeholder="Field value" value="${escapeHtml(value)}">
    <button type="button" class="btn-remove">Remove</button>
  `;
    const removeBtn = fieldItem.querySelector(".btn-remove");
    removeBtn.addEventListener("click", () => {
      fieldItem.remove();
    });
    elements.customFieldsList.appendChild(fieldItem);
  }
  function handleBack() {
    chrome.action.openPopup().catch(() => {
      window.close();
    });
  }
  function showStatus(message, type = "info") {
    elements.actionStatusMessage.textContent = message;
    elements.actionStatusMessage.className = `action-status ${type}`;
    setTimeout(() => {
      elements.actionStatusMessage.classList.add("hidden");
    }, 5e3);
  }
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
