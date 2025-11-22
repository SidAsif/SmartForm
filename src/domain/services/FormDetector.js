/**
 * FormDetector Service
 *
 * Domain service containing pure business logic for form field detection.
 * Receives raw field data and transforms it into FormField entities.
 * No DOM access - works with data structures only.
 */
import { FormField } from '../entities/FormField.js';

export class FormDetector {
  /**
   * Process raw field data into FormField entities
   * @param {Array<Object>} rawFields - Raw field data from DOM
   * @returns {Array<FormField>}
   */
  processFields(rawFields) {
    return rawFields
      .map((field, index) => this.createFormField(field, index))
      .filter(field => this.isValidField(field));
  }

  /**
   * Create a FormField entity from raw data
   * @param {Object} rawField
   * @param {number} index
   * @returns {FormField}
   */
  createFormField(rawField, index) {
    return new FormField({
      id: index,
      selector: rawField.selector,
      label: this.extractLabel(rawField),
      type: this.normalizeType(rawField.type),
      placeholder: rawField.placeholder || '',
      name: rawField.name || '',
      currentValue: rawField.value || '',
      options: rawField.options || []
    });
  }

  /**
   * Extract the most appropriate label from available data
   * @param {Object} rawField
   * @returns {string}
   */
  extractLabel(rawField) {
    // Priority: explicit label > aria-label > placeholder > name > id
    if (rawField.label && rawField.label.trim()) {
      return this.cleanLabel(rawField.label);
    }

    if (rawField.ariaLabel && rawField.ariaLabel.trim()) {
      return this.cleanLabel(rawField.ariaLabel);
    }

    if (rawField.placeholder && rawField.placeholder.trim()) {
      return this.cleanLabel(rawField.placeholder);
    }

    if (rawField.name && rawField.name.trim()) {
      return this.humanizeAttributeName(rawField.name);
    }

    if (rawField.id && rawField.id.trim()) {
      return this.humanizeAttributeName(rawField.id);
    }

    return `Field ${rawField.type || 'input'}`;
  }

  /**
   * Clean and normalize label text
   * @param {string} label
   * @returns {string}
   */
  cleanLabel(label) {
    return label
      .trim()
      .replace(/\s+/g, ' ')      // Normalize whitespace
      .replace(/[*:]+$/, '')     // Remove trailing asterisks/colons
      .trim();
  }

  /**
   * Convert camelCase or snake_case attribute names to human-readable labels
   * @param {string} attrName
   * @returns {string}
   */
  humanizeAttributeName(attrName) {
    return attrName
      .replace(/([A-Z])/g, ' $1')           // camelCase to spaces
      .replace(/[_-]/g, ' ')                // snake_case/kebab-case to spaces
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Normalize input type to standard categories
   * @param {string} type
   * @returns {string}
   */
  normalizeType(type) {
    const typeMap = {
      'text': 'text',
      'email': 'email',
      'tel': 'tel',
      'phone': 'tel',
      'number': 'number',
      'url': 'url',
      'date': 'date',
      'datetime-local': 'datetime',
      'time': 'time',
      'password': 'password',
      'search': 'text',
      'textarea': 'textarea',
      'select': 'select',
      'select-one': 'select',
      'select-multiple': 'select-multiple',
      'radio': 'radio',
      'checkbox': 'checkbox'
    };

    return typeMap[type?.toLowerCase()] || 'text';
  }

  /**
   * Validate if a field should be included
   * @param {FormField} field
   * @returns {boolean}
   */
  isValidField(field) {
    // Exclude password fields for security
    if (field.type === 'password') {
      return false;
    }

    // Must have a valid selector
    if (!field.selector || field.selector.trim() === '') {
      return false;
    }

    // Must have some form of label/identifier
    if (!field.label || field.label.trim() === '') {
      return false;
    }

    return true;
  }

  /**
   * Group fields by form context (if multiple forms exist)
   * @param {Array<FormField>} fields
   * @returns {Object<string, Array<FormField>>}
   */
  groupByForm(fields) {
    // For now, return a single group. Can be extended to handle multiple forms.
    return {
      'main': fields
    };
  }

  /**
   * Get statistics about detected fields
   * @param {Array<FormField>} fields
   * @returns {Object}
   */
  getFieldStatistics(fields) {
    const stats = {
      total: fields.length,
      byType: {},
      required: 0,
      optional: 0
    };

    fields.forEach(field => {
      // Count by type
      stats.byType[field.type] = (stats.byType[field.type] || 0) + 1;

      // Count required vs optional
      if (field.isRequired()) {
        stats.required++;
      } else {
        stats.optional++;
      }
    });

    return stats;
  }
}
