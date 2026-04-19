/* ==========================================================================
   USER DETECTION & REDIRECTION
   ========================================================================== */

/**
 * Check if user is logged in and redirect accordingly
 * API returns { user: {...} } or { user: null } – needs to unwrap wrapper
 */
export async function checkUserAndRedirect() {
  try {
    const response = await fetch('/api/user');
    
    if (!response.ok) {
      // API error, stay on landing page
      console.warn('User API not available, staying on landing page');
      return;
    }
    
    const data = await response.json();
    const user = data.user || null; // Unwrap { user: ... } wrapper
    
    if (!user) {
      // Not logged in → stay on landing page
      return;
    }
    
    // User is logged in, redirect based on role
    if (user.role === 'pending') {
      window.location.href = '/pending';
    } else {
      window.location.href = '/dashboard';
    }
  } catch (error) {
    // Network error or other issue, stay on landing page
    console.warn('Error checking user status:', error);
  }
}

/**
 * Initialize language toggle button
 */
export function initLanguageToggle() {
  const langToggle = document.querySelector('.lang-toggle');
  if (!langToggle) return;
  
  langToggle.addEventListener('click', () => {
    // This would integrate with i18n.js
    // For now, just toggle between FI/EN
    const currentLang = langToggle.textContent.trim();
    const newLang = currentLang === 'FI' ? 'EN' : 'FI';
    
    langToggle.textContent = newLang;
    langToggle.setAttribute('aria-label', `Switch to ${currentLang === 'FI' ? 'English' : 'Finnish'}`);
    
    // Here you would trigger i18n language change
    // window.i18n?.setLanguage(newLang.toLowerCase());
    
    console.log(`Language switched to ${newLang}`);
  });
}

/**
 * Initialize all user-related functionality
 */
export function initUserDetection() {
  // Check user and redirect if logged in
  checkUserAndRedirect();
  
  // Initialize language toggle
  initLanguageToggle();
  
  console.log('User detection initialized');
}

// Auto-initialize if this script is loaded directly
if (typeof window !== 'undefined' && !window.userDetectionInitialized) {
  document.addEventListener('DOMContentLoaded', initUserDetection);
  window.userDetectionInitialized = true;
}