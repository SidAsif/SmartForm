/**
 * ExtractFieldsUseCase
 *
 * Application layer use case that orchestrates the field extraction process.
 * Coordinates between infrastructure (DOM extraction) and domain (field processing).
 */
import { FormDetector } from '../../domain/services/FormDetector.js';
import { DOMFieldExtractor } from '../../infrastructure/content/DOMFieldExtractor.js';

export class ExtractFieldsUseCase {
  constructor() {
    this.formDetector = new FormDetector();
  }

  /**
   * Execute the field extraction workflow
   * @returns {Object} Result containing fields and metadata
   */
  execute() {
    try {
      // Step 1: Extract raw field data from DOM (infrastructure)
      const rawFields = DOMFieldExtractor.extractAll();

      // Step 2: Process raw data into domain entities (domain)
      const formFields = this.formDetector.processFields(rawFields);

      // Step 3: Get statistics for logging/debugging
      const stats = this.formDetector.getFieldStatistics(formFields);

      // Step 4: Convert to plain objects for serialization
      const serializedFields = formFields.map(field => field.toJSON());

      return {
        success: true,
        fields: serializedFields,
        count: serializedFields.length,
        stats: stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('ExtractFieldsUseCase error:', error);

      return {
        success: false,
        fields: [],
        count: 0,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Execute extraction and return only fields (simplified)
   * @returns {Array<Object>}
   */
  executeSimple() {
    const result = this.execute();
    return result.success ? result.fields : [];
  }
}
