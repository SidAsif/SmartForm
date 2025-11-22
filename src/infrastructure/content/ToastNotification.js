/**
 * ToastNotification
 *
 * Infrastructure utility for showing toast notifications on the webpage.
 * Injects a styled div into the page with smooth animations.
 */
export class ToastNotification {
  /**
   * Show a toast notification
   * @param {string} message - The message to display
   * @param {string} type - Type of notification: 'success', 'error', 'info'
   * @param {number} duration - Duration in milliseconds (default: 4000)
   */
  static show(message, type = 'success', duration = 4000) {
    // Remove existing toast if any
    this.hide();

    // Create toast element
    const toast = this.createToastElement(message, type);

    // Add to DOM
    document.body.appendChild(toast);

    // Trigger animation (small delay for CSS transition)
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    // Auto-hide after duration
    setTimeout(() => {
      this.hide();
    }, duration);
  }

  /**
   * Show a success toast
   * @param {string} message
   */
  static showSuccess(message) {
    this.show(message, 'success');
  }

  /**
   * Show an error toast
   * @param {string} message
   */
  static showError(message) {
    this.show(message, 'error');
  }

  /**
   * Show an info toast
   * @param {string} message
   */
  static showInfo(message) {
    this.show(message, 'info');
  }

  /**
   * Hide the current toast
   */
  static hide() {
    const existing = document.querySelector('.smartform-toast');

    if (existing) {
      existing.classList.remove('show');

      // Remove from DOM after animation completes
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
    const toast = document.createElement('div');
    toast.className = `smartform-toast smartform-toast-${type}`;

    // Get icon and colors based on type
    const config = this.getTypeConfig(type);

    toast.innerHTML = `
      <div class="smartform-toast-icon">${config.icon}</div>
      <div class="smartform-toast-message">${this.escapeHtml(message)}</div>
      <button class="smartform-toast-close" aria-label="Close">&times;</button>
    `;

    // Add inline styles
    this.applyStyles(toast, config);

    // Add close button handler
    const closeBtn = toast.querySelector('.smartform-toast-close');
    closeBtn.addEventListener('click', () => this.hide());

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
        icon: '✓',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#ffffff'
      },
      error: {
        icon: '✕',
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        color: '#ffffff'
      },
      info: {
        icon: 'ℹ',
        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        color: '#ffffff'
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
    // Container styles
    Object.assign(toast.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: '999999',
      minWidth: '300px',
      maxWidth: '400px',
      background: config.background,
      color: config.color,
      padding: '16px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '14px',
      fontWeight: '500',
      transform: 'translateX(450px)',
      opacity: '0',
      transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      pointerEvents: 'auto'
    });

    // Icon styles
    const icon = toast.querySelector('.smartform-toast-icon');
    Object.assign(icon.style, {
      fontSize: '20px',
      fontWeight: 'bold',
      flexShrink: '0'
    });

    // Message styles
    const message = toast.querySelector('.smartform-toast-message');
    Object.assign(message.style, {
      flex: '1',
      lineHeight: '1.4'
    });

    // Close button styles
    const closeBtn = toast.querySelector('.smartform-toast-close');
    Object.assign(closeBtn.style, {
      background: 'transparent',
      border: 'none',
      color: config.color,
      fontSize: '24px',
      fontWeight: 'bold',
      cursor: 'pointer',
      padding: '0',
      width: '24px',
      height: '24px',
      lineHeight: '24px',
      textAlign: 'center',
      opacity: '0.7',
      transition: 'opacity 0.2s',
      flexShrink: '0'
    });

    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.opacity = '1';
    });

    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.opacity = '0.7';
    });
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text
   * @returns {string}
   */
  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Add CSS class for show state
const style = document.createElement('style');
style.textContent = `
  .smartform-toast.show {
    transform: translateX(0) !important;
    opacity: 1 !important;
  }
`;

// Inject style into document head when this module loads
if (document.head) {
  document.head.appendChild(style);
} else {
  document.addEventListener('DOMContentLoaded', () => {
    document.head.appendChild(style);
  });
}
