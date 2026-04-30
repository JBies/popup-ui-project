// js/dashboard/help-panel.js
import { getCurrentLanguage } from '../i18n.js';

export function initHelpPanel() {
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#help') renderHelp();
  });
  window.addEventListener('languagechange', () => {
    if (window.location.hash === '#help') renderHelp();
  });
  if (window.location.hash === '#help') renderHelp();
}

export function renderHelp() {
  const container = document.getElementById('help-content');
  if (!container) return;
  if (getCurrentLanguage() === 'fi') {
    renderHelpFI(container);
  } else {
    renderHelpEN(container);
  }
}

// ─── English help content ─────────────────────────────────────────────────────

function renderHelpEN(container) {
  const isAdmin = window.__currentUser__?.role === 'admin';

  container.innerHTML = `
    <div style="max-width:820px;font-family:system-ui,sans-serif">

      <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);border-radius:14px;padding:28px;color:#fff;margin-bottom:24px">
        <div style="font-size:22px;font-weight:800;margin-bottom:8px">UI Manager – User Guide</div>
        <div style="opacity:.85;font-size:14px;line-height:1.6">Create conversion elements for your website without coding.
        Add one script line to your site and activate elements from this dashboard.</div>
        <div style="margin-top:16px;background:rgba(0,0,0,.25);border-radius:8px;padding:12px 16px;font-family:monospace;font-size:12px">
          &lt;script src="https://popupmanager.net/ui-embed.js" data-site="YOUR_SITE_TOKEN"&gt;&lt;/script&gt;
        </div>
        <div style="margin-top:8px;font-size:12px;opacity:.75">One line in your site's &lt;head&gt; – all elements load automatically.</div>
      </div>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px 24px;margin-bottom:24px">
        <div style="font-size:14px;font-weight:800;color:#166534;margin-bottom:12px">🚀 Quick guide – 3 steps to get started</div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div style="display:flex;align-items:flex-start;gap:12px">
            <div style="width:24px;height:24px;border-radius:50%;background:#16a34a;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">1</div>
            <div style="font-size:13px;color:#166534"><strong>Add install code</strong> – Go to the Install Code tab and copy the one-line script. Add it to your site's &lt;head&gt; section. Done once – works for all elements.</div>
          </div>
          <div style="display:flex;align-items:flex-start;gap:12px">
            <div style="width:24px;height:24px;border-radius:50%;background:#16a34a;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">2</div>
            <div style="font-size:13px;color:#166534"><strong>Create an element</strong> – Click "+ Create new" → choose a type → fill in text, colours and settings → save.</div>
          </div>
          <div style="display:flex;align-items:flex-start;gap:12px">
            <div style="width:24px;height:24px;border-radius:50%;background:#16a34a;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">3</div>
            <div style="font-size:13px;color:#166534"><strong>Activate</strong> – Toggle the element card on. The element appears on your site immediately – no code changes needed.</div>
          </div>
        </div>
        <div style="margin-top:16px;display:flex;flex-direction:column;gap:8px;border-top:1px solid #bbf7d0;padding-top:14px">
          <div style="font-size:12px;font-weight:700;color:#166534;margin-bottom:2px">💡 Good to know</div>
          <div style="display:flex;align-items:flex-start;gap:8px;font-size:12px;color:#166534">
            <span style="flex-shrink:0">🎯</span>
            <span><strong>Targeting</strong> – Restrict where an element appears: open <strong>Edit</strong> → Targeting → add a rule. Multiple pages: use <strong>OR</strong> mode. Homepage: "is exactly" → <code style="background:#dcfce7;padding:1px 4px;border-radius:3px">/</code>. See Targeting section below.</span>
          </div>
          <div style="display:flex;align-items:flex-start;gap:8px;font-size:12px;color:#166534">
            <span style="flex-shrink:0">📊</span>
            <span><strong>Reports</strong> – View detailed stats for any time range in the Reports tab. Filter by site or element and send the report by email.</span>
          </div>
          <div style="display:flex;align-items:flex-start;gap:8px;font-size:12px;color:#166534">
            <span style="flex-shrink:0">🔄</span>
            <span><strong>Toggle = live</strong> – Green toggle on the element card means the element is live. Grey = hidden. Changes take effect immediately without touching your site's code.</span>
          </div>
        </div>
      </div>

      ${section('fa-layer-group','Element types','What you can build', [
        card('fa-minus','#1d4ed8','Sticky Bar',
          'Fixed bar at the top or bottom of the page. Stays visible while the user scrolls. Ideal for campaigns, offers and important announcements.',
          ['Campaign code or promotion','Cookie/GDPR notice','Early registration CTA','Important announcement for all visitors'],
          ['Text – write your own message','Up to 3 action buttons (text + URL)','Position – top or bottom','Background and text colour freely customisable']),

        card('fa-circle','#6d28d9','Floating Button',
          'Round floating button in a corner of the page. Suitable for chat, phone or CTA actions. Always visible everywhere without disrupting content.',
          ['Open live chat','Call request or WhatsApp','Book a time button','Back to top'],
          ['Icon – choose from visual grid','Action – open link or pop-up window','Position – all four corners','Colour and size adjustable']),

        card('fa-comment-dots','#16a34a','Slide-in',
          'Animated box that slides in from a corner. Set when it appears: immediately, after a delay, or on scroll.',
          ['Newsletter subscription after scroll','Discount offer after delay','Contact or lead form','Mobile-optimised CTA'],
          ['Triggers – time or scroll depth','4 positions – all corners','Width and colours adjustable','HTML content or simple text fields']),

        card('fa-square','#475569','Popup',
          'Pop-up window in the centre of the screen. Choose content mode: upload a ready image (fastest) or write a title, text and button.',
          ['Image + link ad popup (fastest)','Welcome message for new visitors','Discount code after delay','Important notice before content'],
          ['Image – drag & drop or choose from library','Text mode – title, text, button + colours','Link URL – make the whole popup clickable','Timing – immediately or after delay']),

        card('fa-envelope','#065f46','Lead Form',
          'Lead form that collects contact details directly into the database. Fields are fully configurable. Leads appear in the Leads tab and can be downloaded as CSV.',
          ['Contact request','Newsletter subscription','Book a demo form','Competition entry'],
          ['Fields – text / email / phone / textarea','Submit button text customisable','Success message after submission','All leads saved automatically']),

        card('fa-cookie-bite','#16a34a','Cookie Consent + Tracking integrations',
          'GDPR and ePrivacy compliant cookie banner that actually blocks tracking before consent. Enter your Google Analytics 4, GTM or Facebook Pixel ID directly in the editor — they activate automatically only after the visitor clicks Accept. No Cookiebot needed.',
          ['Consent-first: GA/Pixel does not load before consent','Deny clears _ga, _gid, _fbp cookies automatically','Enter GA4/GTM/Pixel ID in editor — no coding','GDPR & ePrivacy compliant','Cookie settings button + banner position + essentials-only button'],
          [
            '🔑 GA4 ID: analytics.google.com → Admin → Data Streams → copy Measurement ID (G-XXXXXXXXXX)',
            '🔑 GTM ID: tagmanager.google.com → select account → copy Container ID (GTM-XXXXXXX)',
            '🔑 Facebook Pixel: business.facebook.com → Events Manager → copy Pixel ID (15-digit number)',
            '💡 Other code (Hotjar, LinkedIn etc.): paste JS code in "Custom code" field without &lt;script&gt; tags',
            '✅ Accept → loads scripts + saves cc_consent=accepted cookie',
            '🚫 Reject → no scripts + clears tracking cookies + saves choice',
            '⚪ Essentials only → no tracking scripts, no clearing — saves cc_consent=necessary',
            '🍪 Cookie settings button: appears in corner after consent → visitor can change choice (enable in editor under "Appearance & placement")',
            '↕️ Banner position: choose Bottom or Top in editor under "Appearance & placement"',
            '📡 Listen yourself: document.addEventListener("cc_consent", e => { if(e.detail==="accepted") { ... } else if(e.detail==="necessary") { ... } })'
          ]),

        card('fa-chart-bar','#64748b','Stats collector',
          'Invisible tracking point – shows nothing to visitors. Only records an impression when the script runs. Useful for tracking page visitor counts without disruptive elements.',
          ['Track visitors to a specific page','Funnel analytics: how many reach a point','Map the most popular sections','Collect data before activating an element'],
          ['No visual settings – just a name is enough','Stats appear normally in the dashboard','Installed with the same script as other elements','Does not affect your site\'s appearance at all'])
      ])}

      ${section('fa-images','Image library','Upload and manage images for popup elements', [
        infoBlock('Access the image library directly from the popup element editor via the "Choose from library" button. Images are stored in the cloud.',
        [
          ['Uploading an image','In the popup editor: click "Upload image" or drag an image directly into the field. Images are automatically compressed if over 950 KB.'],
          ['Choose from library','Click the "Library" button in the popup editor – you\'ll see all your previously uploaded images in a grid view.'],
          ['Supported file types','JPG, PNG, GIF, WebP. Maximum size 10 MB. PNG images are automatically converted to JPEG when compressed (quality is preserved, file size reduced significantly).'],
          ['Image links','Images are stored securely in the cloud. Links update automatically every 7 days – images always display correctly.'],
          ['Tip – fastest way','Design your popup in Canva or Photoshop → upload the image directly to the editor with drag & drop → set the link URL → done.'],
        ]),
      ])}

      ${section('fa-clock','Timing','When the element is shown', [
        infoBlock('Timing settings are in the element editor\'s "Display" section.',
        [
          ['Immediately','Element appears as soon as the page loads.'],
          ['After delay','Choose with a button: 3s / 5s / 10s / 15s / 30s. Gives visitors time to look at the content first.'],
          ['Every time','Element is shown on every page load.'],
          ['Once per session','Element is shown only once per browser session. Good for popups so it doesn\'t annoy visitors.'],
          ['Slide-in – own timers','Slide-in elements have their own timing settings inside the editor: time (seconds) or scroll depth (%).'],
        ])
      ])}

      ${section('fa-crosshairs','Targeting','Show element only on specific pages', [
        infoBlock('Open <strong>Edit</strong> → scroll down → enable <strong>Restrict audience</strong>. Without rules, the element appears on all pages.',
        [
          ['AND mode','All rules must be satisfied at the same time. E.g. URL contains /hours AND device is Mobile → appears only on mobile on the hours page.'],
          ['OR mode','Only one rule needs to be satisfied. E.g. URL contains /hours OR /booking → appears on both pages. Use this when you want an element on multiple pages.'],
        ]),
        infoBlock('Page URL rule operators:',
        [
          ['"contains" + /hours','Matches all URLs that contain /hours. E.g. .../en/hours/group-fitness – works well for subpages.'],
          ['"is exactly" + /','Matches only the homepage (root URL). Note: "contains /" would match ALL pages because every URL has a slash!'],
          ['"is exactly" + /hours','Matches only this exact path – not subpages.'],
          ['"starts with" + /en/article','Matches all /en/article/... pages (entire article directory).'],
        ]),
        `<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:14px 16px;margin-top:4px">
          <div style="font-size:12px;font-weight:700;color:#92400e;margin-bottom:8px">📌 Practical examples</div>
          <div style="display:flex;flex-direction:column;gap:6px;font-size:12px;color:#78350f">
            <div><strong>Homepage:</strong> "is exactly" → <code style="background:#fef3c7;padding:1px 5px;border-radius:3px">/</code></div>
            <div><strong>Specific page:</strong> "contains" → <code style="background:#fef3c7;padding:1px 5px;border-radius:3px">/virtual-glasses</code></div>
            <div><strong>Three pages (OR):</strong> add 3 rules "contains" → <code style="background:#fef3c7;padding:1px 5px;border-radius:3px">/hours</code>, <code style="background:#fef3c7;padding:1px 5px;border-radius:3px">/booking</code>, <code style="background:#fef3c7;padding:1px 5px;border-radius:3px">/pricing</code></div>
            <div><strong>Mobile only:</strong> add rule Device → Mobile</div>
            <div><strong>Mobile + specific page (AND):</strong> Device = Mobile AND URL contains /hours</div>
          </div>
        </div>`
      ])}

      ${section('fa-code','Install code','One line is enough', [
        `<div style="display:flex;flex-direction:column;gap:10px">

          ${scenario('⭐','#1d4ed8','#eff6ff','#dbeafe',
            'Recommended – all elements automatically',
            'Add <strong>one line</strong> to your site\'s &lt;head&gt; section. All active elements load by themselves – no further code changes ever needed.',
            '&lt;!-- Add to site &lt;head&gt; section once --&gt;\n&lt;script src="https://popupmanager.net/ui-embed.js"\n        data-site="YOUR_SITE_TOKEN"&gt;&lt;/script&gt;',
            'Token is found in the Install Code tab. Create a site there first.'
          )}

          ${scenario('🌐','#374151','#f8fafc','#e2e8f0',
            'Multiple sites or separate test areas',
            'Create a separate site in the Install Code tab for each website or domain. Each site gets its own token.',
            '&lt;!-- mainsite.com --&gt;\n&lt;script src="...ui-embed.js" data-site="TOKEN_MAIN"&gt;&lt;/script&gt;\n\n&lt;!-- webshop.com --&gt;\n&lt;script src="...ui-embed.js" data-site="TOKEN_SHOP"&gt;&lt;/script&gt;',
            'Elements can be restricted to a specific site using the Site field in the editor.'
          )}

        </div>`
      ])}

      ${section('fa-inbox','Leads','Collected contact details and form submissions', [
        infoBlock('The Lead Form element saves all form submissions automatically. View them in the Leads tab in the dashboard.',
        [
          ['Where leads appear','Dashboard → Leads tab. You see all contact details in a table in chronological order.'],
          ['CSV export','Download all leads as an Excel/CSV file with one click.'],
          ['Fields','Form fields are configured in the Lead Form editor: text, email, phone, textarea.'],
          ['Email notification','You automatically receive an email for each new lead (setting: Install Code → Email notifications).'],
        ])
      ])}

      ${section('fa-chart-line','Reports','Stats by time range – period and all time', [
        infoBlock('The Reports tab shows detailed stats for the selected period. Filter by site or element.',
        [
          ['Time range selector','Choose a preset: Today / This week / This month / All time – or set a custom range with the "Custom..." button.'],
          ['Period stat cards','Top row shows exact impressions, clicks, leads and CTR% for the selected period. Data accumulates from today onwards.'],
          ['All time cards','Bottom row shows cumulative totals for all time – always available.'],
          ['Site filter','Select a site from the dropdown → element filter updates automatically to show only that site\'s elements.'],
          ['Element filter','Select a single element → see only that element\'s data. Stats collectors (📊) also appear in the list.'],
          ['Element table','Shows all elements sorted by impressions. When filtering by one element, the heading shows the element name. Stats collectors show "–" for clicks and leads since they can\'t be clicked.'],
          ['Page tracking arrow (▼)','If an element has page tracking enabled, a ▼ button appears on the row. Click it → see the most-clicked links/buttons and scroll depth chart embedded directly in the report.'],
          ['Recent leads','List of lead form submissions for the selected period – name, email, date.'],
          ['Send by email','Click "Send by email" – you receive the report by email with all elements (maximum 3 times per hour).'],
          ['Stats collectors in reports','Stats collector elements (📊) appear in the element table. Their impression counts show how many visitors pass through each page. You can compare e.g. homepage, booking page and contact page.'],
        ]),

        `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px 16px;margin-top:8px">
          <div style="font-size:12px;font-weight:700;color:#1d4ed8;margin-bottom:8px">📌 When does data start accumulating?</div>
          <div style="font-size:12px;color:#1e40af;line-height:1.6">
            Period impressions and clicks (blue cards) are collected from today onwards – there is no historical data from before activation.
            <br>Leads are always accurate because they have been stored with a timestamp from the start.
            <br>All time cards (grey) are immediately available – they use cumulative totals.
          </div>
        </div>`
      ])}

      ${section('fa-clock','Automate Reports','Schedule reports to be sent automatically to clients or your team', [
        infoBlock('Create a scheduled report that delivers a summary of impressions, clicks and leads to any email address – automatically on your chosen schedule.',
        [
          ['Where to find it','Reports tab → "Automate Reports" tab at the top.'],
          ['Create a schedule','Click "+ New Schedule" → enter a name, select a site and elements (or leave blank for all), set frequency, time and date range.'],
          ['Recipients','Enter up to 5 email addresses – you can add a client\'s email directly. They receive the same professional report.'],
          ['Test send','Click "Test" on a schedule card – a report is sent immediately to all recipients so you can preview it. Maximum 2 test sends per 30 minutes.'],
          ['Delivery history','Each schedule card shows the last deliveries: date, recipients and success status.'],
          ['Pause / resume','Toggle the schedule on or off from the card. Paused schedules do not send until re-activated.'],
        ]),
        `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px 16px;margin-top:8px">
          <div style="font-size:12px;font-weight:700;color:#1d4ed8;margin-bottom:8px">⏰ How the schedule works</div>
          <div style="font-size:12px;color:#1e40af;line-height:1.6">
            The system checks every 15 minutes whether any schedule is due. Reports are sent at the configured Helsinki time (DST-safe). "Weekly" means a specific day of the week; "Monthly" means a specific day of the month; "Custom" lets you set any interval in days.
          </div>
        </div>`
      ])}

      ${section('fa-mouse-pointer','Page tracking (Pro)','Track which links, buttons and page sections users click – and how far they scroll', [
        infoBlock(isAdmin
          ? 'Available to Pro users or users who have been granted more than 1 element.'
          : 'Page tracking is a Pro feature. Upgrade your account to access it.',
        [
          ['How to activate','Open the element editor → scroll to the "Page tracking" section → check "Fetch links and track page data" → save. The next page load on the client site starts tracking automatically.'],
          ['How it works','The embed script runs on the client website. When a visitor loads the page, the script scans all links (&lt;a&gt;) and buttons (&lt;button&gt;), sends the list to the server and adds click listeners. Each click is counted individually.'],
          ['Scroll tracking','Enable "Track scroll behaviour" → the script tracks how far (%) visitors scroll and where they pause for 2+ seconds. Click "📎 Page tracking ▼" in the Stats modal to view the chart.'],
          ['Manual additions','If auto-detection misses an element, you can add a CSS selector manually: type the selector (e.g. #buy-now or .cta-button) and a label → click Add.'],
          ['Stats','Open the element Stats button → click "📎 Page tracking ▼" → see the most-clicked links/buttons and scroll depth chart. In the Reports tab, click the ▼ button on the element row to get the same data embedded in the report.'],
        ])
      ])}

      ${section('fa-envelope','Email notifications','Automatic notifications and weekly report', [
        infoBlock('Settings are in <strong>Install Code → Email notifications</strong>.',
        [
          ['Lead notification','You receive an email as soon as a new submission arrives in a Lead Form element. The message contains all form fields.'],
          ['Weekly report','Every Monday at 8:00 you receive a summary: impressions, clicks and leads + comparison with the previous week.'],
          ['Notification address','By default your account email is used. You can set a separate address e.g. for a team or sales inbox.'],
          ['Test email','Click "Send test email" – you\'ll immediately see what the notification looks like.'],
          ['Disable notifications','Uncheck the relevant box and click Save – notifications stop immediately.'],
        ]),

        isAdmin ? infoBlock('SMTP settings (for server administrator) – configured once in .env file:',
        [
          ['Gmail (easiest)','SMTP_HOST=smtp.gmail.com · SMTP_PORT=587 · SMTP_USER=your@gmail.com · SMTP_PASS=app-password. App password: Google account → Security → 2-Step Verification → App passwords.'],
          ['Brevo (SendinBlue)','Free plan: 300 emails/day. SMTP_HOST=smtp-relay.brevo.com · SMTP_PORT=587. Create API key in Brevo dashboard.'],
          ['Mailgun','SMTP_HOST=smtp.mailgun.org · SMTP_PORT=587. Good option for production use.'],
          ['APP_URL','Also set APP_URL=https://yourdomain.com – used in email links.'],
        ]) : '',

        isAdmin ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 16px;display:flex;gap:12px;align-items:flex-start;margin-top:10px">
  <span style="font-size:18px;flex-shrink:0">💡</span>
  <div style="font-size:13px;color:#78350f">
    <strong>Tip – Test with Ethereal:</strong> Create a free test account at <strong>ethereal.email</strong>. Emails are "sent" but only visible in Ethereal's web interface – nothing arrives in a real inbox.
  </div>
</div>` : ''
      ])}

    </div>`;
}

// ─── Finnish help content ─────────────────────────────────────────────────────

function renderHelpFI(container) {
  const isAdmin = window.__currentUser__?.role === 'admin';

  container.innerHTML = `
    <div style="max-width:820px;font-family:system-ui,sans-serif">

      <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);border-radius:14px;padding:28px;color:#fff;margin-bottom:24px">
        <div style="font-size:22px;font-weight:800;margin-bottom:8px">UI Manager – Käyttöohje</div>
        <div style="opacity:.85;font-size:14px;line-height:1.6">Luo konversioelementtejä verkkosivustollesi ilman koodausta.
        Lisää yksi skriptirivi sivustollesi ja aktivoi elementit tästä dashboardista.</div>
        <div style="margin-top:16px;background:rgba(0,0,0,.25);border-radius:8px;padding:12px 16px;font-family:monospace;font-size:12px">
          &lt;script src="https://popupmanager.net/ui-embed.js" data-site="SIVUSTO_TOKEN"&gt;&lt;/script&gt;
        </div>
        <div style="margin-top:8px;font-size:12px;opacity:.75">Yksi rivi sivuston &lt;head&gt;-osioon – kaikki elementit latautuvat automaattisesti.</div>
      </div>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px 24px;margin-bottom:24px">
        <div style="font-size:14px;font-weight:800;color:#166534;margin-bottom:12px">🚀 Pikaohje – 3 askelta alkuun</div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div style="display:flex;align-items:flex-start;gap:12px">
            <div style="width:24px;height:24px;border-radius:50%;background:#16a34a;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">1</div>
            <div style="font-size:13px;color:#166534"><strong>Lisää asennuskoodi</strong> – Asennuskoodi-välilehdeltä löydät yksirivisen skriptin. Lisää se sivustosi &lt;head&gt;-osioon. Tehdään vain kerran – toimii kaikille elementeille.</div>
          </div>
          <div style="display:flex;align-items:flex-start;gap:12px">
            <div style="width:24px;height:24px;border-radius:50%;background:#16a34a;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">2</div>
            <div style="font-size:13px;color:#166534"><strong>Luo elementti</strong> – Klikkaa "+ Luo uusi" → valitse tyyppi kortista → täytä tekstit ja värit → tallenna.</div>
          </div>
          <div style="display:flex;align-items:flex-start;gap:12px">
            <div style="width:24px;height:24px;border-radius:50%;background:#16a34a;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">3</div>
            <div style="font-size:13px;color:#166534"><strong>Aktivoi</strong> – Kytke elementtikortin toggle päälle. Elementti alkaa näkyä sivustollasi välittömästi – ei tarvitse muuttaa sivuston koodia uudelleen.</div>
          </div>
        </div>
        <div style="margin-top:16px;display:flex;flex-direction:column;gap:8px;border-top:1px solid #bbf7d0;padding-top:14px">
          <div style="font-size:12px;font-weight:700;color:#166534;margin-bottom:2px">💡 Hyödyllistä tietää</div>
          <div style="display:flex;align-items:flex-start;gap:8px;font-size:12px;color:#166534">
            <span style="flex-shrink:0">🎯</span>
            <span><strong>Kohdistus</strong> – Rajaa missä elementti näkyy: avaa <strong>Muokkaa</strong> → Kohdistus → lisää sääntö. Usealle sivulle: käytä <strong>TAI</strong>-moodia. Etusivulle: "on täsmälleen" → <code style="background:#dcfce7;padding:1px 4px;border-radius:3px">/</code>. Katso tarkempi ohje Ohjeet → Kohdistus.</span>
          </div>
          <div style="display:flex;align-items:flex-start;gap:8px;font-size:12px;color:#166534">
            <span style="flex-shrink:0">📊</span>
            <span><strong>Raportit</strong> – Näet tarkat tilastot aikaväliltä Raportit-välilehdellä. Voit suodattaa sivuston tai elementin mukaan ja lähettää raportin sähköpostiin.</span>
          </div>
          <div style="display:flex;align-items:flex-start;gap:8px;font-size:12px;color:#166534">
            <span style="flex-shrink:0">🔄</span>
            <span><strong>Toggle = live</strong> – Elementtikortin vihreä toggle tarkoittaa että elementti on live. Harmaa = piilotettu. Muutos astuu voimaan välittömästi ilman sivuston koodin muuttamista.</span>
          </div>
        </div>
      </div>

      ${section('fa-layer-group','Elementtityypit','Mitä voit rakentaa', [
        card('fa-minus','#1d4ed8','Sticky Bar',
          'Kiinteä palkki sivun ylä- tai alareunassa. Pysyy näkyvissä vaikka käyttäjä scrollaa. Ihanteellinen kampanjoille, tarjouksille ja tärkeille ilmoituksille.',
          ['Kampanjakoodi tai tarjous','Cookie/GDPR-ilmoitus','Varhaisen rekisteröinnin CTA','Tärkeä ilmoitus kaikille kävijöille'],
          ['Teksti – kirjoita oma viesti','Max 3 toimintanappia (teksti + URL)','Sijainti – ylös tai alas','Taustaväri ja tekstiväri vapaasti valittavissa']),

        card('fa-circle','#6d28d9','Floating Button',
          'Pyöreä kelluva nappi sivun kulmassa. Sopii chat-, puhelin- tai CTA-toiminnoille. Näkyy aina kaikkialla häiritsemättä sisältöä.',
          ['Live chat -avaus','Soittopyyntö tai WhatsApp','Varaa aika -nappi','Takaisin sivun alkuun'],
          ['Ikoni – valitse visuaalisesta ruudukosta','Toiminto – avaa linkki tai ponnahdusikkuna','Sijainti – kaikki neljä kulmaa','Väri ja koko säädettävissä']),

        card('fa-comment-dots','#16a34a','Slide-in',
          'Animoitu boksi joka liukuu esiin sivun kulmasta. Voit asettaa milloin se näytetään: heti, viiveen jälkeen tai scrollatessa.',
          ['Uutiskirjetilaus scrollin jälkeen','Alennustarjous viiveen jälkeen','Yhteydenotto- tai liidilomake','Mobiilioptimoitu CTA'],
          ['Triggerit – aika tai scroll-syvyys','4 sijaintia – kaikki kulmat','Leveys ja värit säädettävissä','HTML-sisältö tai yksinkertaiset tekstikentät']),

        card('fa-square','#475569','Popup',
          'Ponnahdusikkuna näytön keskellä. Valitse sisältötapa: lataa valmis kuva (nopein) tai kirjoita otsikko, teksti ja nappi.',
          ['Kuva + linkki mainospopup (nopein)','Tervetuloviesti uusille kävijöille','Tarjouskoodi viiveen jälkeen','Tärkeä ilmoitus ennen sisältöä'],
          ['Kuva – drag & drop tai valitse kirjastosta','Teksti-tila – otsikko, teksti, nappi + värit','Linkki-URL – koko popup klikattavaksi','Ajastus – heti tai viiveen jälkeen']),

        card('fa-envelope','#065f46','Lead Form',
          'Liidilomake joka kerää yhteystietoja suoraan tietokantaan. Kentät ovat täysin konfiguroitavissa. Liidit näkyvät Liidit-välilehdellä ja voit ladata ne CSV:nä.',
          ['Yhteydenottopyyntö','Uutiskirjetilaus','Varaa demo -lomake','Kilpailun osallistuminen'],
          ['Kentät – teksti / email / puhelin / textarea','Lähetä-napin teksti muokattavissa','Onnistumisviesti tallentuvan jälkeen','Kaikki liidit tallentuvat automaattisesti']),

        card('fa-cookie-bite','#16a34a','Cookie Consent + Tracking-integraatiot',
          'GDPR- ja ePrivacy-yhteensopiva evästebanneri joka oikeasti estää seurannan ennen suostumusta. Syötä Google Analytics 4-, GTM- tai Facebook Pixel -tunnuksesi suoraan editoriin — ne aktivoituvat automaattisesti vasta kun kävijä klikkaa Hyväksy. Ei erillistä Cookiebotia tarvita.',
          ['Consent-first: GA/Pixel ei lataudu ennen hyväksyntää','Deny pyyhkii _ga, _gid, _fbp -evästeet automaattisesti','Syötä GA4/GTM/Pixel-tunnus editorissa — ei koodausta','GDPR & ePrivacy -yhteensopiva','Evästeasetukset-nappi + bannerin sijainti + välttämättömät-nappi'],
          [
            '🔑 GA4-tunnus: analytics.google.com → Hallinta → Tietovirrat → kopioi Mittaustunnus (G-XXXXXXXXXX)',
            '🔑 GTM-tunnus: tagmanager.google.com → valitse tili → kopioi Säilötunnus (GTM-XXXXXXX)',
            '🔑 Facebook Pixel: business.facebook.com → Tapahtumienhallintatyökalu → kopioi Pikselin ID (15-numeroinen)',
            '💡 Muu koodi (Hotjar, LinkedIn jne.): liitä JS-koodi "Muu koodi" -kenttään ilman <script>-tageja',
            '✅ Hyväksy → lataa skriptit + tallentaa cc_consent=accepted evästeeseen',
            '🚫 Hylkää → ei skriptejä + pyyhkii tracking-evästeet + tallentaa valinnan',
            '⚪ Vain välttämättömät → ei tracking-skriptejä, ei pyyhintää — tallentaa cc_consent=necessary',
            '🍪 Evästeasetukset-nappi: ilmestyy sivun kulmaan suostumuksen jälkeen → käyttäjä voi muuttaa valintaansa (aktivoi editorissa "Ulkoasu & sijoittelu" -osiossa)',
            '↕️ Bannerin sijainti: valitse Alareuna tai Yläreuna editorin "Ulkoasu & sijoittelu" -osiossa',
            '📡 Kuuntele itse: document.addEventListener("cc_consent", e => { if(e.detail==="accepted") { ... } else if(e.detail==="necessary") { ... } })'
          ]),

        card('fa-chart-bar','#64748b','Tilastojen kerääjä',
          'Näkymätön tilastopiste – ei näytä kävijöille mitään. Rekisteröi ainoastaan näyttökerran kun skripti suoritetaan. Hyödyllinen sivun kävijämäärän seurantaan ilman häiritseviä elementtejä.',
          ['Kävijämäärän seuranta tietylle sivulle','Funnel-analytiikka: kuinka moni saavuttaa kohdan','Sivuston suosituimpien osioiden kartoitus','Datan keräys ennen varsinaisen elementin aktivointia'],
          ['Ei visuaalisia asetuksia – pelkkä nimi riittää','Tilastot näkyvät normaalisti dashboardissa','Asenna samalla skriptillä kuin muut elementit','Ei häiritse sivuston ulkoasua lainkaan'])
      ])}

      ${section('fa-images','Kuvakirjasto','Lataa ja hallitse kuvia popup-elementteihin', [
        infoBlock('Pääset kuvakirjastoon suoraan popup-elementin editorista "Valitse kirjastosta" -napista. Kuvat tallennetaan pilveen.',
        [
          ['Kuvan lataaminen','Popup-editorissa: klikkaa "Lataa kuva" tai raahaa kuva suoraan kenttään. Kuvat pakataan automaattisesti jos ne ovat yli 950 KB.'],
          ['Valitse kirjastosta','Klikkaa "Kirjastosta" -nappia popup-editorissa – näet kaikki aiemmin lataamasi kuvat ruudukkonäkymässä.'],
          ['Tuetut tiedostomuodot','JPG, PNG, GIF, WebP. Maksimikoko 10 MB. PNG-kuvat muunnetaan automaattisesti JPEG:ksi pakkauksen yhteydessä (laatu säilyy hyvin, tiedostokoko pienenee huomattavasti).'],
          ['Kuvalinkit','Kuvat tallennetaan turvallisesti pilveen. Linkit päivittyvät automaattisesti 7 päivän välein – kuvat näkyvät aina oikein.'],
          ['Vinkki – nopein tapa','Suunnittele popup Canvassa tai Photoshopissa → lataa kuva suoraan editoriin drag & dropilla → aseta linkki-URL → valmis.'],
        ]),
      ])}

      ${section('fa-clock','Ajastus','Milloin elementti näytetään', [
        infoBlock('Ajoitusasetukset löytyvät elementin editorin "Näyttäminen"-osiosta.',
        [
          ['Heti','Elementti näkyy heti kun sivu latautuu.'],
          ['Viiveen jälkeen','Valitse napin painalluksella: 3s / 5s / 10s / 15s / 30s. Antaa kävijälle aikaa ensin tutustua sisältöön.'],
          ['Joka kerta','Elementti näytetään jokaisella sivulatauksella.'],
          ['Kerran per istunto','Elementti näytetään vain kerran per selainistunto. Hyvä popupeille jotta se ei ärsytä kävijää.'],
          ['Slide-in – omat ajastimet','Slide-in-elementillä on omat ajoitusasetukset editorin sisällä: aika (sekuntia) tai scroll-syvyys (%).'],
        ])
      ])}

      ${section('fa-crosshairs','Kohdistus','Näytä elementti vain tietyillä sivuilla', [
        infoBlock('Avaa <strong>Muokkaa</strong> → rullaa alas → kytke <strong>Rajoita kohderyhmä</strong> päälle. Ilman sääntöjä elementti näkyy kaikilla sivuilla.',
        [
          ['JA-moodi','Kaikkien sääntöjen pitää täyttyä yhtä aikaa. Esim. URL sisältää /tunnit JA laite on Mobiili → näkyy vain mobiilikäyttäjille tunnit-sivulla.'],
          ['TAI-moodi','Riittää että yksi sääntö täyttyy. Esim. URL sisältää /tunnit TAI /varaus → näkyy molemmilla sivuilla. Käytä tätä kun haluat elementin usealle sivulle.'],
        ]),
        infoBlock('Sivun osoite -säännön operaattorit:',
        [
          ['"sisältää" + /tunnit','Täsmää kaikkiin URL-osoitteisiin joissa on /tunnit. Esim. .../fi/tunnit/ryhmaliikunta – toimii hyvin alasivuille.'],
          ['"on täsmälleen" + /','Täsmää vain etusivuun (juuriosoite). Muista: "sisältää /" osuisi KAIKKIIN sivuihin koska kauttaviiva on jokaisessa URL:ssa!'],
          ['"on täsmälleen" + /tunnit','Täsmää vain tähän yhteen polkuun – ei alasivuihin.'],
          ['"alkaa" + /fi-fi/article','Täsmää kaikkiin /fi-fi/article/... -sivuihin (koko artikkelihakemisto).'],
        ]),
        `<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:14px 16px;margin-top:4px">
          <div style="font-size:12px;font-weight:700;color:#92400e;margin-bottom:8px">📌 Käytännön esimerkkejä</div>
          <div style="display:flex;flex-direction:column;gap:6px;font-size:12px;color:#78350f">
            <div><strong>Etusivu:</strong> "on täsmälleen" → <code style="background:#fef3c7;padding:1px 5px;border-radius:3px">/</code></div>
            <div><strong>Tietty sivu:</strong> "sisältää" → <code style="background:#fef3c7;padding:1px 5px;border-radius:3px">/virtuaalilasit</code></div>
            <div><strong>Kolme sivua (TAI):</strong> lisää 3 sääntöä "sisältää" → <code style="background:#fef3c7;padding:1px 5px;border-radius:3px">/tunnit</code>, <code style="background:#fef3c7;padding:1px 5px;border-radius:3px">/varaus</code>, <code style="background:#fef3c7;padding:1px 5px;border-radius:3px">/hinnasto</code></div>
            <div><strong>Vain mobiililla:</strong> lisää sääntö Laite → Mobiili</div>
            <div><strong>Mobiili + tietty sivu (JA):</strong> Laite = Mobiili JA URL sisältää /tunnit</div>
          </div>
        </div>`
      ])}

      ${section('fa-code','Asennuskoodi','Yksi rivi riittää', [
        `<div style="display:flex;flex-direction:column;gap:10px">

          ${scenario('⭐','#1d4ed8','#eff6ff','#dbeafe',
            'Suositeltava tapa – kaikki elementit automaattisesti',
            'Lisää <strong>yksi rivi</strong> sivustosi &lt;head&gt;-osioon. Kaikki aktiiviset elementit latautuvat itsestään – ei muita koodirivejä tarvita koskaan.',
            '&lt;!-- Lisää sivuston &lt;head&gt;-osioon kerran --&gt;\n&lt;script src="https://popupmanager.net/ui-embed.js"\n        data-site="SINUN_SIVUSTO_TOKEN"&gt;&lt;/script&gt;',
            'Token löytyy Asennuskoodi-välilehdeltä. Luo ensin sivusto sieltä.'
          )}

          ${scenario('🌐','#374151','#f8fafc','#e2e8f0',
            'Useita sivustoja tai erillisiä testialueita',
            'Luo jokaista sivustoa tai domainia varten oma sivusto Asennuskoodi-välilehdeltä. Kukin sivusto saa oman tokenin.',
            '&lt;!-- paasivu.fi --&gt;\n&lt;script src="...ui-embed.js" data-site="TOKEN_PAASIVU"&gt;&lt;/script&gt;\n\n&lt;!-- verkkokauppa.fi --&gt;\n&lt;script src="...ui-embed.js" data-site="TOKEN_KAUPPA"&gt;&lt;/script&gt;',
            'Elementtejä voi rajata tietylle sivustolle editorin Sivusto-kentällä.'
          )}

        </div>`
      ])}

      ${section('fa-inbox','Liidit','Kerätyt yhteystiedot ja lomakelähetykset', [
        infoBlock('Lead Form -elementti tallentaa kaikki lomakelähetykset automaattisesti. Voit tarkastella niitä Liidit-välilehdellä dashboardissa.',
        [
          ['Missä liidit näkyvät','Dashboard → Liidit-välilehti. Näet kaikki yhteystiedot taulukossa aikajärjestyksessä.'],
          ['CSV-vienti','Lataa kaikki liidit Excel/CSV-tiedostona yhdellä napin painalluksella.'],
          ['Kentät','Lomakkeen kentät määritetään Lead Form -editorissa: teksti, email, puhelin, textarea.'],
          ['Sähköposti-ilmoitus','Saat automaattisesti sähköpostin joka uudesta liidistä (asetus: Asennuskoodi → Sähköposti-ilmoitukset).'],
        ])
      ])}

      ${section('fa-chart-line','Raportit','Tilastot aikaväleittäin – jakso ja kaikki aika', [
        infoBlock('Raportit-välilehti näyttää tarkat tilastot valitulle ajanjaksolle. Voit suodattaa sivuston tai elementin mukaan.',
        [
          ['Aikavälivalitsin','Valitse valmisvaihtoehto: Tänään / Tämä viikko / Tämä kuukausi / Kaikki aika – tai aseta vapaa aikaväli "Muokkaa..."-napista.'],
          ['Jakson tilastokortit','Ylärivi näyttää valitun jakson tarkat näyttökerrat, klikkaukset, liidit ja CTR%. Data kertyy tästä päivästä alkaen.'],
          ['Kaikki aika -kortit','Alarivi näyttää kumulatiiviset kokonaissummat kaikesta ajasta – aina saatavilla.'],
          ['Sivusto-suodatin','Valitse sivusto-dropdownista → elementtisuodatin päivittyy automaattisesti näyttämään vain sen sivuston elementit.'],
          ['Elementtisuodatin','Valitse yksittäinen elementti → näet vain sen elementin datan. Tilastojenkerääjät (📊) näkyvät myös listassa.'],
          ['Elementtitaulukko','Näyttää kaikki elementit näyttökertojen mukaan järjestettynä. Yhdellä elementillä suodatettaessa otsikko näyttää elementin nimen. Tilastojenkerääjillä klikkaukset ja liidit näkyvät "–" koska niitä ei voi klikata.'],
          ['Sivun seuranta -nuoli (▼)','Jos elementillä on sivun seuranta päällä, rivillä näkyy ▼-nappi. Klikkaa sitä → näet klikatuimmat linkit ja napit sekä scroll-syvyyskaavion suoraan raporttiin upotettuna.'],
          ['Viimeisimmät liidit','Listaus valitun jakson lead form -lähetyksistä – nimi, sähköposti, päivämäärä.'],
          ['Lähetä sähköpostiin','Klikkaa "Lähetä sähköpostiin" -nappia – saat raportin sähköpostiisi kaikilla elementeillä (maksimissaan 3 kertaa tunnissa).'],
          ['Tilastojenkerääjät raportissa','Tilastojenkerääjä-elementit (📊) näkyvät elementtitaulukossa. Niiden näyttökerrat kertovat miten paljon sivuilla käy kävijöitä. Voit vertailla esim. etusivua, varaussivua ja yhteystietosivua keskenään.'],
        ]),

        `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px 16px;margin-top:8px">
          <div style="font-size:12px;font-weight:700;color:#1d4ed8;margin-bottom:8px">📌 Milloin data alkaa kertyä?</div>
          <div style="font-size:12px;color:#1e40af;line-height:1.6">
            Jaksokohtaiset näyttö- ja klikkausmäärät (sininen kortit) kerätään tästä päivästä alkaen – ennen käyttöönottoa ei ole historiadataa.
            <br>Liidit ovat aina tarkkoja koska ne on tallennettu alusta asti aikaleimalla.
            <br>Kaikki-aika -kortit (harmaat) ovat välittömästi saatavilla – ne käyttävät kumulatiivisia kokonaissummia.
          </div>
        </div>`
      ])}

      ${section('fa-clock','Automatisoi raportit','Ajasta raportit lähetettäväksi automaattisesti asiakkaille tai tiimille', [
        infoBlock('Luo ajastettu raportti, joka toimittaa yhteenvedon näyttökerroista, klikkauksista ja liideistä mihin tahansa sähköpostiosoitteeseen – automaattisesti valitsemallasi aikataululla.',
        [
          ['Mistä löytyy','Raportit-välilehti → "Automatisoi raportit" -välilehti ylhäällä.'],
          ['Luo aikataulu','Klikkaa "+ Uusi aikataulu" → anna nimi, valitse sivusto ja elementit (tai jätä tyhjäksi kaikille), aseta toistuvuus, kellonaika ja raporttijakso.'],
          ['Vastaanottajat','Syötä enintään 5 sähköpostiosoitetta – voit lisätä asiakkaan sähköpostin suoraan. He saavat saman ammattimaisen raportin.'],
          ['Testaa-lähetys','Klikkaa "Testaa" aikataulukortissa – raportti lähetetään heti kaikille vastaanottajille, joten voit esikatsella sen. Enintään 2 testilähetystä 30 minuutissa.'],
          ['Toimitushistoria','Jokainen aikataulukortti näyttää viimeisimmät toimitukset: päivämäärän, vastaanottajat ja onnistumistilan.'],
          ['Tauko / jatkaminen','Kytke aikataulu päälle tai pois kortista. Tauotetut aikataulut eivät lähetä ennen kuin ne aktivoidaan uudelleen.'],
        ]),
        `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px 16px;margin-top:8px">
          <div style="font-size:12px;font-weight:700;color:#1d4ed8;margin-bottom:8px">⏰ Miten aikataulu toimii</div>
          <div style="font-size:12px;color:#1e40af;line-height:1.6">
            Järjestelmä tarkistaa 15 minuutin välein onko jokin aikataulu erääntynyt. Raportit lähetetään asetettuun Helsinki-aikaan (kesäaika huomioitu). "Viikoittain" tarkoittaa tiettyä viikonpäivää; "Kuukausittain" tiettyä kuukaudenpäivää; "Mukautettu" antaa määrittää minkä tahansa välin päivissä.
          </div>
        </div>`
      ])}

      ${section('fa-mouse-pointer','Sivun seuranta (Pro)','Seuraa minkä linkkien, nappien ja sivun alueiden käyttäjät klikkaa – ja kuinka pitkälle he vierittävät', [
        infoBlock(isAdmin
          ? 'Saatavilla Pro-käyttäjille tai käyttäjille joille on myönnetty enemmän kuin 1 elementti.'
          : 'Sivun seuranta on Pro-ominaisuus. Päivitä tili saadaksesi käyttöön.',
        [
          ['Miten aktivoidaan','Avaa elementin muokkausnäkymä → rullaa alas "Sivun seuranta" -osioon → laita rasti "Hae linkit ja seuraa sivun dataa" -kohtaan → tallenna. Seuraava sivulataus alkaa automaattisesti seurata.'],
          ['Miten se toimii','Embed-skripti ajetaan asiakkaan sivustolla. Kun kävijä lataa sivun, skripti etsii automaattisesti kaikki linkit (<a>) ja napit (<button>), lähettää listan palvelimelle ja lisää kuuntelijat. Jokainen klikkaus tilastoituu erikseen.'],
          ['Scroll-seuranta','Aktivoi "Seuraa vierityskäyttäytymistä" → skripti seuraa kuinka pitkälle (%) kävijä vierittää ja missä hän pysähtyy yli 2 sekunniksi. Tilastot näkyvät Tilastot-painikkeen alla.'],
          ['Manuaalinen lisäys','Jos skripti ei automaattisesti löydä jotain elementtiä, voit lisätä CSS-selectorin käsin: kirjoita selektori (esim. #osta-nyt tai .cta-button) ja kuvaus → klikkaa Lisää.'],
          ['Tilastot','Avaa elementin Tilastot-painike → klikkaa "📎 Sivun seuranta ▼" -nappia → näet klikatuimmat linkit/napit ja scroll-syvyyskaavion. Raportit-sivulla paina elementin rivin ▼-nappia saadaksesi samat tiedot raporttiin upotettuna.'],
        ])
      ])}

      ${section('fa-envelope','Sähköposti-ilmoitukset','Automaattiset ilmoitukset ja viikkoraportti', [
        infoBlock('Asetukset löytyvät <strong>Asennuskoodi → Sähköposti-ilmoitukset</strong> -osiosta.',
        [
          ['Liidi-ilmoitus','Saat sähköpostin heti kun Lead Form -elementtiin tulee uusi lähetys. Viesti sisältää kaikki lomakkeen kentät.'],
          ['Viikkoraportti','Joka maanantai klo 8:00 saat yhteenvedon: näyttökerrat, klikkaukset ja liidit + vertailu edelliseen viikkoon.'],
          ['Ilmoitusosoite','Oletuksena käytetään tili-sähköpostiosoitetta. Voit asettaa erillisen osoitteen esim. tiimille tai myyntipostilaatikkoon.'],
          ['Testisähköposti','Klikkaa "Lähetä testisähköposti" -nappia – näet heti miltä ilmoitus näyttää.'],
          ['Ilmoitusten sammutus','Poista rasti ao. ruudusta ja klikkaa Tallenna – ilmoitukset lakkaa välittömästi.'],
        ]),

        isAdmin ? infoBlock('SMTP-asetukset (palvelimen ylläpitäjälle) – konfiguroidaan kerran .env-tiedostoon:',
        [
          ['Gmail (helpoin)','SMTP_HOST=smtp.gmail.com · SMTP_PORT=587 · SMTP_USER=sinun@gmail.com · SMTP_PASS=sovellussalasana. Sovellussalasana: Google-tili → Turvallisuus → Kaksivaiheinen todentaminen → Sovellussalasanat.'],
          ['Brevo (SendinBlue)','Ilmainen tili: 300 sähköpostia/vrk. SMTP_HOST=smtp-relay.brevo.com · SMTP_PORT=587. Luo API-avain Brecon dashboardista.'],
          ['Mailgun','SMTP_HOST=smtp.mailgun.org · SMTP_PORT=587. Hyvä vaihtoehto tuotantokäyttöön.'],
          ['APP_URL','Aseta myös APP_URL=https://sinundomain.fi – käytetään sähköpostien linkeissä.'],
        ]) : '',

        isAdmin ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 16px;display:flex;gap:12px;align-items:flex-start;margin-top:10px">
  <span style="font-size:18px;flex-shrink:0">💡</span>
  <div style="font-size:13px;color:#78350f">
    <strong>Vinkki – Testaa Etherealilla:</strong> Luo ilmainen testitili osoitteessa <strong>ethereal.email</strong>. Sähköpostit "lähetetään" mutta näkyvät vain Etherealin web-käyttöliittymässä – ei päädy oikeaan postilaatikkoon.
  </div>
</div>` : ''
      ])}

    </div>`;
}

// ─── Shared UI helpers ────────────────────────────────────────────────────────

function section(icon, title, subtitle, children) {
  return `<div style="margin-bottom:28px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
      <i class="fa ${icon}" style="color:#3b82f6;font-size:16px;width:20px;text-align:center"></i>
      <h2 style="margin:0;font-size:17px;font-weight:700;color:#0f172a">${title}</h2>
    </div>
    <p style="margin:0 0 14px 30px;font-size:13px;color:#64748b">${subtitle}</p>
    <div style="margin-left:0">${Array.isArray(children) ? children.join('') : children}</div>
  </div>`;
}

function card(icon, color, title, desc, useCases, fields) {
  return `<details style="border:1px solid #e2e8f0;border-radius:10px;margin-bottom:10px;overflow:hidden">
    <summary style="display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer;background:#fff;list-style:none;user-select:none">
      <div style="width:32px;height:32px;border-radius:8px;background:${color}18;display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <i class="fa ${icon}" style="color:${color};font-size:14px"></i>
      </div>
      <div style="flex:1">
        <div style="font-weight:700;font-size:14px;color:#0f172a">${title}</div>
        <div style="font-size:12px;color:#64748b;margin-top:2px">${desc.substring(0,80)}...</div>
      </div>
      <i class="fa fa-chevron-down" style="color:#94a3b8;font-size:11px"></i>
    </summary>
    <div style="padding:16px;border-top:1px solid #f1f5f9;background:#fafbfc">
      <p style="font-size:13px;color:#475569;margin:0 0 14px">${desc}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Use cases</div>
          ${useCases.map(u => `<div style="font-size:12px;color:#374151;padding:3px 0;display:flex;align-items:center;gap:6px"><span style="color:#22c55e">✓</span>${u}</div>`).join('')}
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Settings</div>
          ${fields.map(f => `<div style="font-size:12px;color:#374151;padding:3px 0;display:flex;align-items:flex-start;gap:6px"><span style="color:#22c55e;flex-shrink:0">•</span><span>${f}</span></div>`).join('')}
        </div>
      </div>
    </div>
  </details>`;
}

function infoBlock(intro, rows) {
  return `<div style="border:1px solid #e2e8f0;border-radius:10px;padding:16px;background:#fff;margin-bottom:10px">
    <p style="font-size:13px;color:#475569;margin:0 0 14px">${intro}</p>
    <div style="display:flex;flex-direction:column;gap:6px">
      ${rows.map(([label, desc]) => `
        <div style="display:flex;gap:12px;padding:8px 10px;background:#f8fafc;border-radius:7px">
          <div style="font-size:12px;font-weight:600;color:#0f172a;min-width:160px;flex-shrink:0">${label}</div>
          <div style="font-size:12px;color:#64748b">${desc}</div>
        </div>`).join('')}
    </div>
  </div>`;
}

function scenario(icon, titleColor, bgHeader, bgBorder, title, desc, code, tip) {
  return `<details style="border:1px solid ${bgBorder};border-radius:10px;overflow:hidden;margin-bottom:8px">
    <summary style="display:flex;align-items:center;gap:10px;padding:12px 16px;cursor:pointer;background:${bgHeader};list-style:none;user-select:none">
      <span style="font-size:18px">${icon}</span>
      <span style="font-size:13px;font-weight:700;color:${titleColor};flex:1">${title}</span>
      <i class="fa fa-chevron-down" style="color:#94a3b8;font-size:11px"></i>
    </summary>
    <div style="padding:16px;border-top:1px solid ${bgBorder};background:#fff">
      <p style="font-size:13px;color:#475569;margin:0 0 12px">${desc}</p>
      <pre style="background:#1e293b;color:#e2e8f0;padding:14px 16px;border-radius:8px;font-size:11px;font-family:monospace;white-space:pre-wrap;word-break:break-all;margin:0 0 10px;line-height:1.6">${code}</pre>
      ${tip ? `<div style="display:flex;align-items:flex-start;gap:6px;font-size:12px;color:#64748b"><span>💡</span><span>${tip}</span></div>` : ''}
    </div>
  </details>`;
}
