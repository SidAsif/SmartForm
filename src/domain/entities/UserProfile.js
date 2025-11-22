/**
 * UserProfile Entity
 *
 * Represents user profile data that can be used to personalize form filling.
 * Pure domain entity with no external dependencies.
 */
export class UserProfile {
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
    profileName = 'Default Profile',
    isActive = false,
    name = '',
    email = '',
    phone = '',
    address = '',
    company = '',
    jobTitle = '',
    bio = '',
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
    this.customFields = customFields; // Array of {name, value, type}
  }

  /**
   * Generate a unique ID for the profile
   * @returns {string}
   */
  generateId() {
    return 'profile_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
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
    const field = this.customFields.find(f => f.name.toLowerCase() === fieldName.toLowerCase());
    return field ? field.value : null;
  }

  /**
   * Add or update a custom field
   * @param {string} name
   * @param {string} value
   * @param {string} type - 'text', 'number', 'email', 'tel', 'url', etc.
   */
  setCustomField(name, value, type = 'text') {
    const existingIndex = this.customFields.findIndex(f => f.name === name);
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
    this.customFields = this.customFields.filter(f => f.name !== name);
  }

  /**
   * Get profile as a formatted string for AI context
   * @returns {string}
   */
  toContextString() {
    const parts = [];

    if (this.name) parts.push(`Name: ${this.name}`);
    if (this.email) parts.push(`Email: ${this.email}`);
    if (this.phone) parts.push(`Phone: ${this.phone}`);
    if (this.address) parts.push(`Address: ${this.address}`);
    if (this.company) parts.push(`Company: ${this.company}`);
    if (this.jobTitle) parts.push(`Job Title: ${this.jobTitle}`);
    if (this.bio) parts.push(`Bio: ${this.bio}`);

    // Add custom fields
    this.customFields.forEach(field => {
      if (field.value) {
        parts.push(`${field.name}: ${field.value}`);
      }
    });

    return parts.join('\n');
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
    return new UserProfile(data || {});
  }

  /**
   * Create an empty profile
   * @returns {UserProfile}
   */
  static empty() {
    return new UserProfile();
  }
}
