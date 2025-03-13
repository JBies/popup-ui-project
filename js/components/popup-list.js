// js/components/popup-list.js
// Popupien listauksen ja halllinnan toiminnallisuudet

import API from '../utils/api.js';
import PopupForm from './popup-form.js';

/**
 * PopupList-luokka vastaa popupien listaamisesta ja hallinnasta
 */
class PopupList {
  constructor() {
    this.init();
  }

  /**
   * Alustaa popupien listauksen
   */
  init() {
    // Haetaan popupit heti kun komponentti ladataan
    this.fetchUserPopups();
  }

  /**
   * Hakee käyttäjän popupit ja näyttää ne listassa
   */
  async fetchUserPopups() {
    try {
      const popups = await API.getUserPopups();
      this.renderPopupList(popups);
    } catch (error) {
      console.error('Error fetching popups:', error);
      const popupList = document.getElementById('popups');
      if (popupList) {
        popupList.innerHTML = '<p>Virhe popupien lataamisessa</p>';
      }
    }
  }

  /**
   * Renderöi popup-listan
   * @param {Array} popups - Lista popup-objekteista
   */
  renderPopupList(popups) {
    const popupList = document.getElementById('popups');
    if (!popupList) return;
    
    popupList.innerHTML = '';
    
    popups.forEach(popup => {
      const li = document.createElement('li');
      li.className = 'popup-item';
      
      // Popupin perustiedot
      let popupHtml = `
        <div class="popup-info">
          <p><strong>Type:</strong> ${popup.popupType}</p>
          <p><strong>Content:</strong> ${popup.content}</p>
          <p><strong>Size:</strong> ${popup.width || 200}x${popup.height || 150}px</p>
      `;
      
      // Lisää linkki-tieto, jos sellainen on määritetty
      if (popup.linkUrl) {
        popupHtml += `<p><strong>Link URL:</strong> <a href="${popup.linkUrl}" target="_blank">${popup.linkUrl}</a></p>`;
      }
      
      // Tilastot-osio
      popupHtml += `
        <div class="popup-stats">
          <h4>Statistics</h4>
          <div class="stats-loading" id="stats-loading-${popup._id}">Loading statistics...</div>
          <div class="stats-content" id="stats-content-${popup._id}" style="display:none;">
            <p>Views: <span id="views-${popup._id}">-</span></p>
            <p>Clicks: <span id="clicks-${popup._id}">-</span></p>
            <p>Click rate: <span id="ctr-${popup._id}">-</span>%</p>
            <p>Last viewed: <span id="last-viewed-${popup._id}">-</span></p>
            <p>Last clicked: <span id="last-clicked-${popup._id}">-</span></p>
          </div>
        </div>
      `;
      
      // Embed-koodi-osio
      popupHtml += `
        <div class="embed-code">
          <p><strong>Embed Code:</strong></p>
          <textarea readonly class="embed-code-text" onclick="this.select()">
<script src="${window.location.origin}/popup-embed.js"></script>
<script>
  window.addEventListener('load', function() {
    ShowPopup('${popup._id}');
  });
</script>
          </textarea>
        </div>
        <div class="popup-actions">
          <button class="edit-popup-btn" data-id="${popup._id}">Edit</button>
          <button class="delete-popup-btn" data-id="${popup._id}">Delete</button>
        </div>
      </div>`;
      
      li.innerHTML = popupHtml;
      popupList.appendChild(li);
      
      // Lisää tapahtumakuuntelijat toimintopainikkeille
      const editButton = li.querySelector('.edit-popup-btn');
      if (editButton) {
        editButton.addEventListener('click', () => this.editPopup(popup._id, popup));
      }
      
      const deleteButton = li.querySelector('.delete-popup-btn');
      if (deleteButton) {
        deleteButton.addEventListener('click', () => this.deletePopup(popup._id));
      }
      
      // Lataa tilastot tälle popupille
      this.loadPopupStats(popup._id);
    });
  }

  /**
   * Lataa ja näyttää popupin tilastot
   * @param {string} popupId - Popupin ID
   */
  async loadPopupStats(popupId) {
    try {
      const stats = await API.getPopupStats(popupId);
      
      // Näytä tilastot
      document.getElementById(`views-${popupId}`).textContent = stats.views;
      document.getElementById(`clicks-${popupId}`).textContent = stats.clicks;
      document.getElementById(`ctr-${popupId}`).textContent = stats.clickThroughRate;
      
      // Muotoile päivämäärät
      const lastViewed = stats.lastViewed 
        ? new Date(stats.lastViewed).toLocaleString() 
        : 'Never';
      const lastClicked = stats.lastClicked 
        ? new Date(stats.lastClicked).toLocaleString() 
        : 'Never';
      
      document.getElementById(`last-viewed-${popupId}`).textContent = lastViewed;
      document.getElementById(`last-clicked-${popupId}`).textContent = lastClicked;
      
      // Näytä tilastot ja piilota latausviesti
      document.getElementById(`stats-loading-${popupId}`).style.display = 'none';
      document.getElementById(`stats-content-${popupId}`).style.display = 'block';
    } catch (error) {
      console.error(`Error loading stats for popup ${popupId}:`, error);
      const loadingElement = document.getElementById(`stats-loading-${popupId}`);
      if (loadingElement) {
        loadingElement.textContent = 'Error loading statistics. Please try again later.';
      }
    }
  }

  /**
   * Näyttää popupin muokkauslomakkeen
   * @param {string} id - Popupin ID
   * @param {Object} popup - Popupin tiedot
   */
  editPopup(id, popup) {
    // Käytä PopupForm-komponentin staattista metodia
    PopupForm.editPopup(id, popup);
  }

  /**
   * Poistaa popupin
   * @param {string} id - Popupin ID
   */
  async deletePopup(id) {
    if (confirm('Are you sure you want to delete this popup?')) {
      try {
        const result = await API.deletePopup(id);
        if (result.message) {
          alert(result.message);
          await this.fetchUserPopups(); // Päivitä lista
        }
      } catch (error) {
        console.error('Error deleting popup:', error);
        alert('Failed to delete popup');
      }
    }
  }
}

export default PopupList;