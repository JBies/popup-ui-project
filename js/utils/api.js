// js/utils/api.js
// Keskitetyt API-kutsut, jotka helpottavat backendin kanssa kommunikointia

/**
 * API-luokka joka kapseloi kaikki fetchit palvelimelle
 */
class API {
    /**
     * Hakee kirjautuneen käyttäjän tiedot
     * @returns {Promise<Object>} Käyttäjän tiedot tai null jos ei kirjautunut
     */
    static async getCurrentUser() {
      const response = await fetch('/api/user', {
        credentials: 'include'
      });
      const data = await response.json();
      return data.user;
    }
        /**
     * Hakee kaikki käyttäjän popupit
     * @returns {Promise<Array>} Lista käyttäjän popupeista
     */
    static async getUserPopups() {
      const response = await fetch('/api/popups', {
        credentials: 'include'
      });
      return await response.json();
    }
  
    /**
     * Luo uuden popupin
     * @param {Object} popupData - Popupin tiedot
     * @returns {Promise<Object>} Luotu popup
     */
    static async createPopup(popupData) {
      const response = await fetch('/api/popups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(popupData)
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create popup');
      }
  
      return await response.json();
    }
  
    /**
     * Päivittää olemassa olevaa popupia
     * @param {string} id - Popupin ID
     * @param {Object} popupData - Päivitetyt tiedot
     * @returns {Promise<Object>} Päivitetty popup
     */
    static async updatePopup(id, popupData) {
      const response = await fetch(`/api/popups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(popupData)
      });
  
      if (!response.ok) {
        throw new Error('Failed to update popup');
      }
  
      return await response.json();
    }
  
    /**
     * Poistaa popupin
     * @param {string} id - Popupin ID
     * @returns {Promise<Object>} Poiston tulos
     */
    static async deletePopup(id) {
      const response = await fetch(`/api/popups/${id}`, { method: 'DELETE' });
      return await response.json();
    }
  
    /**
     * Lataa kuvan palvelimelle
     * @param {File} file - Ladattava kuvatiedosto
     * @returns {Promise<Object>} Ladatun kuvan tiedot
     */
    static async uploadImage(file) {
      console.log("API.uploadImage kutsu tiedostolle:", file.name);
      const formData = new FormData();
      formData.append('image', file);
      console.log("Uploading file:", file.name, "size:", file.size);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
  
      if (!response.ok) {
        throw new Error('Image upload failed with status: ' + response.status);
      }
  
      return await response.json();
    }
  
    /**
     * Hakee käyttäjän kaikki kuvat kuvakirjastoon
     * @returns {Promise<Array>} Lista käyttäjän kuvista
     */
    static async getUserImages() {
      try {
        const response = await fetch('/api/images', {
          credentials: 'include' // Varmistetaan, että evästeet lähetetään
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Kirjautuminen on vanhentunut. Kirjaudu sisään uudelleen.');
          } else if (response.status === 403) {
            throw new Error('Käyttäjätilisi odottaa hyväksyntää tai sinulla ei ole oikeuksia.');
          } else {
            throw new Error(`Virhe kuvien hakemisessa: ${response.status}`);
          }
        }
        
        const data = await response.json();
        return Array.isArray(data) ? data : []; // Varmistetaan, että palautetaan aina taulukko
      } catch (error) {
        console.error('Error fetching images:', error);
        throw error; // Heitetään virhe eteenpäin, jotta se voidaan käsitellä kutsujassa
      }
    }

    /**
   * Hakee yksittäisen kuvan tiedot
   * @param {string} imageId - Kuvan ID
   * @returns {Promise<Object>} Kuvan tiedot ja tieto missä popupeissa käytetään
   */
  static async getImageDetails(imageId) {
    try {
      const response = await fetch(`/api/images/${imageId}`, {
        credentials: 'include'  // Varmista, että evästeet lähetetään
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Et ole kirjautunut sisään tai sessiosi on vanhentunut');
        }
        throw new Error(`Virhe kuvan tietojen haussa: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching image details:', error);
      throw error;
    }
  }
  
    /**
     * Poistaa kuvan
     * @param {string} imageId - Kuvan ID
     * @returns {Promise<Object>} Poiston tulos
     */
    static async deleteImage(imageId) {
      const response = await fetch(`/api/images/${imageId}`, {
        method: 'DELETE'
      });
      return await response.json();
    }
  
    /**
     * Hakee popupin tilastot
     * @param {string} popupId - Popupin ID
     * @returns {Promise<Object>} Tilastotiedot
     */
    static async getPopupStats(popupId) {
      const response = await fetch(`/api/popups/stats/${popupId}`, {
        method: 'GET',
        credentials: 'include',  // Lisää credentials, jotta evästeet lähetetään
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Et ole kirjautunut sisään tai sessiosi on vanhentunut');
        }
        throw new Error(`Virhe tilastojen haussa: ${response.status}`);
      }
      
      return await response.json();
    }
  
    /**
     * Kirjautuu ulos sovelluksesta
     * @returns {Promise<void>}
     */
    static async logout() {
      await fetch('/auth/logout', { method: 'POST' });
    }
  }
  
  export default API;