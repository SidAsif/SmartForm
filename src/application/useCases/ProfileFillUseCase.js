/**
 * ProfileFillUseCase
 *
 * Application layer use case for profile-based form filling without AI.
 * Uses the user's saved profile data to fill form fields intelligently.
 * Falls back to random data for fields without profile data.
 */
import { FormField } from '../../domain/entities/FormField.js';
import { StorageService } from '../../infrastructure/chrome/StorageService.js';
import { RandomDataGenerator } from '../../infrastructure/generators/RandomDataGenerator.js';

export class ProfileFillUseCase {
  /**
   * Execute profile fill (no AI needed)
   * @param {Object} params
   * @param {Array} params.fields - Array of field objects
   * @returns {Promise<Object>} Result with fieldValues mapping
   */
  async execute({ fields }) {
    try {
      console.log('ProfileFillUseCase: Starting execution', {
        fieldCount: fields?.length
      });

      // Validate input
      if (!fields || !Array.isArray(fields) || fields.length === 0) {
        throw new Error('No fields provided');
      }

      // Load user profile
      const profile = await StorageService.getUserProfile();

      if (!profile.hasData()) {
        throw new Error('No profile data found. Please configure your profile in settings.');
      }

      console.log('Profile loaded:', {
        hasName: !!profile.name,
        hasEmail: !!profile.email,
        hasPhone: !!profile.phone,
        hasAddress: !!profile.address,
        hasCompany: !!profile.company,
        hasJobTitle: !!profile.jobTitle,
        hasBio: !!profile.bio
      });

      // Convert plain objects to FormField entities if needed
      const formFields = fields.map(field =>
        field instanceof FormField ? field : FormField.fromJSON(field)
      );

      // Map fields to profile data
      const fieldValues = {};

      for (const field of formFields) {
        // Skip password fields for security
        if (field.type === 'password') {
          continue;
        }

        // Map field to profile data
        const value = this.mapFieldToProfile(field, profile);

        // Only add if we have a value
        if (value) {
          fieldValues[field.selector] = value;
        }

        console.log('Mapped field:', {
          selector: field.selector,
          label: field.label,
          type: field.type,
          value: value || 'N/A'
        });
      }

      console.log('ProfileFillUseCase: Mapping complete', {
        totalFields: formFields.length,
        filledFields: Object.keys(fieldValues).length
      });

      return {
        success: true,
        fieldValues: fieldValues
      };

    } catch (error) {
      console.error('ProfileFillUseCase error:', error);

      return {
        success: false,
        fieldValues: {},
        error: error.message
      };
    }
  }

  /**
   * Map a form field to profile data based on label/name matching
   * Falls back to random data if profile data is not available
   * @param {FormField} field
   * @param {UserProfile} profile
   * @returns {string}
   */
  mapFieldToProfile(field, profile) {
    const label = field.label.toLowerCase();
    const name = field.name.toLowerCase();
    const type = field.type;

    // Helper function to check if label/name contains any keyword
    const matches = (keywords) => {
      return keywords.some(keyword =>
        label.includes(keyword) || name.includes(keyword)
      );
    };

    // First, check if there's a matching custom field
    if (profile.customFields && profile.customFields.length > 0) {
      for (const customField of profile.customFields) {
        const customFieldName = customField.name.toLowerCase();
        if (label.includes(customFieldName) || name.includes(customFieldName)) {
          return customField.value;
        }
      }
    }

    // Email
    if (matches(['email', 'e-mail']) || type === 'email') {
      return profile.email || RandomDataGenerator.randomEmail();
    }

    // Phone
    if (matches(['phone', 'mobile', 'tel', 'contact number']) || type === 'tel') {
      return profile.phone || RandomDataGenerator.randomPhone();
    }

    // Address
    if (matches(['address', 'street', 'location'])) {
      return profile.address || RandomDataGenerator.randomAddress();
    }

    // City
    if (matches(['city', 'town'])) {
      return profile.address || RandomDataGenerator.randomCity();
    }

    // State
    if (matches(['state', 'province'])) {
      return RandomDataGenerator.randomState();
    }

    // ZIP
    if (matches(['zip', 'postal', 'postcode'])) {
      return RandomDataGenerator.randomZip();
    }

    // Company
    if (matches(['company', 'organization', 'employer', 'business'])) {
      return profile.company || RandomDataGenerator.randomCompany();
    }

    // Job Title
    if (matches(['title', 'position', 'role', 'job', 'occupation'])) {
      return profile.jobTitle || RandomDataGenerator.randomJobTitle();
    }

    // Name variations
    if (matches(['full name', 'fullname', 'your name'])) {
      return profile.name || RandomDataGenerator.randomFullName();
    }

    if (matches(['first name', 'firstname', 'fname'])) {
      if (profile.name) {
        const parts = profile.name.split(' ');
        return parts[0];
      }
      return RandomDataGenerator.randomFirstName();
    }

    if (matches(['last name', 'lastname', 'surname', 'lname'])) {
      if (profile.name) {
        const parts = profile.name.split(' ');
        return parts.length > 1 ? parts[parts.length - 1] : RandomDataGenerator.randomLastName();
      }
      return RandomDataGenerator.randomLastName();
    }

    // Generic name field
    if (matches(['name']) && !matches(['username', 'user name'])) {
      return profile.name || RandomDataGenerator.randomFullName();
    }

    // Bio/Description
    if (matches(['bio', 'about', 'description', 'summary', 'profile'])) {
      return profile.bio || RandomDataGenerator.randomText();
    }

    // For textarea and other text fields, try bio if nothing else matches
    if (field.type === 'textarea') {
      return profile.bio || RandomDataGenerator.randomText();
    }

    // Unknown field - use random data generator
    return RandomDataGenerator.generate(field);
  }
}
