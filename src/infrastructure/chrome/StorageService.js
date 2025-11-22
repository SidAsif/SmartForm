/**
 * StorageService
 *
 * Infrastructure service for Chrome storage operations.
 * Provides clean interface for storing and retrieving data.
 */
import { UserProfile } from '../../domain/entities/UserProfile.js';

export class StorageService {
  /**
   * Get all profiles from storage
   * @returns {Promise<Array<UserProfile>>}
   */
  static async getAllProfiles() {
    try {
      const result = await chrome.storage.local.get('profiles');

      if (result.profiles && Array.isArray(result.profiles)) {
        return result.profiles.map(p => UserProfile.fromJSON(p));
      }

      return [];
    } catch (error) {
      console.error('Error getting profiles:', error);
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
      const activeProfile = profiles.find(p => p.isActive);

      if (activeProfile) {
        return activeProfile;
      }

      // If no active profile, return first one or empty
      return profiles.length > 0 ? profiles[0] : UserProfile.empty();
    } catch (error) {
      console.error('Error getting user profile:', error);
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
        profiles: profiles.map(p => p.toJSON())
      });
    } catch (error) {
      console.error('Error saving profiles:', error);
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
      const existingIndex = profiles.findIndex(p => p.id === profile.id);

      if (existingIndex >= 0) {
        profiles[existingIndex] = profile;
      } else {
        profiles.push(profile);
      }

      await this.saveAllProfiles(profiles);
    } catch (error) {
      console.error('Error saving user profile:', error);
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
      const filtered = profiles.filter(p => p.id !== profileId);
      await this.saveAllProfiles(filtered);
    } catch (error) {
      console.error('Error deleting profile:', error);
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

      // Set all to inactive, then activate the selected one
      profiles.forEach(p => {
        p.isActive = (p.id === profileId);
      });

      await this.saveAllProfiles(profiles);
    } catch (error) {
      console.error('Error setting active profile:', error);
      throw error;
    }
  }

  /**
   * Get OpenAI API key from storage
   * @returns {Promise<string>}
   */
  static async getApiKey() {
    try {
      const result = await chrome.storage.local.get('settings');

      if (result.settings && result.settings.apiKey) {
        return result.settings.apiKey;
      }

      return '';
    } catch (error) {
      console.error('Error getting API key:', error);
      return '';
    }
  }

  /**
   * Save OpenAI API key to storage
   * @param {string} apiKey
   * @returns {Promise<void>}
   */
  static async saveApiKey(apiKey) {
    try {
      const result = await chrome.storage.local.get('settings');
      const settings = result.settings || {};

      settings.apiKey = apiKey;

      await chrome.storage.local.set({ settings });
    } catch (error) {
      console.error('Error saving API key:', error);
      throw error;
    }
  }

  /**
   * Get all settings
   * @returns {Promise<Object>}
   */
  static async getSettings() {
    try {
      const result = await chrome.storage.local.get('settings');
      return result.settings || {};
    } catch (error) {
      console.error('Error getting settings:', error);
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
      console.error('Error saving settings:', error);
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
      console.error('Error clearing storage:', error);
      throw error;
    }
  }
}
