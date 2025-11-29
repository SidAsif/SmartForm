(() => {
  // src/domain/entities/FormField.js
  var FormField = class _FormField {
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
    constructor({ id, selector, label, type, placeholder = "", name = "", currentValue = "", options = [] }) {
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
      if (this.label)
        parts.push(`Label: "${this.label}"`);
      if (this.placeholder)
        parts.push(`Placeholder: "${this.placeholder}"`);
      if (this.type)
        parts.push(`Type: ${this.type}`);
      if (this.options.length > 0)
        parts.push(`Options: [${this.options.join(", ")}]`);
      return parts.join(" | ");
    }
    /**
     * Check if this field is required based on available metadata
     * @returns {boolean}
     */
    isRequired() {
      const requiredKeywords = ["required", "mandatory", "*"];
      const labelLower = this.label.toLowerCase();
      return requiredKeywords.some((keyword) => labelLower.includes(keyword));
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
      return new _FormField(data);
    }
  };

  // src/domain/services/FormDetector.js
  var FormDetector = class {
    /**
     * Process raw field data into FormField entities
     * @param {Array<Object>} rawFields - Raw field data from DOM
     * @returns {Array<FormField>}
     */
    processFields(rawFields) {
      return rawFields.map((field, index) => this.createFormField(field, index)).filter((field) => this.isValidField(field));
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
        placeholder: rawField.placeholder || "",
        name: rawField.name || "",
        currentValue: rawField.value || "",
        options: rawField.options || []
      });
    }
    /**
     * Extract the most appropriate label from available data
     * @param {Object} rawField
     * @returns {string}
     */
    extractLabel(rawField) {
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
      return `Field ${rawField.type || "input"}`;
    }
    /**
     * Clean and normalize label text
     * @param {string} label
     * @returns {string}
     */
    cleanLabel(label) {
      return label.trim().replace(/\s+/g, " ").replace(/[*:]+$/, "").trim();
    }
    /**
     * Convert camelCase or snake_case attribute names to human-readable labels
     * @param {string} attrName
     * @returns {string}
     */
    humanizeAttributeName(attrName) {
      return attrName.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").trim().split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
    }
    /**
     * Normalize input type to standard categories
     * @param {string} type
     * @returns {string}
     */
    normalizeType(type) {
      const typeMap = {
        "text": "text",
        "email": "email",
        "tel": "tel",
        "phone": "tel",
        "number": "number",
        "url": "url",
        "date": "date",
        "datetime-local": "datetime",
        "time": "time",
        "password": "password",
        "search": "text",
        "textarea": "textarea",
        "select": "select",
        "select-one": "select",
        "select-multiple": "select-multiple",
        "radio": "radio",
        "checkbox": "checkbox"
      };
      return typeMap[type?.toLowerCase()] || "text";
    }
    /**
     * Validate if a field should be included
     * @param {FormField} field
     * @returns {boolean}
     */
    isValidField(field) {
      if (field.type === "password") {
        return false;
      }
      if (!field.selector || field.selector.trim() === "") {
        return false;
      }
      if (!field.label || field.label.trim() === "") {
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
      return {
        "main": fields
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
      fields.forEach((field) => {
        stats.byType[field.type] = (stats.byType[field.type] || 0) + 1;
        if (field.isRequired()) {
          stats.required++;
        } else {
          stats.optional++;
        }
      });
      return stats;
    }
  };

  // src/infrastructure/content/SelectorGenerator.js
  var SelectorGenerator = class {
    /**
     * Generate the most robust CSS selector for an element
     * @param {HTMLElement} element
     * @returns {string}
     */
    static generate(element) {
      if (element.id && element.id.trim()) {
        return `#${CSS.escape(element.id)}`;
      }
      if (element.name && element.name.trim()) {
        const selector = `${element.tagName.toLowerCase()}[name="${CSS.escape(element.name)}"]`;
        if (this.isUnique(selector, element)) {
          return selector;
        }
      }
      const dataSelector = this.tryDataAttributeSelector(element);
      if (dataSelector && this.isUnique(dataSelector, element)) {
        return dataSelector;
      }
      const classSelector = this.tryClassSelector(element);
      if (classSelector && this.isUnique(classSelector, element)) {
        return classSelector;
      }
      return this.generateNthSelector(element);
    }
    /**
     * Try to create selector using data attributes
     * @param {HTMLElement} element
     * @returns {string|null}
     */
    static tryDataAttributeSelector(element) {
      const dataAttrs = Array.from(element.attributes).filter((attr) => attr.name.startsWith("data-")).filter((attr) => attr.value.trim());
      if (dataAttrs.length > 0) {
        const attr = dataAttrs[0];
        return `${element.tagName.toLowerCase()}[${attr.name}="${CSS.escape(attr.value)}"]`;
      }
      return null;
    }
    /**
     * Try to create selector using classes (if specific enough)
     * @param {HTMLElement} element
     * @returns {string|null}
     */
    static tryClassSelector(element) {
      if (!element.className || typeof element.className !== "string") {
        return null;
      }
      const classes = element.className.trim().split(/\s+/).filter((c) => c);
      if (classes.length === 0) {
        return null;
      }
      const className = classes[0];
      return `${element.tagName.toLowerCase()}.${CSS.escape(className)}`;
    }
    /**
     * Generate nth-of-type selector with parent context
     * @param {HTMLElement} element
     * @returns {string}
     */
    static generateNthSelector(element) {
      const tagName = element.tagName.toLowerCase();
      const parent = element.parentElement;
      if (!parent) {
        return tagName;
      }
      const siblings = Array.from(parent.children).filter(
        (child) => child.tagName.toLowerCase() === tagName
      );
      const index = siblings.indexOf(element) + 1;
      const parentSelector = parent.tagName.toLowerCase();
      if (siblings.length === 1) {
        return `${parentSelector} > ${tagName}`;
      }
      return `${parentSelector} > ${tagName}:nth-of-type(${index})`;
    }
    /**
     * Check if selector uniquely identifies the element
     * @param {string} selector
     * @param {HTMLElement} element
     * @returns {boolean}
     */
    static isUnique(selector, element) {
      try {
        const matches = document.querySelectorAll(selector);
        return matches.length === 1 && matches[0] === element;
      } catch (e) {
        return false;
      }
    }
    /**
     * Verify a selector works and points to the correct element
     * @param {string} selector
     * @param {HTMLElement} expectedElement
     * @returns {boolean}
     */
    static verify(selector, expectedElement) {
      try {
        const element = document.querySelector(selector);
        return element === expectedElement;
      } catch (e) {
        return false;
      }
    }
  };

  // src/infrastructure/content/DOMFieldExtractor.js
  var DOMFieldExtractor = class {
    /**
     * Scan the page and collect all fillable form fields
     * Looks for inputs, textareas, and select dropdowns that are visible to users
     * @returns {Array<Object>} List of field data objects with labels, selectors, and metadata
     */
    static extractAll() {
      const fields = [];
      const processedRadioGroups = /* @__PURE__ */ new Set();
      const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="image"]):not([type="reset"])');
      const textareas = document.querySelectorAll("textarea");
      const selects = document.querySelectorAll("select");
      inputs.forEach((input) => {
        if (input.type === "radio" && input.name) {
          if (processedRadioGroups.has(input.name)) {
            return;
          }
          processedRadioGroups.add(input.name);
        }
        const fieldData = this.extractFieldData(input);
        if (fieldData) {
          fields.push(fieldData);
        }
      });
      textareas.forEach((textarea) => {
        const fieldData = this.extractFieldData(textarea);
        if (fieldData)
          fields.push(fieldData);
      });
      selects.forEach((select) => {
        const fieldData = this.extractFieldData(select);
        if (fieldData)
          fields.push(fieldData);
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
      if (!this.isVisible(element)) {
        return null;
      }
      const tagName = element.tagName.toLowerCase();
      const type = element.type || tagName;
      const nameAttr = element.name || element.getAttribute("ng-model") || element.getAttribute("formcontrolname") || "";
      return {
        selector: SelectorGenerator.generate(element),
        // Unique CSS selector to find this field later
        label: this.findLabel(element),
        // Human-readable label (e.g., "First Name")
        ariaLabel: element.getAttribute("aria-label") || "",
        // Accessibility label
        placeholder: element.placeholder || "",
        // Placeholder text
        name: nameAttr,
        // Field name attribute
        id: element.id || "",
        // Field ID
        type,
        // Input type (text, email, select, etc.)
        value: element.value || "",
        // Current value
        required: element.required || false,
        // Is this field required?
        options: this.extractOptions(element)
        // For dropdowns/radios - list of choices
      };
    }
    /**
     * Find the label text for a form field by trying different common HTML patterns
     * Forms use many different ways to label fields, so we check all the usual methods
     * @param {HTMLElement} element - The input field we're looking for a label for
     * @returns {string} The label text, or empty string if none found
     */
    static findLabel(element) {
      if (element.id) {
        const label = document.querySelector(`label[for="${element.id}"]`);
        if (label) {
          return this.cleanLabelText(label.textContent);
        }
      }
      const parentLabel = element.closest("label");
      if (parentLabel) {
        return this.cleanLabelText(parentLabel.textContent);
      }
      let sibling = element.previousElementSibling;
      while (sibling) {
        if (sibling.tagName.toLowerCase() === "label") {
          return this.cleanLabelText(sibling.textContent);
        }
        sibling = sibling.previousElementSibling;
      }
      const parent = element.parentElement;
      if (parent) {
        const parentSibling = parent.previousElementSibling;
        if (parentSibling && parentSibling.tagName.toLowerCase() === "label") {
          return this.cleanLabelText(parentSibling.textContent);
        }
      }
      const nearbyText = this.findNearbyText(element);
      if (nearbyText) {
        return nearbyText;
      }
      return "";
    }
    /**
     * Search for text near a field that could be serving as a label
     * Some forms don't use proper <label> tags, just plain text nearby
     * @param {HTMLElement} element - The input field
     * @returns {string} Text found near the field that looks like a label
     */
    static findNearbyText(element) {
      const parent = element.parentElement;
      if (!parent)
        return "";
      const walker = document.createTreeWalker(
        parent,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      let textContent = "";
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
     * Clean up label text by removing junk characters and extra whitespace
     * Makes labels easier to match against field types (e.g., "Email *:" becomes "Email")
     * @param {string} text - Raw label text from the page
     * @returns {string} Cleaned, normalized label text
     */
    static cleanLabelText(text) {
      if (!text)
        return "";
      return text.replace(/\n/g, " ").replace(/\s+/g, " ").replace(/[*:]+$/g, "").trim().substring(0, 200);
    }
    /**
     * Get the list of available choices for dropdown or radio button fields
     * For dropdowns, returns all <option> values. For radios, finds all buttons in the group
     * @param {HTMLElement} element - The select or radio input element
     * @returns {Array<string>} List of choice labels (e.g., ["Male", "Female", "Other"])
     */
    static extractOptions(element) {
      if (element.tagName.toLowerCase() === "select") {
        return Array.from(element.options).map((option) => option.text.trim()).filter((text) => text.length > 0);
      }
      if (element.type === "radio" && element.name) {
        const radioGroup = document.querySelectorAll(
          `input[type="radio"][name="${element.name}"]`
        );
        const options = [];
        radioGroup.forEach((radio) => {
          let labelText = "";
          if (radio.id) {
            const label = document.querySelector(`label[for="${radio.id}"]`);
            if (label) {
              labelText = this.cleanLabelText(label.textContent);
            }
          }
          if (!labelText) {
            const parentLabel = radio.closest("label");
            if (parentLabel) {
              labelText = this.cleanLabelText(parentLabel.textContent);
            }
          }
          if (!labelText && radio.nextElementSibling) {
            const nextSibling = radio.nextElementSibling;
            if (nextSibling.tagName.toLowerCase() === "label") {
              labelText = this.cleanLabelText(nextSibling.textContent);
            } else {
              labelText = this.cleanLabelText(nextSibling.textContent);
            }
          }
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
     * Check if a form field is actually visible on the page
     * Hidden fields should be ignored - we only want to fill fields users can see
     * @param {HTMLElement} element - The field to check
     * @returns {boolean} True if visible, false if hidden
     */
    static isVisible(element) {
      const style2 = window.getComputedStyle(element);
      if (style2.display === "none" || style2.visibility === "hidden") {
        return false;
      }
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
        const tagName = element.tagName.toLowerCase();
        if (tagName === "select") {
          return this.fillSelect(element, value);
        } else if (element.type === "checkbox") {
          element.checked = ["true", "yes", "1"].includes(value.toLowerCase());
        } else if (element.type === "radio") {
          element.checked = true;
        } else {
          element.value = value;
        }
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
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
      let matchingOption = options.find(
        (opt) => opt.text.toLowerCase() === value.toLowerCase() || opt.value.toLowerCase() === value.toLowerCase()
      );
      if (!matchingOption) {
        matchingOption = options.find(
          (opt) => opt.text.toLowerCase().includes(value.toLowerCase()) || value.toLowerCase().includes(opt.text.toLowerCase())
        );
      }
      if (matchingOption) {
        element.value = matchingOption.value;
        element.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
      return false;
    }
  };

  // src/application/useCases/ExtractFieldsUseCase.js
  var ExtractFieldsUseCase = class {
    constructor() {
      this.formDetector = new FormDetector();
    }
    /**
     * Execute the field extraction workflow
     * @returns {Object} Result containing fields and metadata
     */
    execute() {
      try {
        const rawFields = DOMFieldExtractor.extractAll();
        const formFields = this.formDetector.processFields(rawFields);
        const stats = this.formDetector.getFieldStatistics(formFields);
        const serializedFields = formFields.map((field) => field.toJSON());
        return {
          success: true,
          fields: serializedFields,
          count: serializedFields.length,
          stats,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
      } catch (error) {
        console.error("ExtractFieldsUseCase error:", error);
        return {
          success: false,
          fields: [],
          count: 0,
          error: error.message,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
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
  };

  // src/infrastructure/content/FieldInjector.js
  var FieldInjector = class {
    /**
     * Safely query for an element
     * @param {string} selector
     * @returns {HTMLElement|null}
     */
    static safeQuery(selector) {
      try {
        if (!selector || typeof selector !== "string") {
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
        if (value === void 0 || value === null) {
          console.warn(`Skipping undefined/null value for: ${selector}`);
          return false;
        }
        const stringValue = String(value);
        const tagName = element.tagName.toLowerCase();
        const inputType = element.type ? element.type.toLowerCase() : "";
        let success = false;
        if (tagName === "select") {
          success = this.fillSelect(element, stringValue);
        } else if (tagName === "textarea") {
          success = this.fillTextarea(element, stringValue);
        } else if (inputType === "checkbox") {
          success = this.fillCheckbox(element, stringValue);
        } else if (inputType === "radio") {
          success = this.fillRadio(element, stringValue);
        } else if (inputType === "file") {
          console.warn(`Cannot programmatically fill file input: ${selector}`);
          return false;
        } else {
          success = this.fillTextInput(element, stringValue);
        }
        if (success) {
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
        element.value = value;
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        ).set;
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(element, value);
        }
        return true;
      } catch (error) {
        console.error("Error filling text input:", error);
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
        const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          "value"
        ).set;
        if (nativeTextAreaValueSetter) {
          nativeTextAreaValueSetter.call(element, value);
        }
        return true;
      } catch (error) {
        console.error("Error filling textarea:", error);
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
        let matchingOption = options.find((opt) => opt.value === value);
        if (!matchingOption) {
          matchingOption = options.find((opt) => opt.text.trim() === value.trim());
        }
        if (!matchingOption) {
          const valueLower = value.toLowerCase();
          matchingOption = options.find(
            (opt) => opt.text.toLowerCase().trim() === valueLower.trim()
          );
        }
        if (!matchingOption) {
          const valueLower = value.toLowerCase();
          matchingOption = options.find(
            (opt) => opt.text.toLowerCase().includes(valueLower) || valueLower.includes(opt.text.toLowerCase())
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
        console.error("Error filling select:", error);
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
        const truthyValues = ["true", "yes", "1", "checked", "on"];
        const shouldCheck = truthyValues.includes(value.toLowerCase());
        element.checked = shouldCheck;
        return true;
      } catch (error) {
        console.error("Error filling checkbox:", error);
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
        const radioName = element.name || element.getAttribute("name");
        if (!radioName) {
          element.checked = true;
          return true;
        }
        const radioGroup = document.querySelectorAll(
          `input[type="radio"][name="${radioName}"]`
        );
        if (radioGroup.length === 0) {
          element.checked = true;
          return true;
        }
        if (value === "true" || value === "1") {
          const randomIndex2 = Math.floor(Math.random() * radioGroup.length);
          const selectedRadio2 = radioGroup[randomIndex2];
          radioGroup.forEach((radio) => {
            radio.checked = false;
          });
          selectedRadio2.checked = true;
          this.triggerEvents(selectedRadio2);
          return true;
        }
        let matchedRadio = null;
        const valueLower = value.toLowerCase();
        radioGroup.forEach((radio) => {
          if (matchedRadio)
            return;
          if (radio.value && radio.value.toLowerCase() === valueLower) {
            matchedRadio = radio;
            return;
          }
          if (radio.id) {
            const label = document.querySelector(`label[for="${radio.id}"]`);
            if (label && label.textContent.toLowerCase().includes(valueLower)) {
              matchedRadio = radio;
              return;
            }
          }
          const parentLabel = radio.closest("label");
          if (parentLabel && parentLabel.textContent.toLowerCase().includes(valueLower)) {
            matchedRadio = radio;
            return;
          }
          const nextSibling = radio.nextElementSibling || radio.nextSibling;
          if (nextSibling && nextSibling.textContent && nextSibling.textContent.toLowerCase().includes(valueLower)) {
            matchedRadio = radio;
            return;
          }
        });
        if (matchedRadio) {
          radioGroup.forEach((radio) => {
            radio.checked = false;
          });
          matchedRadio.checked = true;
          this.triggerEvents(matchedRadio);
          return true;
        }
        const randomIndex = Math.floor(Math.random() * radioGroup.length);
        const selectedRadio = radioGroup[randomIndex];
        radioGroup.forEach((radio) => {
          radio.checked = false;
        });
        selectedRadio.checked = true;
        this.triggerEvents(selectedRadio);
        return true;
      } catch (error) {
        console.error("Error filling radio:", error);
        return false;
      }
    }
    /**
     * Trigger events on an element to notify frameworks
     * @param {HTMLElement} element
     */
    static triggerEvents(element) {
      try {
        const events = [
          "input",
          "change",
          "blur",
          "keyup",
          "keydown"
        ];
        events.forEach((eventType) => {
          try {
            const event = new Event(eventType, {
              bubbles: true,
              cancelable: true
            });
            element.dispatchEvent(event);
          } catch (e) {
          }
        });
        try {
          const inputEvent = new InputEvent("input", {
            bubbles: true,
            cancelable: true,
            inputType: "insertText"
          });
          element.dispatchEvent(inputEvent);
        } catch (e) {
        }
      } catch (error) {
        console.error("Error triggering events:", error);
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
  };

  // src/infrastructure/content/ToastNotification.js
  var ToastNotification = class {
    /**
     * Show a toast notification
     * @param {string} message - The message to display
     * @param {string} type - Type of notification: 'success', 'error', 'info'
     * @param {number} duration - Duration in milliseconds (default: 4000)
     */
    static show(message, type = "success", duration = 4e3) {
      this.hide();
      const toast = this.createToastElement(message, type);
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.classList.add("show");
      }, 10);
      setTimeout(() => {
        this.hide();
      }, duration);
    }
    /**
     * Show a success toast
     * @param {string} message
     */
    static showSuccess(message) {
      this.show(message, "success");
    }
    /**
     * Show an error toast
     * @param {string} message
     */
    static showError(message) {
      this.show(message, "error");
    }
    /**
     * Show an info toast
     * @param {string} message
     */
    static showInfo(message) {
      this.show(message, "info");
    }
    /**
     * Hide the current toast
     */
    static hide() {
      const existing = document.querySelector(".smartform-toast");
      if (existing) {
        existing.classList.remove("show");
        setTimeout(() => {
          if (existing.parentNode) {
            existing.parentNode.removeChild(existing);
          }
        }, 300);
      }
    }
    /**
     * Create the toast DOM element with styling
     * @param {string} message
     * @param {string} type
     * @returns {HTMLElement}
     */
    static createToastElement(message, type) {
      const toast = document.createElement("div");
      toast.className = `smartform-toast smartform-toast-${type}`;
      const config = this.getTypeConfig(type);
      toast.innerHTML = `
      <div class="smartform-toast-icon">${config.icon}</div>
      <div class="smartform-toast-message">${this.escapeHtml(message)}</div>
      <button class="smartform-toast-close" aria-label="Close">&times;</button>
    `;
      this.applyStyles(toast, config);
      const closeBtn = toast.querySelector(".smartform-toast-close");
      closeBtn.addEventListener("click", () => this.hide());
      return toast;
    }
    /**
     * Get configuration for toast type
     * @param {string} type
     * @returns {Object}
     */
    static getTypeConfig(type) {
      const configs = {
        success: {
          icon: "\u2713",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "#ffffff"
        },
        error: {
          icon: "\u2715",
          background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          color: "#ffffff"
        },
        info: {
          icon: "\u2139",
          background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
          color: "#ffffff"
        }
      };
      return configs[type] || configs.info;
    }
    /**
     * Apply styles to toast element
     * @param {HTMLElement} toast
     * @param {Object} config
     */
    static applyStyles(toast, config) {
      Object.assign(toast.style, {
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: "999999",
        minWidth: "300px",
        maxWidth: "400px",
        background: config.background,
        color: config.color,
        padding: "16px 20px",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: "14px",
        fontWeight: "500",
        transform: "translateX(450px)",
        opacity: "0",
        transition: "all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        pointerEvents: "auto"
      });
      const icon = toast.querySelector(".smartform-toast-icon");
      Object.assign(icon.style, {
        fontSize: "20px",
        fontWeight: "bold",
        flexShrink: "0"
      });
      const message = toast.querySelector(".smartform-toast-message");
      Object.assign(message.style, {
        flex: "1",
        lineHeight: "1.4"
      });
      const closeBtn = toast.querySelector(".smartform-toast-close");
      Object.assign(closeBtn.style, {
        background: "transparent",
        border: "none",
        color: config.color,
        fontSize: "24px",
        fontWeight: "bold",
        cursor: "pointer",
        padding: "0",
        width: "24px",
        height: "24px",
        lineHeight: "24px",
        textAlign: "center",
        opacity: "0.7",
        transition: "opacity 0.2s",
        flexShrink: "0"
      });
      closeBtn.addEventListener("mouseenter", () => {
        closeBtn.style.opacity = "1";
      });
      closeBtn.addEventListener("mouseleave", () => {
        closeBtn.style.opacity = "0.7";
      });
    }
    /**
     * Escape HTML to prevent XSS
     * @param {string} text
     * @returns {string}
     */
    static escapeHtml(text) {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    }
  };
  var style = document.createElement("style");
  style.textContent = `
  .smartform-toast.show {
    transform: translateX(0) !important;
    opacity: 1 !important;
  }
`;
  if (document.head) {
    document.head.appendChild(style);
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      document.head.appendChild(style);
    });
  }

  // src/application/useCases/FillFieldsUseCase.js
  var FillFieldsUseCase = class {
    /**
     * Execute the field filling operation
     * @param {Object} params
     * @param {Object} params.fieldValues - Mapping of selector to value
     * @returns {Object} Result summary
     */
    execute({ fieldValues }) {
      try {
        console.log("FillFieldsUseCase: Starting execution", {
          fieldCount: Object.keys(fieldValues).length
        });
        if (!fieldValues || typeof fieldValues !== "object") {
          throw new Error("Invalid field values provided");
        }
        if (Object.keys(fieldValues).length === 0) {
          throw new Error("No field values to fill");
        }
        const results = FieldInjector.fillMultipleFields(fieldValues);
        console.log("FillFieldsUseCase: Fill complete", {
          total: results.total,
          success: results.successCount,
          failed: results.failedCount
        });
        if (results.successCount > 0) {
          if (results.failedCount === 0) {
            ToastNotification.showSuccess(
              `Form filled successfully! ${results.successCount} field${results.successCount === 1 ? "" : "s"} completed.`
            );
          } else {
            ToastNotification.showInfo(
              `Filled ${results.successCount} of ${results.total} fields. ${results.failedCount} field${results.failedCount === 1 ? "" : "s"} could not be filled.`
            );
          }
        } else {
          ToastNotification.showError(
            "Failed to fill form fields. Please try again."
          );
        }
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
        console.error("FillFieldsUseCase error:", error);
        ToastNotification.showError(
          error.message || "An error occurred while filling the form"
        );
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
        return "No fields were filled";
      }
      if (results.failedCount === 0) {
        return `Successfully filled all ${results.successCount} fields`;
      }
      return `Filled ${results.successCount} of ${results.total} fields (${results.failedCount} failed)`;
    }
  };

  // src/infrastructure/content/content.js
  console.log("SmartForm Auto-Filler content script loaded");
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Content script received message:", request);
    switch (request.action) {
      case "extract_fields":
        handleExtractFields(sendResponse);
        return true;
      case "fill_fields":
        handleFillFields(request.data, sendResponse);
        return true;
      case "ping":
        sendResponse({ status: "ready" });
        return false;
      default:
        sendResponse({ success: false, error: "Unknown action" });
        return false;
    }
  });
  function handleExtractFields(sendResponse) {
    try {
      const useCase = new ExtractFieldsUseCase();
      const result = useCase.execute();
      console.log("Extracted fields:", result);
      sendResponse({
        success: true,
        fields: result.fields,
        count: result.count,
        stats: result.stats
      });
    } catch (error) {
      console.error("Error extracting fields:", error);
      sendResponse({
        success: false,
        error: error.message,
        fields: []
      });
    }
  }
  function handleFillFields(data, sendResponse) {
    try {
      console.log("Filling fields with data:", {
        fieldCount: Object.keys(data || {}).length
      });
      if (!data || typeof data !== "object") {
        throw new Error("Invalid field data provided");
      }
      const useCase = new FillFieldsUseCase();
      const result = useCase.execute({
        fieldValues: data
      });
      console.log("Field filling complete:", result);
      sendResponse(result);
    } catch (error) {
      console.error("Error filling fields:", error);
      sendResponse({
        success: false,
        filled: 0,
        error: error.message
      });
    }
  }
  function notifyReady() {
    chrome.runtime.sendMessage({
      action: "content_ready",
      url: window.location.href
    }).catch(() => {
    });
    updateBadge();
  }
  function updateBadge() {
    try {
      const useCase = new ExtractFieldsUseCase();
      const result = useCase.execute();
      chrome.runtime.sendMessage({
        action: "update_badge",
        count: result.count
      }).catch(() => {
      });
    } catch (error) {
      console.error("Error updating badge:", error);
    }
  }
  notifyReady();
  var lastUrl = window.location.href;
  new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      updateBadge();
    }
  }).observe(document.body, { childList: true, subtree: true });
})();
