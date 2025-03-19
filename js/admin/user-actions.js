// js/admin/user-actions.js

/**
 * UserActions-luokka vastaa käyttäjiin liittyvistä toiminnoista
 */
class UserActions {
    /**
     * Päivittää käyttäjän roolin
     * @param {string} userId - Käyttäjän ID
     * @param {string} role - Uusi rooli
     * @returns {Promise<Object>} API-vastaus
     */
    static async updateUserRole(userId, role) {
      try {
        const response = await fetch(`/api/admin/users/update-role/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role })
        });
        
        const result = await response.json();
        
        if (response.ok) {
          this.showNotification(`Rooli päivitetty: ${result.user.displayName} on nyt ${role}`, 'success');
          return result;
        } else {
          throw new Error(result.message || 'Error updating role');
        }
      } catch (error) {
        console.error('Error updating role:', error);
        this.showNotification('Virhe roolin päivityksessä: ' + error.message, 'error');
        throw error;
      }
    }
  
    /**
     * Poistaa käyttäjän
     * @param {string} userId - Käyttäjän ID
     * @returns {Promise<Object>} API-vastaus
     */
    static async deleteUser(userId) {
      try {
        const response = await fetch(`/api/admin/users/delete/${userId}`, { 
          method: 'POST' 
        });
        
        if (response.ok) {
          this.showNotification('Käyttäjä poistettu onnistuneesti', 'success');
          return { success: true };
        } else {
          const result = await response.json();
          throw new Error(result.message || 'Error deleting user');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        this.showNotification('Virhe käyttäjän poistossa: ' + error.message, 'error');
        throw error;
      }
    }
    
    /**
     * Näyttää ilmoituksen käyttäjälle
     * @param {string} message - Ilmoituksen viesti
     * @param {string} type - Ilmoituksen tyyppi (success/error)
     */
    static showNotification(message, type = 'info') {
      // Tarkistetaan onko notifikaatio-elementti jo olemassa
      let notification = document.getElementById('notification');
      
      if (!notification) {
        // Luodaan uusi notifikaatio-elementti
        notification = document.createElement('div');
        notification.id = 'notification';
        document.body.appendChild(notification);
      }
      
      // Asetetaan tyyli ja viesti
      notification.className = `notification ${type}`;
      notification.innerHTML = `
        <div class="notification-content">
          <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
          <span>${message}</span>
        </div>
      `;
      
      // Näytetään notifikaatio
      notification.classList.add('show');
      
      // Piilotetaan notifikaatio 3 sekunnin kuluttua
      setTimeout(() => {
        notification.classList.remove('show');
      }, 3000);
    }
    /**
   * Päivittää käyttäjän popup-limiitin
   * @param {string} userId - Käyttäjän ID
   * @param {number} limit - Uusi rajoitus
   * @returns {Promise<Object>} API-vastaus
   */
  static async updatePopupLimit(userId, limit) {
    try {
      const response = await fetch(`/api/admin/users/update-limit/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ popupLimit: limit })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        this.showNotification(`Popup-rajoitus päivitetty: ${limit} kpl`, 'success');
        return result;
      } else {
        throw new Error(result.message || 'Error updating popup limit');
      }
    } catch (error) {
      console.error('Error updating popup limit:', error);
      this.showNotification('Virhe popup-rajoituksen päivityksessä: ' + error.message, 'error');
      throw error;
    }

  }
}
  
  export default UserActions;