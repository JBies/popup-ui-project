// js/dashboard/campaigns-panel.js

export function initCampaignsPanel() {
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#campaigns') loadCampaigns();
  });
  if (window.location.hash === '#campaigns') loadCampaigns();
  window.addEventListener('refresh-elements', () => {
    if (window.location.hash === '#campaigns') loadCampaigns();
  });
}

async function loadCampaigns() {
  const container = document.getElementById('campaigns-content');
  if (!container) return;
  container.innerHTML = '<div style="color:#64748b;padding:24px">Ladataan...</div>';

  try {
    const r = await fetch('/api/popups');
    if (!r.ok) throw new Error();
    const elements = await r.json();

    const grouped = {};
    elements.forEach(el => {
      const tag = el.campaign || '';
      if (!grouped[tag]) grouped[tag] = [];
      grouped[tag].push(el);
    });

    container.innerHTML = `
      <div style="max-width:800px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
          <h2 style="font-size:18px;font-weight:700;margin:0">Kampanjat</h2>
          <button id="btn-new-campaign" class="btn btn-primary btn-sm"><i class="fa fa-plus"></i> Uusi kampanja</button>
        </div>
        ${Object.entries(grouped).map(([tag, els]) => `
          <div style="border:1px solid #e2e8f0;border-radius:10px;margin-bottom:12px;overflow:hidden">
            <div style="background:#f8fafc;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e2e8f0">
              <div>
                <span style="font-weight:700;font-size:14px">${tag || '(Ei kampanjaa)'}</span>
                <span style="color:#64748b;font-size:12px;margin-left:8px">${els.length} el. · ${els.filter(e => e.active !== false).length} aktiivinen</span>
              </div>
              ${tag ? `<div style="display:flex;gap:6px">
                <button class="btn btn-sm btn-secondary campaign-toggle" data-campaign="${tag}" data-active="true" style="font-size:11px">
                  <i class="fa fa-play"></i> Aktivoi
                </button>
                <button class="btn btn-sm btn-secondary campaign-toggle" data-campaign="${tag}" data-active="false" style="font-size:11px">
                  <i class="fa fa-pause"></i> Pysäytä
                </button>
              </div>` : ''}
            </div>
            <div style="padding:8px 16px">
              ${els.map(el => `
                <div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid #f8fafc">
                  <div style="width:8px;height:8px;border-radius:50%;flex-shrink:0;background:${el.active !== false ? '#22c55e' : '#94a3b8'}"></div>
                  <span style="flex:1;font-size:13px;color:#0f172a">${el.name || 'Nimetön'}</span>
                  <span style="font-size:11px;color:#64748b">${el.elementType || 'popup'}</span>
                  <button class="toggle-active-btn" data-id="${el._id}" data-active="${el.active !== false}"
                    style="padding:3px 10px;border-radius:5px;border:1px solid #e2e8f0;cursor:pointer;font-size:11px;
                           background:${el.active !== false ? '#dcfce7' : '#fee2e2'};
                           color:${el.active !== false ? '#16a34a' : '#dc2626'}">
                    ${el.active !== false ? 'Aktiivinen' : 'Ei käytössä'}
                  </button>
                </div>`).join('')}
            </div>
          </div>`).join('')}
      </div>`;

    container.querySelector('#btn-new-campaign')?.addEventListener('click', () => openCampaignModal(elements));

    container.querySelectorAll('.campaign-toggle').forEach(btn => {
      btn.addEventListener('click', async () => {
        const active = btn.dataset.active === 'true';
        await fetch('/api/popups/campaign/activate', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaign: btn.dataset.campaign, active })
        });
        loadCampaigns();
      });
    });

    container.querySelectorAll('.toggle-active-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const isActive = btn.dataset.active === 'true';
        await fetch('/api/popups/' + btn.dataset.id + '/toggle-active', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ active: !isActive })
        });
        loadCampaigns();
        window.dispatchEvent(new CustomEvent('refresh-elements'));
      });
    });
  } catch (e) {
    container.innerHTML = '<div style="color:#ef4444;padding:24px">Latausvirhe.</div>';
  }
}

function openCampaignModal(elements) {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center';
  modal.innerHTML = `
    <div style="background:#fff;border-radius:12px;padding:28px;width:460px;max-width:96vw;max-height:90vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.2);font-family:system-ui,sans-serif">
      <h3 style="margin:0 0 16px;font-size:17px">Uusi kampanja</h3>
      <div style="margin-bottom:12px">
        <label style="font-size:12px;color:#475569;display:block;margin-bottom:4px">Kampanjan nimi</label>
        <input id="camp-name" type="text" placeholder="esim. Black Friday" style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:7px;font-size:13px;box-sizing:border-box">
      </div>
      <div style="margin-bottom:20px">
        <label style="font-size:12px;color:#475569;display:block;margin-bottom:8px">Valitse elementit kampanjaan</label>
        <div style="max-height:200px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:7px;padding:8px">
          ${elements.map(el => `
            <label style="display:flex;align-items:center;gap:8px;padding:5px;font-size:13px;cursor:pointer;border-radius:5px">
              <input type="checkbox" class="camp-el" value="${el._id}">
              <span>${el.name || 'Nimetön'}</span>
              <span style="color:#94a3b8;font-size:11px">${el.elementType}</span>
            </label>`).join('')}
        </div>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button id="camp-cancel" style="padding:8px 18px;border:1px solid #e2e8f0;border-radius:7px;background:#fff;cursor:pointer;font-size:13px">Peruuta</button>
        <button id="camp-save" style="padding:8px 18px;border:none;border-radius:7px;background:#3b82f6;color:#fff;cursor:pointer;font-size:13px;font-weight:600">Luo kampanja</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector('#camp-cancel').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  modal.querySelector('#camp-save').addEventListener('click', async () => {
    const name = modal.querySelector('#camp-name').value.trim();
    if (!name) return;
    const ids = [...modal.querySelectorAll('.camp-el:checked')].map(cb => cb.value);
    if (!ids.length) return;
    await Promise.all(ids.map(id =>
      fetch('/api/popups/' + id, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign: name })
      })
    ));
    modal.remove();
    window.dispatchEvent(new CustomEvent('refresh-elements'));
    loadCampaigns();
  });
}
