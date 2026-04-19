// js/i18n.js — language switching module (EN default, FI toggle)

const translations = {
  en: {
    // --- Landing page ---
    'nav.signin':           'Sign in with Google',
    'nav.dashboard':        'Dashboard',
    'nav.signout':          'Sign out',
    'hero.title':           'Boost Your Website with',
    'hero.subtitle':        'Easy tool for managing popups. Track, test and optimise your website conversions.',
    'hero.cta':             'Get Started!',
    'hero.learn':           'Learn More',
    'features.heading':     'Why Choose Popup Manager?',
    'feature1.title':       'Analytics',
    'feature1.desc':        'Track popup performance in real time. See which popups work best.',
    'feature2.title':       'Easy Editing',
    'feature2.desc':        'Create and edit popups without coding skills. Intuitive interface.',
    'feature3.title':       'Timing Control',
    'feature3.desc':        'Set popups to appear at exactly the right moment. Define display time and frequency.',
    'feature4.title':       'Mobile Compatible',
    'feature4.desc':        'Popups work seamlessly on all devices and browsers.',
    'feature5.title':       'Easy Integration',
    'feature5.desc':        'Add popups to your site with a single script tag. No complex setup.',
    'feature6.title':       'Customisable Design',
    'feature6.desc':        "Match popups to your site's look. Full control over colours, sizes and animations.",
    'cta.heading':          'Ready to boost your website?',
    'cta.sub':              'Start using popups today and see the difference in your conversion rate.',
    'cta.btn':              'Sign in with Google',
    'footer.copy':          '© 2025 All rights reserved',

    // --- Dashboard sidebar ---
    'nav.section.elements': 'Elements',
    'nav.myElements':       'My Elements',
    'nav.section.mgmt':     'Management',
    'nav.reports':          'Reports',
    'nav.analytics':        'Statistics',
    'nav.leads':            'Leads',
    'nav.sites':            'Sites & Code',
    'nav.help':             'Help',
    'nav.admin':            'Admin Panel',
    'sidebar.loading':      'Loading...',

    // --- Dashboard topbar view titles ---
    'view.elements':        'My Elements',
    'view.reports':         'Reports',
    'view.analytics':       'Statistics',
    'view.settings':        'Install Code',
    'view.help':            'Help',
    'view.leads':           'Leads',

    // --- Dashboard topbar buttons ---
    'btn.createNew':        'Create new',
    'btn.addSite':          '+ Site',

    // --- Type picker modal ---
    'typepicker.heading':   'Select element type',
    'type.sticky_bar.desc': 'Fixed bar at the top or bottom of the page',
    'type.popup.desc':      'Pop-up window in the centre of the screen',
    'type.slide_in.desc':   'Element sliding in from the side',
    'type.fab.desc':        'Floating button in the corner of the page',
    'type.lead_form.desc':  'Collect contact details with a form',
    'type.cookie.desc':     'GDPR cookie notice — Accept / Reject',
    'type.stats.desc':      'Invisible visitor tracking',

    // --- Admin Users page ---
    'admin.title':          'Admin Panel',
    'admin.back':           'Dashboard',
    'admin.tab.users':      'Users',
    'admin.tab.audit':      'Audit Log',
    'admin.totalUsers':     'Total Users',
    'admin.pending':        'Pending Approval',
    'admin.active':         'Active Users',
    'admin.totalElements':  'Total Elements',
    'filter.all':           'All',
    'filter.pending':       '⏳ Pending',
    'filter.users':         'Users',
    'filter.admin':         'Admin',
    'search.placeholder':   'Search by name or email…',
    'btn.refresh':          'Refresh',
    'audit.search':         'Search by email…',
    'audit.allEvents':      'All events',
    'audit.logins':         'Logins',
    'audit.approvals':      'Approvals',
    'audit.roleChanges':    'Role changes',
    'audit.deletions':      'Deleted users',
    'audit.limitChanges':   'Limit changes',
    'audit.col.time':       'Time',
    'audit.col.event':      'Event',
    'audit.col.actor':      'Actor',
    'audit.col.target':     'Target',
    'audit.col.details':    'Details',
    'audit.col.ip':         'IP',
    'audit.prev':           '← Previous',
    'audit.next':           'Next →',

    // --- Pending page ---
    'pending.title':        'Your account is pending approval',
    'pending.message':      'Thank you for registering! Your account has been created and is awaiting administrator approval. You will gain access to the application\'s features once your account has been approved.',
    'pending.contact':      'Questions? Contact the administrator:',
    'pending.signout':      'Sign out',

    // --- Role label ---
    'role.user':            'User',
  },

  fi: {
    // --- Landing page ---
    'nav.signin':           'Kirjaudu Googlella',
    'nav.dashboard':        'Hallintapaneeli',
    'nav.signout':          'Kirjaudu ulos',
    'hero.title':           'Tehosta Verkkosivusi',
    'hero.subtitle':        'Helppo työkalu popupien hallintaan. Seuraa, testaa ja optimoi verkkosivusi konversiota.',
    'hero.cta':             'Aloita tästä!',
    'hero.learn':           'Lue lisää',
    'features.heading':     'Miksi valita Popup Manager?',
    'feature1.title':       'Tilastot ja analytiikka',
    'feature1.desc':        'Seuraa popupien suorituskykyä reaaliajassa. Näe mitkä popupit toimivat parhaiten.',
    'feature2.title':       'Helppo muokkaus',
    'feature2.desc':        'Luo ja muokkaa popupeja ilman koodausosaamista. Intuitiivinen käyttöliittymä.',
    'feature3.title':       'Ajoituksen hallinta',
    'feature3.desc':        'Aseta popupit näkymään juuri oikeaan aikaan. Määritä näyttöaika ja -taajuus.',
    'feature4.title':       'Mobiiliyhteensopiva',
    'feature4.desc':        'Popupit toimivat saumattomasti kaikilla laitteilla ja selaimilla.',
    'feature5.title':       'Helppo integrointi',
    'feature5.desc':        'Lisää popup sivustolle yhdellä script-tagilla. Ei monimutkaisia asennuksia.',
    'feature6.title':       'Mukautettava ulkoasu',
    'feature6.desc':        'Sovita popupit sivustosi ilmeeseen. Täysi kontrolli väreihin, kokoihin ja animaatioihin.',
    'cta.heading':          'Valmiina tehostamaan verkkosivujasi?',
    'cta.sub':              'Aloita popupien käyttö jo tänään ja näe ero konversioprosentissasi.',
    'cta.btn':              'Kirjaudu Googlella',
    'footer.copy':          '© 2025 Kaikki oikeudet pidätetään',

    // --- Dashboard sidebar ---
    'nav.section.elements': 'Elementit',
    'nav.myElements':       'Omat elementit',
    'nav.section.mgmt':     'Hallinta',
    'nav.reports':          'Raportit',
    'nav.analytics':        'Tilastot',
    'nav.leads':            'Liidit',
    'nav.sites':            'Sivustot & Koodi',
    'nav.help':             'Ohjeet',
    'nav.admin':            'Admin-paneeli',
    'sidebar.loading':      'Ladataan...',

    // --- Dashboard topbar view titles ---
    'view.elements':        'Omat elementit',
    'view.reports':         'Raportit',
    'view.analytics':       'Tilastot',
    'view.settings':        'Asennuskoodi',
    'view.help':            'Ohjeet',
    'view.leads':           'Liidit',

    // --- Dashboard topbar buttons ---
    'btn.createNew':        'Luo uusi',
    'btn.addSite':          '+ Sivusto',

    // --- Type picker modal ---
    'typepicker.heading':   'Valitse elementtityyppi',
    'type.sticky_bar.desc': 'Kiinteä palkki sivun ylä- tai alareunassa',
    'type.popup.desc':      'Ponnahdusikkuna näytön keskellä',
    'type.slide_in.desc':   'Sivusta liukuva elementti',
    'type.fab.desc':        'Leijuva painike sivun kulmassa',
    'type.lead_form.desc':  'Kerää yhteystietoja lomakkeella',
    'type.cookie.desc':     'GDPR evästeilmoitus — Hyväksy / Hylkää',
    'type.stats.desc':      'Näkymätön kävijäseuranta',

    // --- Admin Users page ---
    'admin.title':          'Admin-paneeli',
    'admin.back':           'Dashboard',
    'admin.tab.users':      'Käyttäjät',
    'admin.tab.audit':      'Audit-loki',
    'admin.totalUsers':     'Käyttäjät yhteensä',
    'admin.pending':        'Odottaa hyväksyntää',
    'admin.active':         'Aktiivisia käyttäjiä',
    'admin.totalElements':  'Elementtejä yhteensä',
    'filter.all':           'Kaikki',
    'filter.pending':       '⏳ Odottaa',
    'filter.users':         'Käyttäjät',
    'filter.admin':         'Admin',
    'search.placeholder':   'Hae nimellä tai sähköpostilla…',
    'btn.refresh':          'Päivitä',
    'audit.search':         'Hae sähköpostilla…',
    'audit.allEvents':      'Kaikki tapahtumat',
    'audit.logins':         'Kirjautumiset',
    'audit.approvals':      'Hyväksynnät',
    'audit.roleChanges':    'Roolin muutokset',
    'audit.deletions':      'Poistetut käyttäjät',
    'audit.limitChanges':   'Rajoitusten muutokset',
    'audit.col.time':       'Aika',
    'audit.col.event':      'Tapahtuma',
    'audit.col.actor':      'Tekijä',
    'audit.col.target':     'Kohde',
    'audit.col.details':    'Lisätiedot',
    'audit.col.ip':         'IP',
    'audit.prev':           '← Edellinen',
    'audit.next':           'Seuraava →',

    // --- Pending page ---
    'pending.title':        'Käyttäjätilisi odottaa hyväksyntää',
    'pending.message':      'Kiitos rekisteröitymisestäsi! Käyttäjätilisi on nyt luotu ja odottaa järjestelmänvalvojan hyväksyntää. Saat pääsyn sovelluksen ominaisuuksiin, kun tilisi on hyväksytty.',
    'pending.contact':      'Kysyttävää? Ota yhteyttä järjestelmänvalvojaan:',
    'pending.signout':      'Kirjaudu ulos',

    // --- Role label ---
    'role.user':            'Käyttäjä',
  }
};

export function t(key) {
  const lang = getCurrentLanguage();
  return (translations[lang] && translations[lang][key]) || (translations.en[key]) || key;
}

export function getCurrentLanguage() {
  return localStorage.getItem('language') || 'en';
}

export function toggleLanguage() {
  const next = getCurrentLanguage() === 'en' ? 'fi' : 'en';
  localStorage.setItem('language', next);
  applyTranslations();
  updateLangButton();
  window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang: next } }));
}

export function initLanguage() {
  applyTranslations();
  updateLangButton();
}

function applyTranslations() {
  const lang = getCurrentLanguage();
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const val = (translations[lang] && translations[lang][key]) || translations.en[key];
    if (val !== undefined) el.textContent = val;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    const val = (translations[lang] && translations[lang][key]) || translations.en[key];
    if (val !== undefined) el.placeholder = val;
  });
}

function updateLangButton() {
  document.querySelectorAll('.lang-toggle').forEach(btn => {
    const lang = getCurrentLanguage();
    btn.textContent = lang === 'en' ? 'FI' : 'EN';
    btn.setAttribute('aria-label', lang === 'en' ? 'Switch to Finnish' : 'Switch to English');
  });
}

// Auto-init for non-module pages
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initLanguage();
    document.querySelectorAll('.lang-toggle').forEach(btn => {
      btn.addEventListener('click', toggleLanguage);
    });
  });
}
