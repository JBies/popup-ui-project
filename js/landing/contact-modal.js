/* ==========================================================================
   CONTACT MODAL
   ========================================================================== */

/**
 * Open contact modal
 * @param {string} mode - 'pro' for Pro upgrade, undefined for custom quote
 */
export function openContactModal(mode = '') {
  const modal = document.getElementById('contact-modal');
  const card = document.getElementById('contact-card');
  const msgField = document.getElementById('cf-message');
  
  if (!modal || !card || !msgField) {
    console.error('Contact modal elements not found');
    return;
  }

  // Pro mode: change title and prefill message
  if (mode === 'pro') {
    const h2 = card.querySelector('h2');
    const p = card.querySelector('h2 + p');
    
    if (h2) h2.textContent = 'Aloita Pro-tili — 4,90€/kk';
    if (p) p.textContent = 'Jätä yhteystietosi, niin lähetämme aktivointiohjeet sähköpostiin.';
    
    msgField.value = 'Hei!\n\nHaluaisin aktivoida Pro-tilin. Sivustoni on [sivustosi osoite] ja käytän palvelua [kerro lyhyesti mihin — esim. liidien keräämiseen / cookie consent -banneriin / myynninedistämiseen].\n\nOdotan aktivointiohjeitanne!';
  } else {
    msgField.value = 'Hei!\n\nOlen kiinnostunut räätälöidystä paketista. Meillä on [sivustojen määrä] sivustoa ja tarvitsisimme [kuvaile tarpeet lyhyesti — esim. useita tilejä / oman ulkoasun / CRM-integraation].\n\nVoidaanko sopia lyhyt palaveri?';
  }

  // Show form, hide success message
  document.getElementById('contact-form').style.display = '';
  document.getElementById('cf-success').style.display = 'none';
  
  // Show modal with animation
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
  requestAnimationFrame(() => {
    card.style.transform = 'scale(1) translateY(0)';
    card.style.opacity = '1';
  });
}

/**
 * Close contact modal
 */
export function closeContactModal() {
  const modal = document.getElementById('contact-modal');
  const card = document.getElementById('contact-card');
  
  if (!modal || !card) return;

  card.style.transform = 'scale(0.85) translateY(40px)';
  card.style.opacity = '0';
  
  setTimeout(() => {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }, 300);
}

/**
 * Submit contact form
 * @param {Event} e - Form submit event
 */
export async function submitContactForm(e) {
  e.preventDefault();
  
  // Honeypot check (spam protection)
  const honeypot = document.querySelector('#contact-form [name="website"]');
  if (honeypot && honeypot.value) return; // Bot filled hidden field
  
  // Get form values
  const name = document.getElementById('cf-name').value.trim();
  const email = document.getElementById('cf-email').value.trim();
  const company = document.getElementById('cf-company').value.trim();
  const message = document.getElementById('cf-message').value.trim();
  const errEl = document.getElementById('cf-error');
  const submit = document.getElementById('cf-submit');
  
  // Validation
  errEl.style.display = 'none';
  
  if (!name || !email || !message) {
    errEl.textContent = 'Täytä pakolliset kentät (nimi, sähköposti, viesti).';
    errEl.style.display = 'block';
    return;
  }
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errEl.textContent = 'Tarkista sähköpostiosoite.';
    errEl.style.display = 'block';
    return;
  }
  
  // Disable submit button and show loading state
  submit.disabled = true;
  submit.innerHTML = '<i class="fa fa-spinner fa-spin" style="margin-right:8px"></i>Lähetetään...';
  
  try {
    const response = await fetch('/api/user/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, company, message })
    });
    
    if (response.ok) {
      // Show success message
      document.getElementById('contact-form').style.display = 'none';
      document.getElementById('cf-success').style.display = 'block';
      
      // Close modal after delay
      setTimeout(closeContactModal, 3500);
    } else {
      throw new Error('Server responded with error');
    }
  } catch (error) {
    // Show error message
    errEl.textContent = 'Lähetys epäonnistui. Yritä uudelleen tai kirjoita suoraan: projektimanageri@gmail.com';
    errEl.style.display = 'block';
    
    // Re-enable submit button
    submit.disabled = false;
    submit.innerHTML = '<i class="fa fa-paper-plane" style="margin-right:8px"></i>Lähetä tarjouspyyntö';
  }
}

/**
 * Request Pro upgrade (handles both logged in and logged out users)
 */
export async function requestProUpgrade() {
  try {
    // Check if user is logged in
    const me = await fetch('/api/user')
      .then(r => r.ok ? r.json() : null)
      .catch(() => null);
    
    if (me && me._id) {
      // User is logged in, send upgrade request
      const response = await fetch('/api/user/upgrade-request', { 
        method: 'POST' 
      });
      const data = await response.json();
      
      if (response.ok || data.alreadySent) {
        // Show success in modal
        openContactModal('pro');
        return;
      }
    }
  } catch (error) {
    console.error('Error checking user status:', error);
  }
  
  // Not logged in or error → open same contact modal
  openContactModal('pro');
}

/**
 * Initialize contact modal event listeners
 */
export function initContactModal() {
  // Close modal on backdrop click
  const backdrop = document.getElementById('contact-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', closeContactModal);
  }
  
  // Close modal on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeContactModal();
  });
  
  // Close button
  const closeBtn = document.querySelector('#contact-card button[onclick*="closeContactModal"]');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeContactModal);
  }
  
  // Form submission
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', submitContactForm);
  }
  
  // Pro upgrade button
  const proUpgradeBtn = document.querySelector('button[onclick*="requestProUpgrade"]');
  if (proUpgradeBtn) {
    proUpgradeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      requestProUpgrade();
    });
  }
  
  // Custom quote button
  const customQuoteBtn = document.querySelector('button[onclick*="openContactModal"]');
  if (customQuoteBtn && !customQuoteBtn.onclick.toString().includes('pro')) {
    customQuoteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openContactModal();
    });
  }
  
  console.log('Contact modal initialized');
}

// Auto-initialize if this script is loaded directly
if (typeof window !== 'undefined' && !window.contactModalInitialized) {
  document.addEventListener('DOMContentLoaded', initContactModal);
  window.contactModalInitialized = true;
}