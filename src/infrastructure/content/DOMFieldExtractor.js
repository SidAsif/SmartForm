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

    console.log(`[DOMFieldExtractor] Found ${inputs.length} inputs, ${textareas.length} textareas, ${selects.length} selects`);

    // Count radio buttons
    const radioCount = Array.from(inputs).filter(input => input.type === 'radio').length;
    console.log(`[DOMFieldExtractor] Found ${radioCount} standard radio buttons`);

    // Check for Google Forms custom radio buttons (ARIA-based)
    const ariaRadios = document.querySelectorAll('[role="radio"], [role="radiogroup"]');
    console.log(`[DOMFieldExtractor] Found ${ariaRadios.length} ARIA radio elements (Google Forms style)`);

    // Check for Google Forms radio containers
    const googleFormsRadioContainers = document.querySelectorAll('[data-params*="radio"], .freebirdFormviewerComponentsQuestionRadioRoot');
    console.log(`[DOMFieldExtractor] Found ${googleFormsRadioContainers.length} Google Forms radio containers`);

    // Process each type
    inputs.forEach(input => {
      // For radio buttons, only process one per group
      if (input.type === 'radio' && input.name) {
        if (processedRadioGroups.has(input.name)) {
          console.log(`[DOMFieldExtractor] Skipping duplicate radio group: "${input.name}"`);
          return; // Skip this radio, already processed this group
        }
        console.log(`[DOMFieldExtractor] Processing new radio group: "${input.name}"`);
        processedRadioGroups.add(input.name);
      }

      const fieldData = this.extractFieldData(input);
      if (fieldData) {
        console.log(`[DOMFieldExtractor] Extracted field:`, {
          type: fieldData.type,
          label: fieldData.label,
          name: fieldData.name,
          optionsCount: fieldData.options?.length || 0
        });
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

    // Extract Google Forms radio button groups (ARIA-based)
    const googleFormsRadioGroups = this.extractGoogleFormsRadios();
    console.log(`[DOMFieldExtractor] Extracted ${googleFormsRadioGroups.length} Google Forms radio groups`);
    googleFormsRadioGroups.forEach(group => {
      fields.push(group);
    });

    return fields;
  }

  /**
   * Extract Google Forms custom radio button groups
   * Google Forms uses ARIA roles instead of standard radio inputs
   * @returns {Array<Object>}
   */
  static extractGoogleFormsRadios() {
    const radioGroups = [];
    const processedGroups = new Set();

    // Find all radiogroup containers (one per question)
    const radioGroupContainers = document.querySelectorAll('[role="radiogroup"]');

    console.log(`[DOMFieldExtractor] Processing ${radioGroupContainers.length} Google Forms radiogroups`);

    radioGroupContainers.forEach((container, index) => {
      try {
        // Get the question label (usually in a heading or label before the radiogroup)
        let questionLabel = '';

        // Strategy 1: Look for aria-labelledby
        const labelledBy = container.getAttribute('aria-labelledby');
        if (labelledBy) {
          const labelElement = document.getElementById(labelledBy);
          if (labelElement) {
            questionLabel = this.cleanLabelText(labelElement.textContent);
          }
        }

        // Strategy 2: Look for previous sibling or parent with question text
        if (!questionLabel) {
          let current = container;
          while (current && !questionLabel) {
            const prevSibling = current.previousElementSibling;
            if (prevSibling) {
              const text = prevSibling.textContent.trim();
              if (text && text.length > 0 && text.length < 500) {
                questionLabel = this.cleanLabelText(text);
                break;
              }
            }
            current = current.parentElement;
            if (current && current.classList.contains('freebirdFormviewerComponentsQuestionBaseRoot')) {
              // Found the question container, get its text
              const headerText = current.querySelector('[role="heading"], h2, h3, .freebirdFormviewerComponentsQuestionBaseTitle');
              if (headerText) {
                questionLabel = this.cleanLabelText(headerText.textContent);
                break;
              }
            }
          }
        }

        // Get all radio options within this group
        const radioOptions = container.querySelectorAll('[role="radio"]');
        const options = [];

        console.log(`[DOMFieldExtractor] Google Forms radio group ${index}: Found ${radioOptions.length} options`);

        radioOptions.forEach((radio, optionIndex) => {
          // Get option text from aria-label or text content
          let optionText = radio.getAttribute('aria-label') || '';

          if (!optionText) {
            // Look for text in the radio element or its children
            const textContent = radio.textContent.trim();
            if (textContent) {
              optionText = textContent;
            }
          }

          if (optionText) {
            options.push(this.cleanLabelText(optionText));
            console.log(`[DOMFieldExtractor]   Option ${optionIndex}: "${optionText}"`);
          }
        });

        if (options.length > 0) {
          // Create a unique identifier for this radio group
          const groupId = `google-forms-radio-${index}`;

          // Generate a unique selector using data attribute or aria-labelledby
          let selector;
          const labelledBy = container.getAttribute('aria-labelledby');
          if (labelledBy) {
            selector = `[role="radiogroup"][aria-labelledby="${labelledBy}"]`;
          } else {
            // Fallback to a more robust nth-of-type selector
            const allRadioGroups = document.querySelectorAll('[role="radiogroup"]');
            const actualIndex = Array.from(allRadioGroups).indexOf(container);
            selector = `[role="radiogroup"]:nth-of-type(${actualIndex + 1})`;
          }

          const fieldData = {
            selector: selector,
            label: questionLabel || `Question ${index + 1}`,
            ariaLabel: container.getAttribute('aria-label') || '',
            placeholder: '',
            name: groupId,
            id: groupId,
            type: 'google-forms-radio',
            value: '',
            required: container.hasAttribute('aria-required'),
            options: options,
            _googleFormsRadioGroup: true,
            _container: container // Store reference for filling
          };

          console.log(`[DOMFieldExtractor] Created Google Forms radio field:`, {
            selector: fieldData.selector,
            label: fieldData.label,
            optionsCount: options.length,
            options: options
          });

          radioGroups.push(fieldData);
        }
      } catch (error) {
        console.error(`[DOMFieldExtractor] Error extracting Google Forms radio group ${index}:`, error);
      }
    });

    return radioGroups;
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

      console.log(`[DOMFieldExtractor] Extracting options for radio group "${element.name}" (${radioGroup.length} radios)`);

      const options = [];
      radioGroup.forEach((radio, index) => {
        // Try to find label for this radio button
        let labelText = '';

        // Strategy 1: Label with for attribute
        if (radio.id) {
          const label = document.querySelector(`label[for="${radio.id}"]`);
          if (label) {
            labelText = this.cleanLabelText(label.textContent);
            console.log(`[DOMFieldExtractor] Radio ${index}: Found label[for="${radio.id}"]: "${labelText}"`);
          }
        }

        // Strategy 2: Wrapping label
        if (!labelText) {
          const parentLabel = radio.closest('label');
          if (parentLabel) {
            labelText = this.cleanLabelText(parentLabel.textContent);
            console.log(`[DOMFieldExtractor] Radio ${index}: Found wrapping label: "${labelText}"`);
          }
        }

        // Strategy 3: Next sibling label
        if (!labelText && radio.nextElementSibling) {
          const nextSibling = radio.nextElementSibling;
          if (nextSibling.tagName.toLowerCase() === 'label') {
            labelText = this.cleanLabelText(nextSibling.textContent);
            console.log(`[DOMFieldExtractor] Radio ${index}: Found next sibling label: "${labelText}"`);
          } else {
            // Get text content from next sibling
            labelText = this.cleanLabelText(nextSibling.textContent);
            if (labelText) {
              console.log(`[DOMFieldExtractor] Radio ${index}: Found next sibling text: "${labelText}"`);
            }
          }
        }

        // Strategy 4: Use value attribute as fallback
        if (!labelText && radio.value) {
          labelText = radio.value;
          console.log(`[DOMFieldExtractor] Radio ${index}: Using value attribute: "${labelText}"`);
        }

        if (labelText && labelText.length > 0) {
          options.push(labelText);
        } else {
          console.warn(`[DOMFieldExtractor] Radio ${index}: No label text found (id="${radio.id}", value="${radio.value}")`);
        }
      });

      console.log(`[DOMFieldExtractor] Extracted ${options.length} options for radio group "${element.name}":`, options);
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
