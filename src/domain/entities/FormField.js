/**
 * FormField Entity
 *
 * Represents a single form field with all necessary metadata for AI filling.
 * Pure domain entity with no external dependencies.
 */
export class FormField {
  /**
   * @param {Object} params
   * @param {number} params.id - Unique identifier within the form
   * @param {string} params.selector - CSS selector to target this field
   * @param {string} params.label - Human-readable label for the field
   * @param {string} params.type - Input type (text, email, tel, textarea, select, etc.)
   * @param {string} [params.placeholder] - Placeholder text if available
   * @param {string} [params.name] - Name attribute
   * @param {string} [params.currentValue] - Current value in the field
   * @param {Array<string>} [params.options] - Options for select/radio fields
   */
  constructor({ id, selector, label, type, placeholder = '', name = '', currentValue = '', options = [] }) {
    this.id = id;
    this.selector = selector;
    this.label = label;
    this.type = type;
    this.placeholder = placeholder;
    this.name = name;
    this.currentValue = currentValue;
    this.options = options;
  }

  /**
   * Get a human-readable description of this field for AI context
   * @returns {string}
   */
  getContextDescription() {
    const parts = [];

    if (this.label) parts.push(`Label: "${this.label}"`);
    if (this.placeholder) parts.push(`Placeholder: "${this.placeholder}"`);
    if (this.type) parts.push(`Type: ${this.type}`);
    if (this.options.length > 0) parts.push(`Options: [${this.options.join(', ')}]`);

    return parts.join(' | ');
  }

  /**
   * Check if this field is required based on available metadata
   * @returns {boolean}
   */
  isRequired() {
    const requiredKeywords = ['required', 'mandatory', '*'];
    const labelLower = this.label.toLowerCase();

    return requiredKeywords.some(keyword => labelLower.includes(keyword));
  }

  /**
   * Convert to plain object for serialization
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      selector: this.selector,
      label: this.label,
      type: this.type,
      placeholder: this.placeholder,
      name: this.name,
      currentValue: this.currentValue,
      options: this.options
    };
  }

  /**
   * Create FormField from plain object
   * @param {Object} data
   * @returns {FormField}
   */
  static fromJSON(data) {
    return new FormField(data);
  }
}
