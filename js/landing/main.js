/* ==========================================================================
   LANDING PAGE MAIN JAVASCRIPT
   ========================================================================== */

// Import modules
import { initAllScrollAnimations } from './scroll-animations.js';
import { initContactModal } from './contact-modal.js';
import { initUserDetection } from './user-detection.js';

/**
 * Initialize all landing page functionality
 */
export function initLandingPage() {
  console.log('Initializing landing page...');
  
  // Initialize scroll animations
  initAllScrollAnimations();
  
  // Initialize contact modal
  initContactModal();
  
  // Initialize user detection and language toggle
  initUserDetection();
  
  // Additional initialization can go here
  initAdditionalFeatures();
  
  console.log('Landing page initialized successfully');
}

/**
 * Initialize additional features
 */
function initAdditionalFeatures() {
  // Add any additional initialization here
  // For example: analytics, tracking, etc.
  
  // Example: Log page view
  if (typeof gtag !== 'undefined') {
    gtag('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href
    });
  }
}

/**
 * Utility function to check if element is in viewport
 */
export function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Debounce function for performance optimization
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Auto-initialize when DOM is loaded
if (typeof window !== 'undefined' && !window.landingPageInitialized) {
  document.addEventListener('DOMContentLoaded', initLandingPage);
  window.landingPageInitialized = true;
}

// Export for manual initialization if needed
window.initLandingPage = initLandingPage;