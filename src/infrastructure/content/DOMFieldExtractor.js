/**
 * DOMFieldExtractor
 *
 * Infrastructure utility responsible for scanning the DOM and extracting raw field data.
 * This is the only class that directly touches the DOM.
 */
import { SelectorGenerator } from './SelectorGenerator.js';

export class DOMFieldExtractor {
  /**
   * Extract all form fields from the current page
   * @returns {Array<Object>} Raw field data
   */
  static extractAll() {
    const fields = [];
    const processedRadioGroups = new Set();

    // Query all relevant form elements
    const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="image"]):not([type="reset"])');
    const textareas = document.querySelectorAll('textarea');
    const selects = document.querySelectorAll('select');

    // Process each type
    inputs.forEach(input => {
      // For radio buttons, only process one per group
      if (input.type === 'radio' && input.name) {
        if (processedRadioGroups.has(input.name)) {
          return; // Skip this radio, already processed this group
        }
        processedRadioGroups.add(input.name);
      }

      const fieldData = this.extractFieldData(input);
      if (fieldData) {
        fields.push(fieldData);
      }
    });

    textareas.forEach(textarea => {
      const fieldData = this.extractFieldData(textarea);
      if (fieldData) fields.push(fieldData);
    });

    selects.forEach(select => {
      const fieldData = this.extractFieldData(select);
      if (fieldData) fields.push(fieldData);
    });

    return fields;
  }

  /**
   * Extract data from a single form element
   * @param {HTMLElement} element
   * @returns {Object|null}
   */
  static extractFieldData(element) {
    // Skip invisible fields
    if (!this.isVisible(element)) {
      return null;
    }

    const tagName = element.tagName.toLowerCase();
    const type = element.type || tagName;

    return {
      selector: SelectorGenerator.generate(element),
      label: this.findLabel(element),
      ariaLabel: element.getAttribute('aria-label') || '',
      placeholder: element.placeholder || '',
      name: element.name || '',
      id: element.id || '',
      type: type,
      value: element.value || '',
      required: element.required || false,
      options: this.extractOptions(element)
    };
  }

  /**
   * Find the associated label for a form element
   * @param {HTMLElement} element
   * @returns {string}
   */
  static findLabel(element) {
    // Strategy 1: <label for="id">
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) {
        return this.cleanLabelText(label.textContent);
      }
    }

    // Strategy 2: Wrapping <label>
    const parentLabel = element.closest('label');
    if (parentLabel) {
      return this.cleanLabelText(parentLabel.textContent);
    }

    // Strategy 3: Previous sibling label
    let sibling = element.previousElementSibling;
    while (sibling) {
      if (sibling.tagName.toLowerCase() === 'label') {
        return this.cleanLabelText(sibling.textContent);
      }
      sibling = sibling.previousElementSibling;
    }

    // Strategy 4: Parent's previous sibling (common pattern)
    const parent = element.parentElement;
    if (parent) {
      const parentSibling = parent.previousElementSibling;
      if (parentSibling && parentSibling.tagName.toLowerCase() === 'label') {
        return this.cleanLabelText(parentSibling.textContent);
      }
    }

    // Strategy 5: Look for nearby text content
    const nearbyText = this.findNearbyText(element);
    if (nearbyText) {
      return nearbyText;
    }

    return '';
  }

  /**
   * Find nearby text that might serve as a label
   * @param {HTMLElement} element
   * @returns {string}
   */
  static findNearbyText(element) {
    const parent = element.parentElement;
    if (!parent) return '';

    // Get all text nodes near the element
    const walker = document.createTreeWalker(
      parent,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let textContent = '';
    let node;

    while (node = walker.nextNode()) {
      const text = node.textContent.trim();
      if (text && text.length > 0 && text.length < 100) {
        textContent = text;
        break;
      }
    }

    return this.cleanLabelText(textContent);
  }

  /**
   * Clean label text by removing extra whitespace and special characters
   * @param {string} text
   * @returns {string}
   */
  static cleanLabelText(text) {
    if (!text) return '';

    return text
      .replace(/\n/g, ' ')           // Replace newlines with spaces
      .replace(/\s+/g, ' ')          // Normalize whitespace
      .replace(/[*:]+$/g, '')        // Remove trailing asterisks and colons
      .trim()
      .substring(0, 200);            // Limit length
  }

  /**
   * Extract options from select/radio/checkbox elements
   * @param {HTMLElement} element
   * @returns {Array<string>}
   */
  static extractOptions(element) {
    if (element.tagName.toLowerCase() === 'select') {
      return Array.from(element.options)
        .map(option => option.text.trim())
        .filter(text => text.length > 0);
    }

    // For radio buttons, extract all options from the same group
    if (element.type === 'radio' && element.name) {
      const radioGroup = document.querySelectorAll(
        `input[type="radio"][name="${element.name}"]`
      );

      const options = [];
      radioGroup.forEach((radio) => {
        // Try to find label for this radio button
        let labelText = '';

        // Strategy 1: Label with for attribute
        if (radio.id) {
          const label = document.querySelector(`label[for="${radio.id}"]`);
          if (label) {
            labelText = this.cleanLabelText(label.textContent);
          }
        }

        // Strategy 2: Wrapping label
        if (!labelText) {
          const parentLabel = radio.closest('label');
          if (parentLabel) {
            labelText = this.cleanLabelText(parentLabel.textContent);
          }
        }

        // Strategy 3: Next sibling label
        if (!labelText && radio.nextElementSibling) {
          const nextSibling = radio.nextElementSibling;
          if (nextSibling.tagName.toLowerCase() === 'label') {
            labelText = this.cleanLabelText(nextSibling.textContent);
          } else {
            // Get text content from next sibling
            labelText = this.cleanLabelText(nextSibling.textContent);
          }
        }

        // Strategy 4: Use value attribute as fallback
        if (!labelText && radio.value) {
          labelText = radio.value;
        }

        if (labelText && labelText.length > 0) {
          options.push(labelText);
        }
      });

      return options;
    }

    return [];
  }

  /**
   * Check if an element is visible
   * @param {HTMLElement} element
   * @returns {boolean}
   */
  static isVisible(element) {
    // Check display and visibility
    const style = window.getComputedStyle(element);

    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }

    // Check if element has dimensions
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      return false;
    }

    return true;
  }

  /**
   * Fill a specific field with a value using its selector
   * @param {string} selector
   * @param {string} value
   * @returns {boolean} Success status
   */
  static fillField(selector, value) {
    try {
      const element = document.querySelector(selector);

      if (!element) {
        console.warn(`Element not found for selector: ${selector}`);
        return false;
      }

      // Handle different input types
      const tagName = element.tagName.toLowerCase();

      if (tagName === 'select') {
        return this.fillSelect(element, value);
      } else if (element.type === 'checkbox') {
        element.checked = ['true', 'yes', '1'].includes(value.toLowerCase());
      } else if (element.type === 'radio') {
        element.checked = true;
      } else {
        // Standard text input/textarea
        element.value = value;
      }

      // Trigger input and change events for frameworks like React
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));

      return true;
    } catch (error) {
      console.error(`Error filling field ${selector}:`, error);
      return false;
    }
  }

  /**
   * Fill a select element by finding the closest matching option
   * @param {HTMLSelectElement} element
   * @param {string} value
   * @returns {boolean}
   */
  static fillSelect(element, value) {
    const options = Array.from(element.options);

    // Try exact match first
    let matchingOption = options.find(opt =>
      opt.text.toLowerCase() === value.toLowerCase() ||
      opt.value.toLowerCase() === value.toLowerCase()
    );

    // Try partial match
    if (!matchingOption) {
      matchingOption = options.find(opt =>
        opt.text.toLowerCase().includes(value.toLowerCase()) ||
        value.toLowerCase().includes(opt.text.toLowerCase())
      );
    }

    if (matchingOption) {
      element.value = matchingOption.value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }

    return false;
  }
}
