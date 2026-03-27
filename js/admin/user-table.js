// js/admin/user-table.js
// Käyttäjätaulukon renderöinti ja käsittely

/**
 * UserTable-luokka vastaa käyttäjätietojen näyttämisestä
 */
class UserTable {
    /**
     * Renderöi käyttäjätaulukon annetuilla käyttäjillä
     * @param {Array} users - Käyttäjäobjektien lista
     * @param {Function} onAction - Callback funktio toiminnoille
     */
    static renderUserTable(users, onAction) {
      const usersTable = document.getElementById('usersTable').getElementsByTagName('tbody')[0];
      
      // Tyhjennetään taulukko
      usersTable.innerHTML = '';
      
      // Jos ei käyttäjiä, näytetään viesti
      if (users.length === 0) {
        const row = usersTable.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 6;
        cell.className = 'empty-message';
        cell.textContent = 'No users found.';
        return;
      }
      
      // Lisätään käyttäjät taulukkoon
      users.forEach(user => {
        const row = usersTable.insertRow();
        row.className = user.role === 'pending' ? 'user-pending' : (user.role === 'admin' ? 'user-admin' : '');
        
        // Profiilkuva & nimi
        const userCell = row.insertCell();
        userCell.className = 'user-info-cell';
        userCell.innerHTML = `
          <div class="user-info-wrapper">
            <img src="${user.profilePicture || 'https://via.placeholder.com/40'}" class="user-avatar" alt="${user.displayName}">
            <div class="user-name-wrapper">
              <div class="user-name">${user.displayName}</div>
              <div class="user-email">${user.email}</div>
            </div>
          </div>
        `;
        
        // Rooli
        const roleCell = row.insertCell();
        roleCell.innerHTML = `
          <span class="role-badge role-${user.role}">${user.role}</span>
        `;
        // Popup-rajoitus 
        const popupLimitCell = row.insertCell();
        if (user.role === 'admin') {
          popupLimitCell.innerHTML = `<span class="unlimited-badge">∞</span>`;
        } else {
          popupLimitCell.innerHTML = `
            <div class="popup-limit-control">
              <input type="number" class="popup-limit-input" min="1" max="100" value="${user.popupLimit || 1}" 
                    data-id="${user._id}" data-original-value="${user.popupLimit || 1}">
              <button class="save-limit-btn" data-id="${user._id}" style="display: none;"><i class="fas fa-check"></i></button>
            </div>
      `;
    }
        
        // Rekisteröityminen
        const registeredCell = row.insertCell();
        registeredCell.innerHTML = `
          <div class="date-info">
            <div>${this.formatDate(user.registeredAt)}</div>
            <div class="time-info">${this.formatTime(user.registeredAt)}</div>
          </div>
        `;
        
        // Viimeisin kirjautuminen
        const lastLoginCell = row.insertCell();
        lastLoginCell.innerHTML = `
          <div class="date-info">
            <div>${this.formatDate(user.lastLogin)}</div>
            <div class="time-info">${this.formatTime(user.lastLogin)}</div>
          </div>
        `;
        
        // Hyväksyntäaika (jos käyttäjä on hyväksytty)
        const approvedCell = row.insertCell();
        if (user.approvedAt) {
          approvedCell.innerHTML = `
            <div class="date-info">
              <div>${this.formatDate(user.approvedAt)}</div>
              <div class="time-info">${this.formatTime(user.approvedAt)}</div>
            </div>
          `;
        } else {
          approvedCell.textContent = '-';
        }
        
        // Toiminnot
        const actionsCell = row.insertCell();
        actionsCell.className = 'actions-cell';
        
        // Näytetään erilaisia toimintoja roolin mukaan
        if (user.role === 'pending') {
          actionsCell.innerHTML = `
            <button class="approve-btn" data-id="${user._id}">
              <i class="fas fa-check"></i> Hyväksy
            </button>
            <button class="delete-btn" data-id="${user._id}">
              <i class="fas fa-trash"></i>
            </button>
          `;
        } else if (user.role === 'user') {
          actionsCell.innerHTML = `
            <select class="role-select" data-id="${user._id}">
              <option value="user" selected>User</option>
              <option value="admin">Admin</option>
            </select>
            <button class="edit-limits-btn" data-id="${user._id}" title="Muokkaa rajoituksia"
              style="padding:6px 10px;background:#3b82f6;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px">
              <i class="fas fa-sliders-h"></i> Limits
            </button>
            <button class="delete-btn" data-id="${user._id}">
              <i class="fas fa-trash"></i>
            </button>
          `;
        } else if (user.role === 'admin') {
          // Estetään admin-käyttäjien muokkaaminen jos on vain 1 admin
          const adminCount = users.filter(u => u.role === 'admin').length;
          
          if (adminCount > 1) {
            actionsCell.innerHTML = `
              <select class="role-select" data-id="${user._id}">
                <option value="admin" selected>Admin</option>
                <option value="user">User</option>
                </select>
          `;
        } else {
          actionsCell.innerHTML = `
            <span class="admin-info">Super Admin</span>
          `;
        }
      }
    });
    
    // Lisätään toimintojen tapahtumakuuntelijat, jos callback on annettu
    if (typeof onAction === 'function') {
      this.setupActionHandlers(onAction);
    }
  }

  
  
  /**
   * Lisää tapahtumakuuntelijat toimintopainikkeille
   * @param {Function} onAction - Callback funktio toiminnoille
   */
  static setupActionHandlers(onAction) {
    // Hyväksy-painikkeet
    document.querySelectorAll('.approve-btn').forEach(button => {
      button.addEventListener('click', () => {
        const userId = button.dataset.id;
        onAction('approve', userId, 'user');
      });
    });
    
    // Roolin valinnat
    document.querySelectorAll('.role-select').forEach(select => {
      select.addEventListener('change', () => {
        const userId = select.dataset.id;
        const newRole = select.value;
        onAction('updateRole', userId, newRole);
      });
    });
    
    // Poisto-painikkeet
    document.querySelectorAll('.delete-btn').forEach(button => {
      button.addEventListener('click', () => {
        const userId = button.dataset.id;
        if (confirm('Haluatko varmasti poistaa tämän käyttäjän?')) {
          onAction('delete', userId);
        }
      });
    });
    // Edit Limits -painikkeet
  document.querySelectorAll('.edit-limits-btn').forEach(button => {
    button.addEventListener('click', () => {
      const userId = button.dataset.id;
      UserTable.openLimitsModal(userId, onAction);
    });
  });

  // tapahtumakäsittelijät popup-rajoituksille
  document.querySelectorAll('.popup-limit-input').forEach(input => {
    input.addEventListener('input', function() {
      const saveBtn = this.parentElement.querySelector('.save-limit-btn');
      if (this.value !== this.dataset.originalValue) {
        saveBtn.style.display = 'inline-block';
      } else {
        saveBtn.style.display = 'none';
      }
    });
  });
  // Tallennuspainike popup-rajoituksille
  document.querySelectorAll('.save-limit-btn').forEach(button => {
    button.addEventListener('click', function() {
      const userId = this.dataset.id;
      const input = this.parentElement.querySelector('.popup-limit-input');
      const newLimit = parseInt(input.value);
      onAction('updatePopupLimit', userId, newLimit);
    });
  });

  }
  
  /**
   * Avaa käyttäjän rajoitusten muokkausmodaalin
   */
  static async openLimitsModal(userId, onAction) {
    // Hae käyttäjän nykyiset tiedot
    let user = { limits: {} };
    try {
      const r = await fetch('/api/admin/users');
      const users = await r.json();
      user = users.find(u => u._id === userId) || user;
    } catch (e) {}
    const lim = user.limits || {};

    const PRESETS = {
      free:   { popupLimit:2,   sticky_bar:1,  fab:1,  slide_in:1,  popup:1,  social_proof:1,  scroll_progress:1,  lead_form:0,  canUseTargeting:false, canUseAnalytics:true,  canUseTemplates:true,  canUseAbTest:false, canUseCampaigns:false, canUseWebhooks:false },
      pro:    { popupLimit:20,  sticky_bar:5,  fab:5,  slide_in:5,  popup:5,  social_proof:5,  scroll_progress:5,  lead_form:3,  canUseTargeting:true,  canUseAnalytics:true,  canUseTemplates:true,  canUseAbTest:true,  canUseCampaigns:true,  canUseWebhooks:true  },
      agency: { popupLimit:100, sticky_bar:20, fab:20, slide_in:20, popup:20, social_proof:20, scroll_progress:20, lead_form:10, canUseTargeting:true,  canUseAnalytics:true,  canUseTemplates:true,  canUseAbTest:true,  canUseCampaigns:true,  canUseWebhooks:true  }
    };

    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center';
    modal.innerHTML = `
      <div style="background:#fff;border-radius:12px;padding:28px;width:480px;max-width:96vw;max-height:90vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.2);font-family:system-ui,sans-serif">
        <h3 style="margin:0 0 6px;font-size:17px">Muokkaa rajoituksia</h3>
        <p style="font-size:12px;color:#64748b;margin:0 0 16px">${user.displayName || userId} – ${user.email || ''}</p>
        <div style="display:flex;gap:8px;margin-bottom:18px">
          <button data-preset="free"   style="flex:1;padding:7px;border-radius:7px;border:1.5px solid #e2e8f0;background:#f8fafc;cursor:pointer;font-size:12px;font-weight:600">Free</button>
          <button data-preset="pro"    style="flex:1;padding:7px;border-radius:7px;border:1.5px solid #3b82f6;background:#eff6ff;color:#1d4ed8;cursor:pointer;font-size:12px;font-weight:600">Pro</button>
          <button data-preset="agency" style="flex:1;padding:7px;border-radius:7px;border:1.5px solid #8b5cf6;background:#f5f3ff;color:#6d28d9;cursor:pointer;font-size:12px;font-weight:600">Agency</button>
        </div>
        <div style="margin-bottom:14px">
          <label style="font-size:12px;color:#475569;display:block;margin-bottom:4px;font-weight:600">Max elementtejä yhteensä</label>
          <input type="number" id="lim-popupLimit" min="0" max="9999" value="${user.popupLimit ?? 2}"
            style="width:120px;padding:7px 10px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
          ${['sticky_bar','fab','slide_in','popup','social_proof','scroll_progress','lead_form'].map(t => `
            <div>
              <label style="font-size:12px;color:#475569;display:block;margin-bottom:4px">${t.replace(/_/g,' ')}</label>
              <input type="number" id="lim-${t}" min="0" max="100" value="${lim[t] ?? (t==='lead_form'?0:1)}"
                style="width:100%;padding:7px 10px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box">
            </div>`).join('')}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px">
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
            <input type="checkbox" id="lim-targeting" ${lim.canUseTargeting ? 'checked' : ''}> Targeting
          </label>
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
            <input type="checkbox" id="lim-abtest" ${lim.canUseAbTest ? 'checked' : ''}> A/B-testaus
          </label>
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
            <input type="checkbox" id="lim-campaigns" ${lim.canUseCampaigns ? 'checked' : ''}> Kampanjat
          </label>
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
            <input type="checkbox" id="lim-webhooks" ${lim.canUseWebhooks ? 'checked' : ''}> Webhooks
          </label>
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
            <input type="checkbox" id="lim-analytics" ${lim.canUseAnalytics !== false ? 'checked' : ''}> Analytics
          </label>
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
            <input type="checkbox" id="lim-templates" ${lim.canUseTemplates !== false ? 'checked' : ''}> Templates
          </label>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button id="lim-cancel" style="padding:8px 18px;border:1px solid #e2e8f0;border-radius:7px;background:#fff;cursor:pointer;font-size:13px">Peruuta</button>
          <button id="lim-save"   style="padding:8px 18px;border:none;border-radius:7px;background:#3b82f6;color:#fff;cursor:pointer;font-size:13px;font-weight:600">Tallenna</button>
        </div>
      </div>`;

    document.body.appendChild(modal);

    // Preset-painikkeet
    modal.querySelectorAll('[data-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = PRESETS[btn.dataset.preset];
        ['sticky_bar','fab','slide_in','popup','social_proof','scroll_progress','lead_form'].forEach(t => {
          const el = modal.querySelector('#lim-' + t);
          if (el) el.value = p[t];
        });
        if (p.popupLimit !== undefined) modal.querySelector('#lim-popupLimit').value = p.popupLimit;
        modal.querySelector('#lim-targeting').checked  = p.canUseTargeting;
        modal.querySelector('#lim-analytics').checked  = p.canUseAnalytics;
        modal.querySelector('#lim-templates').checked  = p.canUseTemplates;
        modal.querySelector('#lim-abtest').checked     = p.canUseAbTest;
        modal.querySelector('#lim-campaigns').checked  = p.canUseCampaigns;
        modal.querySelector('#lim-webhooks').checked   = p.canUseWebhooks;
      });
    });

    modal.querySelector('#lim-cancel').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

    modal.querySelector('#lim-save').addEventListener('click', async () => {
      const g = id => modal.querySelector('#' + id);
      const data = {
        popupLimit:      parseInt(g('lim-popupLimit').value) || 2,
        sticky_bar:      parseInt(g('lim-sticky_bar').value) || 0,
        fab:             parseInt(g('lim-fab').value) || 0,
        slide_in:        parseInt(g('lim-slide_in').value) || 0,
        popup:           parseInt(g('lim-popup').value) || 0,
        social_proof:    parseInt(g('lim-social_proof').value) || 0,
        scroll_progress: parseInt(g('lim-scroll_progress').value) || 0,
        lead_form:       parseInt(g('lim-lead_form').value) || 0,
        canUseTargeting: g('lim-targeting').checked,
        canUseAnalytics: g('lim-analytics').checked,
        canUseTemplates: g('lim-templates').checked,
        canUseAbTest:    g('lim-abtest').checked,
        canUseCampaigns: g('lim-campaigns').checked,
        canUseWebhooks:  g('lim-webhooks').checked
      };
      try {
        await onAction('updateLimits', userId, data);
        modal.remove();
      } catch (e) {}
    });
  }

  /**
   * Formatoi päivämäärän luettavaan muotoon
   * @param {string} dateString - Päivämäärä string-muodossa
   * @returns {string} Formatoitu päivämäärä
   */
  static formatDate(dateString) {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fi-FI', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    }).format(date);
  }

  /**
   * Formatoi kellonajan luettavaan muotoon
   * @param {string} dateString - Päivämäärä string-muodossa
   * @returns {string} Formatoitu kellonaika
   */
  static formatTime(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fi-FI', { 
      hour: '2-digit', 
      minute: '2-digit'
    }).format(date);
  }
}

export default UserTable;