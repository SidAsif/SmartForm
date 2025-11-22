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
  static setFieldValue(selector, value) {
    try {
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

      if (!radioName) {
        // No group name, just check this radio button
        element.checked = true;
        return true;
      }

      // Find all radio buttons in the same group
      const radioGroup = document.querySelectorAll(
        `input[type="radio"][name="${radioName}"]`
      );

      if (radioGroup.length === 0) {
        element.checked = true;
        return true;
      }

      // For generic 'true' value, randomly select one from the group
      if (value === 'true' || value === '1') {
        const randomIndex = Math.floor(Math.random() * radioGroup.length);
        const selectedRadio = radioGroup[randomIndex];

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

      radioGroup.forEach((radio) => {
        if (matchedRadio) return; // Already found a match

        // Strategy 1: Match by value attribute
        if (radio.value && radio.value.toLowerCase() === valueLower) {
          matchedRadio = radio;
          return;
        }

        // Strategy 2: Match by associated label text
        if (radio.id) {
          const label = document.querySelector(`label[for="${radio.id}"]`);
          if (label && label.textContent.toLowerCase().includes(valueLower)) {
            matchedRadio = radio;
            return;
          }
        }

        // Strategy 3: Match by wrapping label
        const parentLabel = radio.closest('label');
        if (parentLabel && parentLabel.textContent.toLowerCase().includes(valueLower)) {
          matchedRadio = radio;
          return;
        }

        // Strategy 4: Match by next sibling text
        const nextSibling = radio.nextElementSibling || radio.nextSibling;
        if (nextSibling && nextSibling.textContent &&
            nextSibling.textContent.toLowerCase().includes(valueLower)) {
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
        return true;
      }

      // No match found, randomly select one
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
   * @returns {Object} Results summary
   */
  static fillMultipleFields(fieldValues) {
    const results = {
      success: [],
      failed: [],
      total: 0,
      successCount: 0,
      failedCount: 0
    };

    for (const [selector, value] of Object.entries(fieldValues)) {
      results.total++;

      const success = this.setFieldValue(selector, value);

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
