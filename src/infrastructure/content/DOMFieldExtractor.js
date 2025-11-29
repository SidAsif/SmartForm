/**
 * DOMFieldExtractor
 *
 * Scans web pages and extracts all form fields with their labels, types, and attributes.
 * This is the bridge between the actual webpage DOM and our extension logic.
 * Works with standard HTML forms, Angular (ng-model), and React (formcontrolname) frameworks.
 */
import { SelectorGenerator } from './SelectorGenerator.js';

export class DOMFieldExtractor {
  /**
   * Scan the page and collect all fillable form fields
   * Looks for inputs, textareas, and select dropdowns that are visible to users
   * @returns {Array<Object>} List of field data objects with labels, selectors, and metadata
   */
  static extractAll() {
    const fields = [];
    const processedRadioGroups = new Set();

    // Find all form elements on the page (excluding buttons and hidden fields)
    const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="image"]):not([type="reset"])');
    const textareas = document.querySelectorAll('textarea');
    const selects = document.querySelectorAll('select');

    // Process input fields (text, email, phone, radio, checkbox, etc.)
    inputs.forEach(input => {
      // Radio buttons come in groups - we only need to process each group once
      // This prevents duplicate entries for the same question
      if (input.type === 'radio' && input.name) {
        if (processedRadioGroups.has(input.name)) {
          return; // Already handled this radio group, skip
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
   * Extract all useful information from a single form field
   * Gathers label, type, placeholder, name, and any other clues we can use to fill it correctly
   * @param {HTMLElement} element - The form field element to analyze
   * @returns {Object|null} Field data object, or null if the field is hidden/invisible
   */
  static extractFieldData(element) {
    // Don't process hidden or invisible fields - users can't see them anyway
    if (!this.isVisible(element)) {
      return null;
    }

    const tagName = element.tagName.toLowerCase();
    const type = element.type || tagName;

    // Get the field's name - works with standard HTML, Angular (ng-model), and React (formcontrolname)
    const nameAttr = element.name || element.getAttribute('ng-model') || element.getAttribute('formcontrolname') || '';

    return {
      selector: SelectorGenerator.generate(element),  // Unique CSS selector to find this field later
      label: this.findLabel(element),                 // Human-readable label (e.g., "First Name")
      ariaLabel: element.getAttribute('aria-label') || '',  // Accessibility label
      placeholder: element.placeholder || '',         // Placeholder text
      name: nameAttr,                                 // Field name attribute
      id: element.id || '',                          // Field ID
      type: type,                                    // Input type (text, email, select, etc.)
      value: element.value || '',                    // Current value
      required: element.required || false,           // Is this field required?
      options: this.extractOptions(element)          // For dropdowns/radios - list of choices
    };
  }

  /**
   * Find the label text for a form field by trying different common HTML patterns
   * Forms use many different ways to label fields, so we check all the usual methods
   * @param {HTMLElement} element - The input field we're looking for a label for
   * @returns {string} The label text, or empty string if none found
   */
  static findLabel(element) {
    // Method 1: Standard <label for="fieldId"> pointing to this input's ID
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) {
        return this.cleanLabelText(label.textContent);
      }
    }

    // Method 2: Label wrapping the input (e.g., <label>Name: <input></label>)
    const parentLabel = element.closest('label');
    if (parentLabel) {
      return this.cleanLabelText(parentLabel.textContent);
    }

    // Method 3: Label appears right before the input in the HTML
    let sibling = element.previousElementSibling;
    while (sibling) {
      if (sibling.tagName.toLowerCase() === 'label') {
        return this.cleanLabelText(sibling.textContent);
      }
      sibling = sibling.previousElementSibling;
    }

    // Method 4: Label before the parent container (common in Bootstrap/Material UI)
    const parent = element.parentElement;
    if (parent) {
      const parentSibling = parent.previousElementSibling;
      if (parentSibling && parentSibling.tagName.toLowerCase() === 'label') {
        return this.cleanLabelText(parentSibling.textContent);
      }
    }

    // Method 5: Look for any nearby text that might be acting as a label
    const nearbyText = this.findNearbyText(element);
    if (nearbyText) {
      return nearbyText;
    }

    return '';
  }

  /**
   * Search for text near a field that could be serving as a label
   * Some forms don't use proper <label> tags, just plain text nearby
   * @param {HTMLElement} element - The input field
   * @returns {string} Text found near the field that looks like a label
   */
  static findNearbyText(element) {
    const parent = element.parentElement;
    if (!parent) return '';

    // Walk through all text nodes in the parent container
    const walker = document.createTreeWalker(
      parent,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let textContent = '';
    let node;

    // Look for text that's not too long (likely a label, not a paragraph)
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
   * Clean up label text by removing junk characters and extra whitespace
   * Makes labels easier to match against field types (e.g., "Email *:" becomes "Email")
   * @param {string} text - Raw label text from the page
   * @returns {string} Cleaned, normalized label text
   */
  static cleanLabelText(text) {
    if (!text) return '';

    return text
      .replace(/\n/g, ' ')           // Turn newlines into spaces
      .replace(/\s+/g, ' ')          // Collapse multiple spaces into one
      .replace(/[*:]+$/g, '')        // Remove asterisks (*) and colons (:) from the end
      .trim()                        // Remove leading/trailing whitespace
      .substring(0, 200);            // Keep it reasonable length
  }

  /**
   * Get the list of available choices for dropdown or radio button fields
   * For dropdowns, returns all <option> values. For radios, finds all buttons in the group
   * @param {HTMLElement} element - The select or radio input element
   * @returns {Array<string>} List of choice labels (e.g., ["Male", "Female", "Other"])
   */
  static extractOptions(element) {
    // For dropdown menus, just grab all the option texts
    if (element.tagName.toLowerCase() === 'select') {
      return Array.from(element.options)
        .map(option => option.text.trim())
        .filter(text => text.length > 0);
    }

    // For radio buttons, we need to find all buttons in the same group
    if (element.type === 'radio' && element.name) {
      const radioGroup = document.querySelectorAll(
        `input[type="radio"][name="${element.name}"]`
      );

      const options = [];
      radioGroup.forEach((radio) => {
        // Each radio button needs its own label - try multiple methods to find it
        let labelText = '';

        // Method 1: Standard <label for="radioId">
        if (radio.id) {
          const label = document.querySelector(`label[for="${radio.id}"]`);
          if (label) {
            labelText = this.cleanLabelText(label.textContent);
          }
        }

        // Method 2: Wrapping label <label><input> Text</label>
        if (!labelText) {
          const parentLabel = radio.closest('label');
          if (parentLabel) {
            labelText = this.cleanLabelText(parentLabel.textContent);
          }
        }

        // Method 3: Label appears after the radio button
        if (!labelText && radio.nextElementSibling) {
          const nextSibling = radio.nextElementSibling;
          if (nextSibling.tagName.toLowerCase() === 'label') {
            labelText = this.cleanLabelText(nextSibling.textContent);
          } else {
            // Sometimes it's just text, not even in a <label> tag
            labelText = this.cleanLabelText(nextSibling.textContent);
          }
        }

        // Method 4: Fall back to the value attribute if nothing else works
        if (!labelText && radio.value) {
          labelText = radio.value;
        }

        if (labelText && labelText.length > 0) {
          options.push(labelText);
        }
      });

      return options;
    }

    // Not a select or radio - no options to extract
    return [];
  }

  /**
   * Check if a form field is actually visible on the page
   * Hidden fields should be ignored - we only want to fill fields users can see
   * @param {HTMLElement} element - The field to check
   * @returns {boolean} True if visible, false if hidden
   */
  static isVisible(element) {
    // Check CSS visibility properties
    const style = window.getComputedStyle(element);

    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }

    // Check if the field has any size (hidden fields often have 0x0 dimensions)
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      return false;
    }

    return true;
  }

  /**
   * Actually fill a form field with a value
   * Finds the field using its CSS selector and sets the appropriate value
   * @param {string} selector - CSS selector to find the field
   * @param {string} value - The value to fill in
   * @returns {boolean} True if filled successfully, false if something went wrong
   */
  static fillField(selector, value) {
    try {
      const element = document.querySelector(selector);

      if (!element) {
        console.warn(`Element not found for selector: ${selector}`);
        return false;
      }

      // Different field types need different filling methods
      const tagName = element.tagName.toLowerCase();

      if (tagName === 'select') {
        // Dropdowns need special handling to match options
        return this.fillSelect(element, value);
      } else if (element.type === 'checkbox') {
        // Checkboxes are checked/unchecked, not filled with text
        element.checked = ['true', 'yes', '1'].includes(value.toLowerCase());
      } else if (element.type === 'radio') {
        // Radio buttons just get selected
        element.checked = true;
      } else {
        // Everything else (text, email, number, etc.) just gets the value set
        element.value = value;
      }

      // Trigger events so React/Angular/Vue notice the change
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));

      return true;
    } catch (error) {
      console.error(`Error filling field ${selector}:`, error);
      return false;
    }
  }

  /**
   * Fill a dropdown by finding the best matching option
   * Tries exact match first, then partial match if needed
   * @param {HTMLSelectElement} element - The dropdown element
   * @param {string} value - The value we want to select (e.g., "California")
   * @returns {boolean} True if we found and selected a match
   */
  static fillSelect(element, value) {
    const options = Array.from(element.options);

    // First, try to find an exact match
    let matchingOption = options.find(opt =>
      opt.text.toLowerCase() === value.toLowerCase() ||
      opt.value.toLowerCase() === value.toLowerCase()
    );

    // If no exact match, try a partial match (e.g., "Calif" matches "California")
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

    // Couldn't find a match
    return false;
  }
}
