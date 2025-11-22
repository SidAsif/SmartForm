/**
 * FillFieldsUseCase
 *
 * Application layer use case that orchestrates form field filling.
 * Coordinates between domain logic and infrastructure (FieldInjector, ToastNotification).
 */
import { FieldInjector } from '../../infrastructure/content/FieldInjector.js';
import { ToastNotification } from '../../infrastructure/content/ToastNotification.js';

export class FillFieldsUseCase {
  /**
   * Execute the field filling operation
   * @param {Object} params
   * @param {Object} params.fieldValues - Mapping of selector to value
   * @param {Object} params.fieldsData - Optional mapping of selector to full field data
   * @returns {Object} Result summary
   */
  execute({ fieldValues, fieldsData = null }) {
    try {
      console.log('FillFieldsUseCase: Starting execution', {
        fieldCount: Object.keys(fieldValues).length,
        hasFieldsData: !!fieldsData
      });

      // Validate input
      if (!fieldValues || typeof fieldValues !== 'object') {
        throw new Error('Invalid field values provided');
      }

      if (Object.keys(fieldValues).length === 0) {
        throw new Error('No field values to fill');
      }

      // Fill all fields using FieldInjector
      const results = FieldInjector.fillMultipleFields(fieldValues, fieldsData);

      console.log('FillFieldsUseCase: Fill complete', {
        total: results.total,
        success: results.successCount,
        failed: results.failedCount
      });

      // Show appropriate notification
      if (results.successCount > 0) {
        if (results.failedCount === 0) {
          // All fields filled successfully
          ToastNotification.showSuccess(
            `Form filled successfully! ${results.successCount} field${results.successCount === 1 ? '' : 's'} completed.`
          );
        } else {
          // Partial success
          ToastNotification.showInfo(
            `Filled ${results.successCount} of ${results.total} fields. ${results.failedCount} field${results.failedCount === 1 ? '' : 's'} could not be filled.`
          );
        }
      } else {
        // No fields filled
        ToastNotification.showError(
          'Failed to fill form fields. Please try again.'
        );
      }

      // Return detailed results
      return {
        success: results.successCount > 0,
        total: results.total,
        filled: results.successCount,
        failed: results.failedCount,
        successFields: results.success,
        failedFields: results.failed,
        message: this.buildResultMessage(results)
      };

    } catch (error) {
      console.error('FillFieldsUseCase error:', error);

      // Show error toast
      ToastNotification.showError(
        error.message || 'An error occurred while filling the form'
      );

      // Return error result
      return {
        success: false,
        total: 0,
        filled: 0,
        failed: 0,
        successFields: [],
        failedFields: [],
        error: error.message
      };
    }
  }

  /**
   * Build a descriptive result message
   * @param {Object} results
   * @returns {string}
   */
  buildResultMessage(results) {
    if (results.successCount === 0) {
      return 'No fields were filled';
    }

    if (results.failedCount === 0) {
      return `Successfully filled all ${results.successCount} fields`;
    }

    return `Filled ${results.successCount} of ${results.total} fields (${results.failedCount} failed)`;
  }
}
