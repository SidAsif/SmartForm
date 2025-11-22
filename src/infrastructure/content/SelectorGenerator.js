/**
 * SelectorGenerator
 *
 * Infrastructure utility for generating robust CSS selectors for DOM elements.
 * Priority: id > name > data attributes > nth-of-type fallback
 */
export class SelectorGenerator {
  /**
   * Generate the most robust CSS selector for an element
   * @param {HTMLElement} element
   * @returns {string}
   */
  static generate(element) {
    // Strategy 1: Use ID if available (most reliable)
    if (element.id && element.id.trim()) {
      return `#${CSS.escape(element.id)}`;
    }

    // Strategy 2: Use name attribute for form fields
    if (element.name && element.name.trim()) {
      const selector = `${element.tagName.toLowerCase()}[name="${CSS.escape(element.name)}"]`;

      // Verify uniqueness
      if (this.isUnique(selector, element)) {
        return selector;
      }
    }

    // Strategy 3: Use data attributes if present
    const dataSelector = this.tryDataAttributeSelector(element);
    if (dataSelector && this.isUnique(dataSelector, element)) {
      return dataSelector;
    }

    // Strategy 4: Use class-based selector if reliable
    const classSelector = this.tryClassSelector(element);
    if (classSelector && this.isUnique(classSelector, element)) {
      return classSelector;
    }

    // Strategy 5: Use nth-of-type with parent context (fallback)
    return this.generateNthSelector(element);
  }

  /**
   * Try to create selector using data attributes
   * @param {HTMLElement} element
   * @returns {string|null}
   */
  static tryDataAttributeSelector(element) {
    const dataAttrs = Array.from(element.attributes)
      .filter(attr => attr.name.startsWith('data-'))
      .filter(attr => attr.value.trim());

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
    if (!element.className || typeof element.className !== 'string') {
      return null;
    }

    const classes = element.className.trim().split(/\s+/).filter(c => c);

    if (classes.length === 0) {
      return null;
    }

    // Use first class with tag name
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

    // Find the index among siblings of the same type
    const siblings = Array.from(parent.children).filter(
      child => child.tagName.toLowerCase() === tagName
    );
    const index = siblings.indexOf(element) + 1;

    // Build selector with parent context
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
}
