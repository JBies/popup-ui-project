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
      li.className = 'popup-item collapsed'; // Aluksi supistettu näkymä
      
      // Luo popup-otsikkorivin, joka näyttää vain nimen ja tärkeimmät tiedot
      const headerHtml = `
        <div class="popup-header">
          <h4 class="popup-name">${popup.name || 'Unnamed Popup'}</h4>
          <div class="popup-type-badge ${popup.popupType}">${popup.popupType}</div>
          <div class="popup-toggle-btn">
            <i class="fas fa-chevron-down"></i>
          </div>
        </div>
      `;
      
      // Luo piilotettava sisältöosio, joka aukeaa kun otsikkoa klikataan
      let detailsHtml = `
        <div class="popup-details" style="display: none;">
          <div class="popup-info">
            <h4>Basic Information</h4>
            <p><strong>Type:</strong> ${popup.popupType}</p>
            <p><strong>Size:</strong> ${popup.width || 200}x${popup.height || 150}px</p>
            <p><strong>Position:</strong> ${popup.position}</p>
            <p><strong>Animation:</strong> ${popup.animation}</p>
            
            <h4>Content</h4>
            <div class="popup-content-preview">${popup.content || 'No text content'}</div>
            
            ${popup.imageUrl ? `
              <div class="popup-image-preview">
                <p><strong>Image:</strong></p>
                <img src="${popup.imageUrl}" alt="Popup image" style="max-width: 200px; max-height: 150px;">
              </div>
            ` : ''}
            
            ${popup.linkUrl ? `
              <p><strong>Link URL:</strong> <a href="${popup.linkUrl}" target="_blank">${popup.linkUrl}</a></p>
            ` : ''}
            
            <h4>Timing</h4>
            <p><strong>Delay:</strong> ${popup.timing?.delay || 0} seconds</p>
            <p><strong>Duration:</strong> ${popup.timing?.showDuration ? popup.timing.showDuration + ' seconds' : 'Until closed'}</p>
            ${popup.timing?.startDate && popup.timing.startDate !== 'default' ? `
              <p><strong>Start Date:</strong> ${new Date(popup.timing.startDate).toLocaleString()}</p>
            ` : ''}
            ${popup.timing?.endDate && popup.timing.endDate !== 'default' ? `
              <p><strong>End Date:</strong> ${new Date(popup.timing.endDate).toLocaleString()}</p>
            ` : ''}
          </div>
          
          <!-- Tilastot-osio -->
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
          
          <!-- Embed-koodi-osio -->
          <div class="embed-code">
            <h4>Embed Code</h4>
            <textarea readonly class="embed-code-text" onclick="this.select()">
<script src="${window.location.origin}/popup-embed.js"></script>
<script>
  window.addEventListener('load', function() {
    ShowPopup('${popup._id}');
  });
</script>
            </textarea>
          </div>
          
          <!-- Toimintopainikkeet -->
          <div class="popup-actions">
            <button class="edit-popup-btn" data-id="${popup._id}">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="delete-popup-btn" data-id="${popup._id}">
              <i class="fas fa-trash"></i> Delete
            </button>
            <button class="preview-popup-btn" data-id="${popup._id}">
              <i class="fas fa-eye"></i> Preview
            </button>
          </div>
        </div>
      `;
      
      // Yhdistä kaikki HTML
      li.innerHTML = headerHtml + detailsHtml;
      popupList.appendChild(li);
      
      // Lisää tapahtumakuuntelijat
      
      // 1. Otsikon klikkaus avaa/sulkee yksityiskohdat
      const popupHeader = li.querySelector('.popup-header');
      const popupDetails = li.querySelector('.popup-details');
      const toggleIcon = li.querySelector('.popup-toggle-btn i');
      
      if (popupHeader && popupDetails) {
        popupHeader.addEventListener('click', () => {
          const isCollapsed = li.classList.contains('collapsed');
          
          // Vaihda näkyvyys
          popupDetails.style.display = isCollapsed ? 'block' : 'none';
          toggleIcon.className = isCollapsed ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
          li.classList.toggle('collapsed');
          
          // Jos avattiin, lataa tilastot
          if (isCollapsed) {
            this.loadPopupStats(popup._id);
          }
        });
      }
      
      // 2. Toimintopainikkeet
      const editButton = li.querySelector('.edit-popup-btn');
      if (editButton) {
        editButton.addEventListener('click', (e) => {
          e.stopPropagation(); // Estä klikkauksen leviäminen
          this.editPopup(popup._id, popup);
        });
      }
      
      const deleteButton = li.querySelector('.delete-popup-btn');
      if (deleteButton) {
        deleteButton.addEventListener('click', (e) => {
          e.stopPropagation(); // Estä klikkauksen leviäminen
          this.deletePopup(popup._id);
        });
      }
      
      // 3. Preview-painike
      const previewButton = li.querySelector('.preview-popup-btn');
      if (previewButton) {
        previewButton.addEventListener('click', (e) => {
          e.stopPropagation(); // Estä klikkauksen leviäminen
          this.previewPopup(popup);
        });
      }
    });
  }

   /**
   * Näyttää popupin esikatselun
   * @param {Object} popup - Popupin tiedot
   */
   previewPopup(popup) {
    // Tämä on yksinkertainen esikatselutoteutus, joka näyttää popupin suoraan sivulla
    // Oikeassa toteutuksessa voisi näyttää sen modalissa tai iframe:ssa
    
    // Luo overlay
    const overlay = document.createElement('div');
    overlay.className = 'preview-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    
    // Luo popup-elementti
    const previewPopup = document.createElement('div');
    previewPopup.style.width = `${popup.width || 200}px`;
    previewPopup.style.height = `${popup.height || 150}px`;
    previewPopup.style.backgroundColor = popup.backgroundColor || '#ffffff';
    previewPopup.style.color = popup.textColor || '#000000';
    previewPopup.style.borderRadius = popup.popupType === 'circle' ? '50%' : '4px';
    previewPopup.style.padding = '20px';
    previewPopup.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
    previewPopup.style.position = 'relative';
    previewPopup.style.overflow = 'auto';
    previewPopup.style.display = 'flex';
    previewPopup.style.flexDirection = 'column';
    previewPopup.style.alignItems = 'center';
    previewPopup.style.justifyContent = 'center';
    
    // Lisää sisältö
    if (popup.content) {
      previewPopup.innerHTML = popup.content;
    }
    
    // Lisää kuva, jos sellainen on
    if (popup.imageUrl) {
      const img = document.createElement('img');
      img.src = popup.imageUrl;
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      img.style.objectFit = 'contain';
      previewPopup.appendChild(img);
    }
    
    // Lisää sulkunappi
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = 'Close Preview';
    closeBtn.style.position = 'absolute';
    closeBtn.style.bottom = '-40px';
    closeBtn.style.padding = '8px 16px';
    closeBtn.style.backgroundColor = '#3498db';
    closeBtn.style.color = 'white';
    closeBtn.style.border = 'none';
    closeBtn.style.borderRadius = '4px';
    closeBtn.style.cursor = 'pointer';
    
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });
    
    // Lisää elementit sivulle
    overlay.appendChild(previewPopup);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);
    
    // Sulje esikatselu kun klikataan popupin ulkopuolelle
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
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