// admin-users.js

import UserTable from './js/admin/user-table.js';
import UserFilter from './js/admin/user-filter.js';
import UserActions from './js/admin/user-actions.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('/api/admin/users');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const users = await response.json();

    // Järjestetään käyttäjät: ensin odottavat, sitten muut
    users.sort((a, b) => {
      // Asetetaan pending-käyttäjät ensimmäiseksi
      if (a.role === 'pending' && b.role !== 'pending') return -1;
      if (a.role !== 'pending' && b.role === 'pending') return 1;
      
      // Sitten vertaillaan rekisteröitymispäivää (uusimmat ensin)
      return new Date(b.registeredAt) - new Date(a.registeredAt);
    });

    // Alusta filtterit
    UserFilter.initFilters(users, filteredUsers => {
      // Renderöi käyttäjätaulukko kun filtteri muuttuu
      UserTable.renderUserTable(filteredUsers, handleUserAction);
    });
    
    // Näytetään aluksi kaikki käyttäjät
    UserTable.renderUserTable(users, handleUserAction);
    
    // Käsittele käyttäjätoiminnot
    async function handleUserAction(action, userId, data) {
      try {
        switch (action) {
          case 'approve':
          case 'updateRole':
            await UserActions.updateUserRole(userId, data);
            break;
          case 'delete':
            await UserActions.deleteUser(userId);
            break;
        }
        // Päivitä sivu toiminnon jälkeen
        window.location.reload();
      } catch (error) {
        console.error(`Error handling user action ${action}:`, error);
      }
    }
  } catch (err) {
    console.error('Error fetching users:', err);
    document.getElementById('usersTable').innerHTML = 
      '<tr><td colspan="6" class="error-message">Error loading users. Please try again later.</td></tr>';
  }
});