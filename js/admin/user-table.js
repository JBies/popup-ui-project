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