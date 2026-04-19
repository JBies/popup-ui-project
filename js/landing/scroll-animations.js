/* ==========================================================================
   SCROLL ANIMATIONS
   ========================================================================== */

/**
 * Initialize scroll fade-in animations
 * Uses Intersection Observer to add 'visible' class when elements enter viewport
 */
export function initScrollAnimations() {
  const fadeEls = document.querySelectorAll('.fade-in');
  
  if (!fadeEls.length || !('IntersectionObserver' in window)) {
    // Fallback: show all elements immediately if IntersectionObserver not supported
    fadeEls.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { 
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px' // Trigger when element is 50px from bottom of viewport
    }
  );

  fadeEls.forEach((el) => observer.observe(el));
}

/**
 * Initialize smooth scrolling for anchor links
 */
export function initSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      
      // Skip if it's just "#" or empty
      if (href === '#' || href === '') return;
      
      const targetElement = document.querySelector(href);
      if (targetElement) {
        e.preventDefault();
        
        // Calculate header height for offset
        const header = document.querySelector('header');
        const headerHeight = header ? header.offsetHeight : 0;
        
        window.scrollTo({
          top: targetElement.offsetTop - headerHeight - 20,
          behavior: 'smooth'
        });
        
        // Update URL without jumping
        if (history.pushState) {
          history.pushState(null, null, href);
        } else {
          window.location.hash = href;
        }
      }
    });
  });
}

/**
 * Initialize scroll progress indicator (optional)
 */
export function initScrollProgress() {
  const progressBar = document.querySelector('.scroll-progress');
  if (!progressBar) return;

  window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    progressBar.style.width = scrolled + '%';
  });
}

/**
 * Initialize all scroll-related animations
 */
export function initAllScrollAnimations() {
  initScrollAnimations();
  initSmoothScrolling();
  initScrollProgress();
  
  console.log('Scroll animations initialized');
}

// Auto-initialize if this script is loaded directly (not as module)
if (typeof window !== 'undefined' && !window.scrollAnimationsInitialized) {
  document.addEventListener('DOMContentLoaded', initAllScrollAnimations);
  window.scrollAnimationsInitialized = true;
}