/**
 * RandomFillUseCase
 *
 * Application layer use case for random form filling without AI.
 * Uses RandomDataGenerator to create realistic random data.
 */
import { RandomDataGenerator } from '../../infrastructure/generators/RandomDataGenerator.js';
import { FormField } from '../../domain/entities/FormField.js';

export class RandomFillUseCase {
  /**
   * Execute random fill (no AI needed)
   * @param {Object} params
   * @param {Array} params.fields - Array of field objects
   * @returns {Object} Result with fieldValues mapping
   */
  execute({ fields }) {
    try {
      console.log('RandomFillUseCase: Starting execution', {
        fieldCount: fields?.length
      });

      // Validate input
      if (!fields || !Array.isArray(fields) || fields.length === 0) {
        throw new Error('No fields provided');
      }

      // Convert plain objects to FormField entities if needed
      const formFields = fields.map(field =>
        field instanceof FormField ? field : FormField.fromJSON(field)
      );

      // Generate values for each field
      const fieldValues = {};

      for (const field of formFields) {
        // Generate random data based on field
        const value = RandomDataGenerator.generate(field);

        // Map selector to value
        fieldValues[field.selector] = value;
      }

      console.log('RandomFillUseCase: Generation complete', {
        totalFields: formFields.length,
        filledFields: Object.keys(fieldValues).length
      });

      return {
        success: true,
        fieldValues: fieldValues
      };

    } catch (error) {
      console.error('RandomFillUseCase error:', error);

      return {
        success: false,
        fieldValues: {},
        error: error.message
      };
    }
  }
}
