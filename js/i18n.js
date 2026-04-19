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

    // --- Beta banner ---
    'beta.badge':           'BETA',
    'beta.title':           'We are in Beta — prices are -50%!',
    'beta.sub':             'Take advantage of our launch offer. Full Pro features at half price — locked in for as long as you stay subscribed.',

    // --- Pricing ---
    'pricing.heading':      'Simple Pricing',
    'pricing.sub':          'One plan, two billing options. No hidden fees.',
    'pricing.6mo.label':    '6 months',
    'pricing.6mo.normal':   'Normally 40 € / 6 mo',
    'pricing.6mo.price':    '20 €',
    'pricing.6mo.period':   '/ 6 months',
    'pricing.6mo.monthly':  '= 3,33 € / mo',
    'pricing.12mo.label':   '12 months',
    'pricing.12mo.badge':   'BEST VALUE',
    'pricing.12mo.normal':  'Normally 60 € / year',
    'pricing.12mo.price':   '30 €',
    'pricing.12mo.period':  '/ year',
    'pricing.12mo.monthly': '= 2,50 € / mo',
    'pricing.includes':     'Both plans include:',
    'pricing.f1':           '20 elements per site',
    'pricing.f2':           'Full analytics & statistics',
    'pricing.f3':           'Targeting & A/B testing',
    'pricing.f4':           'Lead forms & cookie consent',
    'pricing.f5':           'Webhooks & campaigns',
    'pricing.f6':           'Priority support',
    'pricing.cta':          'Get Pro — Sign in with Google',
    'pricing.note':         '* Beta price is locked for existing subscribers. Price may change when we exit Beta.',

    // --- index.html nav ---
    'idx.nav.elements':   'Elements',
    'idx.nav.features':   'Features',
    'idx.nav.setup':      'Setup',
    'idx.nav.pricing':    'Pricing',
    'idx.nav.signin':     'Sign in with Google',
    'idx.nav.signinShort':'Sign in',

    // --- index.html hero ---
    'idx.hero.badge':     '7 element types · One line of code · No installation',
    'idx.hero.cta1':      'Get started with Google',
    'idx.hero.cta2':      'See features',
    'idx.hero.note':      'No credit card. No installation. Just one line of code.',
    'idx.hero.caption':   'Live preview in dashboard · Changes appear instantly',

    // --- index.html stats bar ---
    'idx.stats.types':    'Element types',
    'idx.stats.lines':    'Lines of code',
    'idx.stats.preview':  'Real-time preview',
    'idx.stats.email':    'Automatic emails',

    // --- index.html element types ---
    'idx.el.badge':       '7 element types',
    'idx.el.h2':          'All conversion tools in one place',
    'idx.el.sub':         'Choose a type, customise in the dashboard, preview in real time – activated with one line of code.',
    'idx.el.sticky.desc': 'Fixed notification bar that stays visible while scrolling. Ideal for campaigns, offers and GDPR banners.',
    'idx.el.fab.desc':    'Floating action button in the corner – chat, phone, CTA. Always visible, never disrupts content.',
    'idx.el.slidein.desc':'Animated box slides into view. Trigger on scroll, time or exit intent. Great for newsletter sign-ups and lead forms.',
    'idx.el.popup.desc':  'Pop-up window in the centre of the screen. Upload an image directly (fastest) or write a title, text and button – no coding.',
    'idx.el.leadform.desc':'Collect contact details directly — leads are saved to the dashboard and emailed to you automatically without any configuration. Customise fields, submit button and success message.',
    'idx.el.cookie.badge':'Free',
    'idx.el.cookie.desc': 'GDPR-compliant banner that actually blocks tracking before consent. Enter your GA4, GTM or Facebook Pixel ID — they activate automatically only after approval. No Cookiebot needed.',
    'idx.el.cookie.li1':  'Google Analytics 4 & Tag Manager',
    'idx.el.cookie.li2':  'Facebook Pixel',
    'idx.el.cookie.li3':  'Deny clears _ga, _fbp cookies',
    'idx.el.cookie.li4':  'GDPR & ePrivacy compliant',
    'idx.el.stats.title': 'Invisible data collector',
    'idx.el.stats.desc':  'Completely invisible measurement point — doesn\'t disturb visitors, doesn\'t change your site\'s appearance. Records visitor counts for a specific page or section. Perfect for funnel analytics.',
    'idx.el.stats.li1':   'Measure visitors on a specific page',
    'idx.el.stats.li2':   'Funnel: how many reach point X',
    'idx.el.stats.li3':   'Map the most popular sections',
    'idx.el.stats.li4':   'Collect data before activating an element',
    'idx.el.cta.title':   'Plus much more',
    'idx.el.cta.f1':      'Email notifications',
    'idx.el.cta.f2':      'Multi-site support',
    'idx.el.cta.f3':      'Cloud image library',
    'idx.el.cta.f4':      'Live preview in editor',
    'idx.el.cta.f5':      'CSV export for leads',
    'idx.el.cta.btn':     'Get started now →',

    // --- index.html power features ---
    'idx.feat.badge':     'Smart features',
    'idx.feat.h2':        'Smart features that make the difference',
    'idx.feat.sub':       'More than just popups – a complete conversion and analytics platform.',
    'idx.feat.easy.title':'As easy as uploading an image',
    'idx.feat.easy.desc': 'Create a popup in seconds: design in Canva → upload to dashboard → set link → done. No coding, no settings.',
    'idx.feat.easy.f1':   'Drag & drop image upload',
    'idx.feat.easy.f2':   'Live preview in editor',
    'idx.feat.easy.f3':   'Scheduling with one button',
    'idx.feat.easy.f4':   'Reorder elements by dragging',
    'idx.feat.code.title':'One line of code – forever',
    'idx.feat.code.desc': 'Add the script to your site\'s head section once. All your elements then activate automatically – no more code changes needed.',
    'idx.feat.email.title':'Email notifications',
    'idx.feat.email.desc':'Get instant notification of a new lead by email. Weekly report every Monday – impressions, clicks, leads and comparison to the previous week. No integration needed.',
    'idx.feat.email.lead.title':'Lead notification',
    'idx.feat.email.lead.desc':'Instant email for every new contact',
    'idx.feat.email.weekly.title':'Weekly report',
    'idx.feat.email.weekly.desc':'Mondays: stats + top 3 elements',
    'idx.feat.analytics.title':'Statistics & Analytics',
    'idx.feat.analytics.desc':'Impressions, clicks and leads per element. Conversion rate calculated automatically. Track what works best.',
    'idx.feat.analytics.views':'Views',
    'idx.feat.analytics.clicks':'Clicks',
    'idx.feat.leads.title':'Leads & CRM export',
    'idx.feat.leads.desc':'All Lead Form submissions are saved automatically. View, filter, download CSV. Reply to a lead directly from email with one click.',
    'idx.feat.leads.f1':  'Automatic save to database',
    'idx.feat.leads.f2':  'Filter by element or date',
    'idx.feat.leads.f3':  'Download CSV with one click',
    'idx.feat.leads.f4':  'Email notification for new leads',
    'idx.feat.images.title':'Image library',
    'idx.feat.images.desc':'Upload and manage images in the cloud. Use images directly in the popup editor. Automatic compression, secure links.',
    'idx.feat.multi.title':'Multi-site support',
    'idx.feat.multi.desc':'Manage multiple websites from one dashboard. Each site gets its own installation code and elements.',
    'idx.feat.multi.add': 'Add site...',
    'idx.feat.live.title':'Live preview',
    'idx.feat.live.desc': 'See changes in real time in the editor. Desktop and mobile preview side by side. No need to publish to test.',

    // --- index.html how it works ---
    'idx.how.badge':      'Setup',
    'idx.how.h2':         'Three steps to get started',
    'idx.how.sub':        'Your first element is live in under 5 minutes',
    'idx.how.s1.title':   'Sign in',
    'idx.how.s1.desc':    'A Google account is enough. No forms, no email verification, no credit card. Account is ready in seconds.',
    'idx.how.s2.title':   'Create an element in the dashboard',
    'idx.how.s2.desc':    'Choose a type, customise text, colours and settings in the visual editor. Preview in real time – desktop and mobile side by side.',
    'idx.how.s2.badge':   'Live preview',
    'idx.how.s3.title':   'Paste one code snippet on your page',
    'idx.how.s3.badge':   'All elements in one line',
    'idx.how.caption':    'Sticky bar + popup + lead form + floating button – all with one line',

    // --- index.html pricing ---
    'idx.price.badge':    'Pricing',
    'idx.price.h2':       'Start free, scale as you grow',
    'idx.price.sub':      'No commitment. No credit card. Start immediately.',
    'idx.price.free.name':'Free',
    'idx.price.free.mo':  '/mo',
    'idx.price.free.sub': 'Perfect for trying out and using a single element.',
    'idx.price.free.f1':  '1 element at a time',
    'idx.price.free.f2':  'All element types',
    'idx.price.free.f3':  'Cookie consent banner',
    'idx.price.free.f4':  '5 image uploads',
    'idx.price.free.no1': 'Analytics',
    'idx.price.free.no2': 'Targeting rules',
    'idx.price.free.no3': 'Lead forms',
    'idx.price.free.btn': 'Start for free',
    'idx.price.pro.name': 'Pro',
    'idx.price.pro.badge':'Most popular',
    'idx.price.pro.mo':   '/mo',
    'idx.price.pro.sub':  'Everything you need for a growing business.',
    'idx.price.pro.f1':   '20 elements',
    'idx.price.pro.f2':   'All element types',
    'idx.price.pro.f3':   '100 image uploads',
    'idx.price.pro.f4':   'Analytics & statistics',
    'idx.price.pro.f5':   'Targeting rules',
    'idx.price.pro.f6':   'Lead forms',
    'idx.price.pro.f7':   'Email notifications',
    'idx.price.pro.btn':  'Get Pro →',
    'idx.price.custom.name':'Custom',
    'idx.price.custom.sub':'Multiple sites, unlimited elements, custom integrations.',
    'idx.price.custom.f1':'Unlimited elements',
    'idx.price.custom.f2':'Multiple sites',
    'idx.price.custom.f3':'All Pro features',
    'idx.price.custom.f4':'Priority support',
    'idx.price.custom.f5':'Custom integrations',
    'idx.price.custom.btn':'Contact us',

    // --- index.html email highlight ---
    'idx.email.badge':    'Email notifications',
    'idx.email.h2a':      'Leads straight to your email',
    'idx.email.h2b':      '– automatically',
    'idx.email.sub':      'No integrations, no IFTTT, no Zapier – works directly without extra effort.',

    // --- index.html final CTA ---
    'idx.cta.h2':         'Ready to grow your website?',
    'idx.cta.sub':        'Join and start turning visitors into customers today.',
    'idx.cta.btn':        'Get started with Google – free',
    'idx.cta.note':       'No credit card · No installation · Cancel any time',

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

    // --- Beta banner ---
    'beta.badge':           'BETA',
    'beta.title':           'Olemme Beta-vaiheessa — hinnat -50%!',
    'beta.sub':             'Hyödynnä lanseeraustarjous. Täydet Pro-ominaisuudet puoleen hintaan — hinta lukittuu, kun tilaat.',

    // --- Pricing ---
    'pricing.heading':      'Selkeä hinnoittelu',
    'pricing.sub':          'Yksi paketti, kaksi laskutusväliä. Ei piilomaksuja.',
    'pricing.6mo.label':    '6 kuukautta',
    'pricing.6mo.normal':   'Normaalisti 40 € / 6 kk',
    'pricing.6mo.price':    '20 €',
    'pricing.6mo.period':   '/ 6 kuukautta',
    'pricing.6mo.monthly':  '= 3,33 € / kk',
    'pricing.12mo.label':   '12 kuukautta',
    'pricing.12mo.badge':   'PARAS ARVO',
    'pricing.12mo.normal':  'Normaalisti 60 € / vuosi',
    'pricing.12mo.price':   '30 €',
    'pricing.12mo.period':  '/ vuosi',
    'pricing.12mo.monthly': '= 2,50 € / kk',
    'pricing.includes':     'Molemmat paketit sisältävät:',
    'pricing.f1':           '20 elementtiä per sivusto',
    'pricing.f2':           'Täydet analytiikka ja tilastot',
    'pricing.f3':           'Kohdentaminen & A/B-testaus',
    'pricing.f4':           'Liidilomakkeet & evästeilmoitus',
    'pricing.f5':           'Webhookit & kampanjat',
    'pricing.f6':           'Prioriteettituki',
    'pricing.cta':          'Hanki Pro — Kirjaudu Googlella',
    'pricing.note':         '* Beta-hinta lukitaan nykyisille tilaajille. Hinta voi muuttua Beta-vaiheen jälkeen.',

    // --- index.html nav ---
    'idx.nav.elements':   'Elementit',
    'idx.nav.features':   'Ominaisuudet',
    'idx.nav.setup':      'Käyttöönotto',
    'idx.nav.pricing':    'Hinnoittelu',
    'idx.nav.signin':     'Kirjaudu Google-tilillä',
    'idx.nav.signinShort':'Kirjaudu',

    // --- index.html hero ---
    'idx.hero.badge':     '7 elementtityyppiä · Yksi koodirivi · Ei asennusta',
    'idx.hero.cta1':      'Aloita Google-tilillä',
    'idx.hero.cta2':      'Katso ominaisuudet',
    'idx.hero.note':      'Ei luottokorttia. Ei asennusta. Vain yksi koodirivi.',
    'idx.hero.caption':   'Live-esikatselu dashboardissa · Muutokset näkyvät välittömästi',

    // --- index.html stats bar ---
    'idx.stats.types':    'Elementtityyppiä',
    'idx.stats.lines':    'Rivi koodia',
    'idx.stats.preview':  'Reaaliaikainen esikatselu',
    'idx.stats.email':    'Automaattiset sähköpostit',

    // --- index.html element types ---
    'idx.el.badge':       '7 elementtityyppiä',
    'idx.el.h2':          'Kaikki konversiotyökalut yhdessä paikassa',
    'idx.el.sub':         'Valitse tyyppi, mukauta dashboardissa, esikatsele reaaliajassa – aktivoituu yhdellä koodirivillä.',
    'idx.el.sticky.desc': 'Kiinteä ilmoituspalkki joka pysyy näkyvissä scrollatessa. Ihanteellinen kampanjoille, tarjouksille ja GDPR-bannereille.',
    'idx.el.fab.desc':    'Kelluva toimintanappi sivun kulmassa – chat, puhelin, CTA. Näkyy aina kaikkialla, ei häiritse sisältöä.',
    'idx.el.slidein.desc':'Animoitu boksi liukuu esiin. Triggeröi scroll, aika tai exit intent. Sopii uutiskirjetilauksiin ja liidilomakkeisiin.',
    'idx.el.popup.desc':  'Ponnahdusikkuna näytön keskellä. Lataa kuva suoraan (nopein tapa) tai kirjoita otsikko, teksti ja nappi – ei koodausta.',
    'idx.el.leadform.desc':'Kerää yhteystietoja suoraan — liidit tallentuvat dashboardiin ja tulevat sähköpostiisi automaattisesti ilman mitään konfigurointia. Mukauta kentät, lähetysnappi ja onnistumisviesti.',
    'idx.el.cookie.badge':'Ilmainen',
    'idx.el.cookie.desc': 'GDPR-yhteensopiva banneri joka oikeasti estää seurannan ennen suostumusta. Syötä GA4-, GTM- tai Facebook Pixel -tunnuksesi — ne aktivoituvat automaattisesti vasta hyväksynnän jälkeen. Ei Cookiebotia tarvita.',
    'idx.el.cookie.li1':  'Google Analytics 4 & Tag Manager',
    'idx.el.cookie.li2':  'Facebook Pixel',
    'idx.el.cookie.li3':  'Deny pyyhkii _ga, _fbp -evästeet',
    'idx.el.cookie.li4':  'GDPR & ePrivacy -yhteensopiva',
    'idx.el.stats.title': 'Näkymätön datankerääjä',
    'idx.el.stats.desc':  'Täysin näkymätön mittauspiste — ei häiritse kävijää, ei muuta sivustosi ulkoasua. Rekisteröi kävijämäärät tietylle sivulle tai sivuston osaan. Täydellinen funnel-analytiikkaan.',
    'idx.el.stats.li1':   'Mittaa kävijöitä tietyllä sivulla',
    'idx.el.stats.li2':   'Funnel: kuinka moni saavuttaa kohdan X',
    'idx.el.stats.li3':   'Suosituimpien osioiden kartoitus',
    'idx.el.stats.li4':   'Datan keruu ennen muun elementin aktivointia',
    'idx.el.cta.title':   'Plus paljon muuta',
    'idx.el.cta.f1':      'Sähköposti-ilmoitukset',
    'idx.el.cta.f2':      'Multi-sivusto tuki',
    'idx.el.cta.f3':      'Kuvakirjasto pilvessä',
    'idx.el.cta.f4':      'Live-esikatselu editorissa',
    'idx.el.cta.f5':      'CSV-vienti liideille',
    'idx.el.cta.btn':     'Aloita nyt →',

    // --- index.html power features ---
    'idx.feat.badge':     'Älykkäät ominaisuudet',
    'idx.feat.h2':        'Älykkäät ominaisuudet jotka tekevät eron',
    'idx.feat.sub':       'Enemmän kuin pelkkiä popuppeja – täydellinen konversio- ja analytiikka-alusta.',
    'idx.feat.easy.title':'Helppo kuin kuvan lataus',
    'idx.feat.easy.desc': 'Luo popup muutamassa sekunnissa: suunnittele kuva Canvassa → lataa dashboardiin → aseta linkki → valmis. Ei koodausta, ei asetuksia.',
    'idx.feat.easy.f1':   'Drag & drop kuvan lataus',
    'idx.feat.easy.f2':   'Live-esikatselu heti editorissa',
    'idx.feat.easy.f3':   'Ajastus yhdellä napin painalluksella',
    'idx.feat.easy.f4':   'Järjestä elementtejä vetämällä',
    'idx.feat.code.title':'Yksi koodirivi – ikuisesti',
    'idx.feat.code.desc': 'Lisää skripti sivustosi head-osioon kerran. Sen jälkeen kaikki elementtisi aktivoituvat automaattisesti – ei enää koodimuutoksia tarvita.',
    'idx.feat.email.title':'Sähköposti-ilmoitukset',
    'idx.feat.email.desc':'Saat heti tiedon uudesta liidistä sähköpostiin. Viikkoraportti joka maanantai – näyttökerrat, klikkaukset, liidit ja vertailu edelliseen viikkoon. Ei integraatiota tarvita.',
    'idx.feat.email.lead.title':'Liidi-ilmoitus',
    'idx.feat.email.lead.desc':'Välitön sähköposti uudesta yhteystiedosta',
    'idx.feat.email.weekly.title':'Viikkoraportti',
    'idx.feat.email.weekly.desc':'Maanantaisin: tilastot + top 3 elementtiä',
    'idx.feat.analytics.title':'Tilastot & Analytiikka',
    'idx.feat.analytics.desc':'Näyttökerrat, klikkaukset ja liidit per elementti. Konversioaste automaattisesti laskettuna. Seuraa mikä toimii parhaiten.',
    'idx.feat.analytics.views':'Näyttöä',
    'idx.feat.analytics.clicks':'Klikkausta',
    'idx.feat.leads.title':'Liidit & CRM-vienti',
    'idx.feat.leads.desc':'Kaikki Lead Form -lähetykset tallentuvat automaattisesti. Näytä, suodata, lataa CSV. Vastaa liidiin suoraan sähköpostista yhdellä klikkauksella.',
    'idx.feat.leads.f1':  'Automaattinen tallennus tietokantaan',
    'idx.feat.leads.f2':  'Suodata elementin tai päivämäärän mukaan',
    'idx.feat.leads.f3':  'Lataa CSV yhdellä napin painalluksella',
    'idx.feat.leads.f4':  'Sähköposti-ilmoitus uudesta liidistä',
    'idx.feat.images.title':'Kuvakirjasto',
    'idx.feat.images.desc':'Lataa ja hallinnoi kuvia pilvessä. Käytä kuvia suoraan popup-editorissa. Automaattinen pakkaus, turvalliset linkit.',
    'idx.feat.multi.title':'Multi-sivusto tuki',
    'idx.feat.multi.desc':'Hallinnoi useita verkkosivustoja yhdestä dashboardista. Kullekin sivustolle oma asennuskoodi ja omat elementit.',
    'idx.feat.multi.add': 'Lisää sivusto...',
    'idx.feat.live.title':'Live-esikatselu',
    'idx.feat.live.desc': 'Näet muutokset reaaliajassa editorissa. Desktop- ja mobiiliesikatselu rinnakkain. Ei tarvitse julkaista testataksesi.',

    // --- index.html how it works ---
    'idx.how.badge':      'Käyttöönotto',
    'idx.how.h2':         'Kolme askelta käyttöönottoon',
    'idx.how.sub':        'Ensimmäinen elementti on käytössä alle 5 minuutissa',
    'idx.how.s1.title':   'Kirjaudu sisään',
    'idx.how.s1.desc':    'Google-tili riittää. Ei lomakkeita, ei sähköpostivahvistuksia, ei luottokorttia. Tili on valmis sekunneissa.',
    'idx.how.s2.title':   'Luo elementti dashboardissa',
    'idx.how.s2.desc':    'Valitse tyyppi, mukauta teksti, värit ja asetukset visuaalisessa editorissa. Esikatsele reaaliajassa – desktop ja mobiili rinnakkain.',
    'idx.how.s2.badge':   'Live-esikatselu',
    'idx.how.s3.title':   'Liitä yksi koodi sivulle',
    'idx.how.s3.badge':   'Kaikki elementit yhdellä rivillä',
    'idx.how.caption':    'Sticky bar + popup + lead form + floating button – kaikki yhdellä rivillä',

    // --- index.html pricing ---
    'idx.price.badge':    'Hinnoittelu',
    'idx.price.h2':       'Aloita ilmaiseksi, skaalaa tarpeen mukaan',
    'idx.price.sub':      'Ei sitoutumista. Ei luottokorttia. Aloita heti.',
    'idx.price.free.name':'Ilmainen',
    'idx.price.free.mo':  '/kk',
    'idx.price.free.sub': 'Täydellinen kokeiluun ja yksittäisen elementin käyttöön.',
    'idx.price.free.f1':  '1 elementti kerrallaan',
    'idx.price.free.f2':  'Kaikki elementtityypit',
    'idx.price.free.f3':  'Cookie consent -banneri',
    'idx.price.free.f4':  '5 kuvalatauksta',
    'idx.price.free.no1': 'Analytiikka',
    'idx.price.free.no2': 'Targeting-säännöt',
    'idx.price.free.no3': 'Lead-lomakkeet',
    'idx.price.free.btn': 'Aloita ilmaiseksi',
    'idx.price.pro.name': 'Pro',
    'idx.price.pro.badge':'Suosituin',
    'idx.price.pro.mo':   '/kk',
    'idx.price.pro.sub':  'Kaikki mitä tarvitset kasvavaan liiketoimintaan.',
    'idx.price.pro.f1':   '20 elementtiä',
    'idx.price.pro.f2':   'Kaikki elementtityypit',
    'idx.price.pro.f3':   '100 kuvalatauksta',
    'idx.price.pro.f4':   'Analytiikka & tilastot',
    'idx.price.pro.f5':   'Targeting-säännöt',
    'idx.price.pro.f6':   'Lead-lomakkeet',
    'idx.price.pro.f7':   'Sähköposti-ilmoitukset',
    'idx.price.pro.btn':  'Tilaa Pro →',
    'idx.price.custom.name':'Räätälöity',
    'idx.price.custom.sub':'Useita sivustoja, rajattomasti elementtejä, omat integraatiot.',
    'idx.price.custom.f1':'Rajaton elementtimäärä',
    'idx.price.custom.f2':'Useita sivustoja',
    'idx.price.custom.f3':'Kaikki Pro-ominaisuudet',
    'idx.price.custom.f4':'Prioriteettituki',
    'idx.price.custom.f5':'Räätälöidyt integraatiot',
    'idx.price.custom.btn':'Ota yhteyttä',

    // --- index.html email highlight ---
    'idx.email.badge':    'Sähköposti-ilmoitukset',
    'idx.email.h2a':      'Liidit suoraan sähköpostiisi',
    'idx.email.h2b':      '– automaattisesti',
    'idx.email.sub':      'Ei integraatioita, ei IFTTT, ei Zapier – toimii suoraan ilman lisätyötä.',

    // --- index.html final CTA ---
    'idx.cta.h2':         'Valmiina kasvattamaan verkkosivustoasi?',
    'idx.cta.sub':        'Liity mukaan ja aloita kävijöiden muuttaminen asiakkaiksi jo tänään.',
    'idx.cta.btn':        'Aloita Google-tilillä – ilmaiseksi',
    'idx.cta.note':       'Ei luottokorttia · Ei asennusta · Peruuta milloin vain',

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
