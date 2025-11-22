/**
 * FieldInjector
 *
 * Infrastructure utility for safely injecting values into form fields.
 * Handles various input types and triggers appropriate events.
 */
export class FieldInjector {
  /**
   * Safely query for an element
   * @param {string} selector
   * @returns {HTMLElement|null}
   */
  static safeQuery(selector) {
    try {
      if (!selector || typeof selector !== 'string') {
        return null;
      }

      return document.querySelector(selector);
    } catch (error) {
      console.warn(`Invalid selector: ${selector}`, error);
      return null;
    }
  }

  /**
   * Set value for a form field
   * @param {string} selector
   * @param {string} value
   * @returns {boolean} Success status
   */
  static setFieldValue(selector, value, fieldData = null) {
    try {
      // Check if this is a Google Forms radio button FIRST (before querying)
      if (fieldData && fieldData._googleFormsRadioGroup) {
        console.log(`[FieldInjector] Detected Google Forms radio group`);

        // Skip if value is undefined or null
        if (value === undefined || value === null) {
          console.warn(`Skipping undefined/null value for Google Forms radio: ${selector}`);
          return false;
        }

        return this.fillGoogleFormsRadio(fieldData, String(value));
      }

      const element = this.safeQuery(selector);

      if (!element) {
        console.warn(`Element not found for selector: ${selector}`);
        return false;
      }

      // Skip if value is undefined or null
      if (value === undefined || value === null) {
        console.warn(`Skipping undefined/null value for: ${selector}`);
        return false;
      }

      // Convert value to string
      const stringValue = String(value);

      // Handle different input types
      const tagName = element.tagName.toLowerCase();
      const inputType = element.type ? element.type.toLowerCase() : '';

      let success = false;

      if (tagName === 'select') {
        success = this.fillSelect(element, stringValue);
      } else if (tagName === 'textarea') {
        success = this.fillTextarea(element, stringValue);
      } else if (inputType === 'checkbox') {
        success = this.fillCheckbox(element, stringValue);
      } else if (inputType === 'radio') {
        success = this.fillRadio(element, stringValue);
      } else if (inputType === 'file') {
        console.warn(`Cannot programmatically fill file input: ${selector}`);
        return false;
      } else {
        // Default text input
        success = this.fillTextInput(element, stringValue);
      }

      if (success) {
        // Trigger events to notify the page
        this.triggerEvents(element);
      }

      return success;

    } catch (error) {
      console.error(`Error setting field value for ${selector}:`, error);
      return false;
    }
  }

  /**
   * Fill a Google Forms radio button (ARIA-based)
   * @param {Object} fieldData - Field data with _container reference
   * @param {string} value - The option text to select
   * @returns {boolean}
   */
  static fillGoogleFormsRadio(fieldData, value) {
    try {
      const container = fieldData._container;

      if (!container) {
        console.error('[FieldInjector] No container reference for Google Forms radio');
        return false;
      }

      console.log('[FieldInjector] fillGoogleFormsRadio called:', {
        label: fieldData.label,
        value: value,
        options: fieldData.options
      });

      // Get all radio options within this group
      const radioOptions = container.querySelectorAll('[role="radio"]');
      console.log(`[FieldInjector] Found ${radioOptions.length} Google Forms radio options`);

      const valueLower = value.toLowerCase();
      let matchedRadio = null;
      let matchedIndex = -1;

      // Try to find matching radio by text content or aria-label
      radioOptions.forEach((radio, index) => {
        if (matchedRadio) return;

        const ariaLabel = (radio.getAttribute('aria-label') || '').toLowerCase();
        const textContent = (radio.textContent || '').toLowerCase().trim();

        console.log(`[FieldInjector]   Radio ${index}: aria-label="${ariaLabel}", text="${textContent}"`);

        // Strategy 1: Exact match with aria-label
        if (ariaLabel && ariaLabel === valueLower) {
          console.log(`[FieldInjector]   ✓ Matched by exact aria-label`);
          matchedRadio = radio;
          matchedIndex = index;
          return;
        }

        // Strategy 2: Exact match with text content
        if (textContent && textContent === valueLower) {
          console.log(`[FieldInjector]   ✓ Matched by exact text content`);
          matchedRadio = radio;
          matchedIndex = index;
          return;
        }

        // Strategy 3: Contains match with aria-label
        if (ariaLabel && ariaLabel.includes(valueLower)) {
          console.log(`[FieldInjector]   ✓ Matched by aria-label contains`);
          matchedRadio = radio;
          matchedIndex = index;
          return;
        }

        // Strategy 4: Contains match with text content
        if (textContent && textContent.includes(valueLower)) {
          console.log(`[FieldInjector]   ✓ Matched by text content contains`);
          matchedRadio = radio;
          matchedIndex = index;
          return;
        }
      });

      if (matchedRadio) {
        console.log(`[FieldInjector] Clicking Google Forms radio option ${matchedIndex}`);

        // Click the radio button to select it
        matchedRadio.click();

        // Wait a bit and verify it was selected
        setTimeout(() => {
          const isSelected = matchedRadio.getAttribute('aria-checked') === 'true';
          console.log(`[FieldInjector] Radio selection verified: ${isSelected}`);
        }, 100);

        return true;
      } else {
        console.warn(`[FieldInjector] No matching radio found for "${value}", selecting random option`);

        // Fallback: select a random option
        if (radioOptions.length > 0) {
          const randomIndex = Math.floor(Math.random() * radioOptions.length);
          console.log(`[FieldInjector] Clicking random radio option ${randomIndex}`);
          radioOptions[randomIndex].click();
          return true;
        }

        return false;
      }
    } catch (error) {
      console.error('[FieldInjector] Error filling Google Forms radio:', error);
      return false;
    }
  }

  /**
   * Fill a text input or similar field
   * @param {HTMLElement} element
   * @param {string} value
   * @returns {boolean}
   */
  static fillTextInput(element, value) {
    try {
      // Set value using multiple methods for compatibility
      element.value = value;

      // Some frameworks use a setter
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      ).set;

      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(element, value);
      }

      return true;
    } catch (error) {
      console.error('Error filling text input:', error);
      return false;
    }
  }

  /**
   * Fill a textarea element
   * @param {HTMLElement} element
   * @param {string} value
   * @returns {boolean}
   */
  static fillTextarea(element, value) {
    try {
      element.value = value;

      // Trigger for frameworks
      const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      ).set;

      if (nativeTextAreaValueSetter) {
        nativeTextAreaValueSetter.call(element, value);
      }

      return true;
    } catch (error) {
      console.error('Error filling textarea:', error);
      return false;
    }
  }

  /**
   * Fill a select/dropdown element
   * @param {HTMLSelectElement} element
   * @param {string} value
   * @returns {boolean}
   */
  static fillSelect(element, value) {
    try {
      const options = Array.from(element.options);

      // Strategy 1: Exact value match
      let matchingOption = options.find(opt => opt.value === value);

      // Strategy 2: Exact text match
      if (!matchingOption) {
        matchingOption = options.find(opt => opt.text.trim() === value.trim());
      }

      // Strategy 3: Case-insensitive text match
      if (!matchingOption) {
        const valueLower = value.toLowerCase();
        matchingOption = options.find(opt =>
          opt.text.toLowerCase().trim() === valueLower.trim()
        );
      }

      // Strategy 4: Partial text match
      if (!matchingOption) {
        const valueLower = value.toLowerCase();
        matchingOption = options.find(opt =>
          opt.text.toLowerCase().includes(valueLower) ||
          valueLower.includes(opt.text.toLowerCase())
        );
      }

      if (matchingOption) {
        element.value = matchingOption.value;
        matchingOption.selected = true;
        return true;
      } else {
        console.warn(`No matching option found for select: "${value}"`);
        return false;
      }

    } catch (error) {
      console.error('Error filling select:', error);
      return false;
    }
  }

  /**
   * Fill a checkbox element
   * @param {HTMLElement} element
   * @param {string} value
   * @returns {boolean}
   */
  static fillCheckbox(element, value) {
    try {
      // Treat these values as "checked"
      const truthyValues = ['true', 'yes', '1', 'checked', 'on'];
      const shouldCheck = truthyValues.includes(value.toLowerCase());

      element.checked = shouldCheck;
      return true;
    } catch (error) {
      console.error('Error filling checkbox:', error);
      return false;
    }
  }

  /**
   * Fill a radio button element
   * @param {HTMLElement} element
   * @param {string} value
   * @returns {boolean}
   */
  static fillRadio(element, value) {
    try {
      const radioName = element.name || element.getAttribute('name');

      console.log('[FieldInjector] fillRadio called:', {
        radioName,
        value,
        elementId: element.id,
        elementValue: element.value
      });

      if (!radioName) {
        // No group name, just check this radio button
        console.log('[FieldInjector] No radio name, checking single radio');
        element.checked = true;
        return true;
      }

      // Find all radio buttons in the same group
      const radioGroup = document.querySelectorAll(
        `input[type="radio"][name="${radioName}"]`
      );

      console.log(`[FieldInjector] Found ${radioGroup.length} radios in group "${radioName}"`);

      if (radioGroup.length === 0) {
        element.checked = true;
        return true;
      }

      // For generic 'true' value, randomly select one from the group
      if (value === 'true' || value === '1') {
        const randomIndex = Math.floor(Math.random() * radioGroup.length);
        const selectedRadio = radioGroup[randomIndex];

        console.log(`[FieldInjector] Generic value, randomly selecting radio ${randomIndex}`);

        radioGroup.forEach(radio => {
          radio.checked = false;
        });

        selectedRadio.checked = true;
        this.triggerEvents(selectedRadio);
        return true;
      }

      // For specific value, try to match by value, label text, or sibling text
      let matchedRadio = null;
      const valueLower = value.toLowerCase();

      radioGroup.forEach((radio, index) => {
        if (matchedRadio) return; // Already found a match

        // Strategy 1: Match by value attribute
        if (radio.value && radio.value.toLowerCase() === valueLower) {
          console.log(`[FieldInjector] Matched radio ${index} by value attribute: "${radio.value}"`);
          matchedRadio = radio;
          return;
        }

        // Strategy 2: Match by associated label text
        if (radio.id) {
          const label = document.querySelector(`label[for="${radio.id}"]`);
          if (label && label.textContent.toLowerCase().includes(valueLower)) {
            console.log(`[FieldInjector] Matched radio ${index} by label[for]: "${label.textContent.trim()}"`);
            matchedRadio = radio;
            return;
          }
        }

        // Strategy 3: Match by wrapping label
        const parentLabel = radio.closest('label');
        if (parentLabel && parentLabel.textContent.toLowerCase().includes(valueLower)) {
          console.log(`[FieldInjector] Matched radio ${index} by wrapping label: "${parentLabel.textContent.trim()}"`);
          matchedRadio = radio;
          return;
        }

        // Strategy 4: Match by next sibling text
        const nextSibling = radio.nextElementSibling || radio.nextSibling;
        if (nextSibling && nextSibling.textContent &&
            nextSibling.textContent.toLowerCase().includes(valueLower)) {
          console.log(`[FieldInjector] Matched radio ${index} by next sibling: "${nextSibling.textContent.trim()}"`);
          matchedRadio = radio;
          return;
        }
      });

      if (matchedRadio) {
        // Uncheck all radios in the group
        radioGroup.forEach(radio => {
          radio.checked = false;
        });

        // Check the matched radio
        matchedRadio.checked = true;
        this.triggerEvents(matchedRadio);
        console.log('[FieldInjector] Successfully matched and checked radio');
        return true;
      }

      // No match found, randomly select one
      console.warn(`[FieldInjector] No match found for "${value}", randomly selecting one`);
      const randomIndex = Math.floor(Math.random() * radioGroup.length);
      const selectedRadio = radioGroup[randomIndex];

      radioGroup.forEach(radio => {
        radio.checked = false;
      });

      selectedRadio.checked = true;
      this.triggerEvents(selectedRadio);
      return true;

    } catch (error) {
      console.error('Error filling radio:', error);
      return false;
    }
  }

  /**
   * Trigger events on an element to notify frameworks
   * @param {HTMLElement} element
   */
  static triggerEvents(element) {
    try {
      // Events that most frameworks listen to
      const events = [
        'input',
        'change',
        'blur',
        'keyup',
        'keydown'
      ];

      events.forEach(eventType => {
        try {
          // Create and dispatch event
          const event = new Event(eventType, {
            bubbles: true,
            cancelable: true
          });

          element.dispatchEvent(event);
        } catch (e) {
          // Ignore errors for individual events
        }
      });

      // Special handling for React and other frameworks
      try {
        // Trigger React's onChange
        const inputEvent = new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertText'
        });

        element.dispatchEvent(inputEvent);
      } catch (e) {
        // Ignore
      }

    } catch (error) {
      console.error('Error triggering events:', error);
    }
  }

  /**
   * Fill multiple fields at once
   * @param {Object} fieldValues - Mapping of selector to value
   * @param {Object} fieldsData - Optional mapping of selector to full field data
   * @returns {Object} Results summary
   */
  static fillMultipleFields(fieldValues, fieldsData = null) {
    const results = {
      success: [],
      failed: [],
      total: 0,
      successCount: 0,
      failedCount: 0
    };

    for (const [selector, value] of Object.entries(fieldValues)) {
      results.total++;

      // Get field data if available
      const fieldData = fieldsData ? fieldsData[selector] : null;

      const success = this.setFieldValue(selector, value, fieldData);

      if (success) {
        results.success.push({ selector, value });
        results.successCount++;
      } else {
        results.failed.push({ selector, value });
        results.failedCount++;
      }
    }

    return results;
  }
}
