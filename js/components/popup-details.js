// js/components/popup-details.js
// Moduuli, joka vastaa popup-tietojen näyttämisestä modaalissa

import API from '../utils/api.js';

/**
 * PopupDetails-luokka vastaa popupin tietojen näyttämisestä modaalissa
 */
class PopupDetails {
  /**
   * Näyttää popupin tiedot modaalissa
   * @param {Object} popup - Popupin tiedot
   */
  static showPopupDetails(popup) {
    console.log("Showing popup details for:", popup);
    
    // Luodaan modaali-overlay
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
    
    // Luodaan modaalin sisältö
    const modal = document.createElement('div');
    modal.className = 'bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto';
    
    // Otsikko + sulkunappi
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700';
    header.innerHTML = `
      <h2 class="text-xl font-bold text-gray-900 dark:text-white">${popup.name || 'Nimetön Popup'}</h2>
      <button class="close-btn text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
        <i class="fas fa-times text-xl"></i>
      </button>
    `;
    
    // Tietosisältö
    const content = document.createElement('div');
    content.className = 'p-4';
    
    // Perustiedot
    let detailsHtml = `
      <div class="mb-4">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Perustiedot</h3>
        <div class="grid grid-cols-2 gap-2">
          <div class="text-gray-600 dark:text-gray-400">Tyyppi:</div>
          <div class="text-gray-900 dark:text-white">${popup.popupType}</div>
          
          <div class="text-gray-600 dark:text-gray-400">Koko:</div>
          <div class="text-gray-900 dark:text-white">${popup.width || 200}x${popup.height || 150}px</div>
          
          <div class="text-gray-600 dark:text-gray-400">Sijainti:</div>
          <div class="text-gray-900 dark:text-white">${popup.position}</div>
          
          <div class="text-gray-600 dark:text-gray-400">Animaatio:</div>
          <div class="text-gray-900 dark:text-white">${popup.animation || 'Ei animaatiota'}</div>
        </div>
      </div>
    `;
    
    // Sisältö ja kuva
    if (popup.content || popup.imageUrl) {
      detailsHtml += `<div class="mb-4">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Sisältö</h3>
      `;
      
      if (popup.content) {
        detailsHtml += `
          <div class="mb-2">
            <div class="p-3 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
              ${popup.content}
            </div>
          </div>
        `;
      }
      
      if (popup.imageUrl) {
        detailsHtml += `
          <div class="mt-2">
            <img src="${popup.imageUrl}" alt="Popup kuva" class="max-h-48 mx-auto rounded border border-gray-200 dark:border-gray-600">
          </div>
        `;
      }
      
      detailsHtml += `</div>`;
    }
    
    // Ajastusasetukset
    detailsHtml += `
      <div class="mb-4">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Ajastus</h3>
        <div class="grid grid-cols-2 gap-2">
          <div class="text-gray-600 dark:text-gray-400">Viive:</div>
          <div class="text-gray-900 dark:text-white">${popup.timing?.delay || 0} sekuntia</div>
          
          <div class="text-gray-600 dark:text-gray-400">Kesto:</div>
          <div class="text-gray-900 dark:text-white">${popup.timing?.showDuration ? popup.timing.showDuration + ' sekuntia' : 'Kunnes suljetaan'}</div>
        </div>
      </div>
    `;
    
    // Tilastot
    detailsHtml += `
      <div class="mb-4">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Tilastot</h3>
        <div id="details-stats-${popup._id}" class="p-3 bg-gray-100 dark:bg-gray-700 rounded">
          <p class="text-center text-gray-500 dark:text-gray-400">Ladataan tilastoja...</p>
        </div>
      </div>
    `;
    
    // Upotuskoodi
    detailsHtml += `
      <div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Upotuskoodi</h3>
        <textarea readonly class="w-full p-2 text-xs font-mono bg-gray-100 dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 rounded h-24" onclick="this.select()">
<script src="${window.location.origin}/popup-embed.js" class="popup-embed dark:text-white"></script>
<script>
  window.addEventListener('load', function() {
    ShowPopup('${popup._id}');
  });
</script>
        </textarea>
      </div>
    `;
    
    content.innerHTML = detailsHtml;
    
    // Kokoa modaali
    modal.appendChild(header);
    modal.appendChild(content);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Lataa tilastot modaaliin
    this.loadPopupStats(popup._id);
    
    // Sulje-napin toiminto
    const closeBtn = modal.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        document.body.removeChild(overlay);
      });
    }
    
    // Sulje klikkaamalla taustaa
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });
  }
  
  /**
   * Lataa popupin tilastot modaalinäkymään
   * @param {string} popupId - Popupin ID
   */
  static async loadPopupStats(popupId) {
    try {
      const stats = await API.getPopupStats(popupId);
      
      // Muotoile päivämäärät
      const lastViewed = stats.lastViewed 
        ? new Date(stats.lastViewed).toLocaleString() 
        : 'Ei koskaan';
      const lastClicked = stats.lastClicked 
        ? new Date(stats.lastClicked).toLocaleString() 
        : 'Ei koskaan';
      
      // Päivitä tilastot modaalissa
      const statsContainer = document.getElementById(`details-stats-${popupId}`);
      if (statsContainer) {
        statsContainer.innerHTML = `
          <div class="grid grid-cols-2 gap-2">
            <div class="text-gray-600 dark:text-gray-400">Näyttökerrat:</div>
            <div class="text-gray-900 dark:text-white">${stats.views}</div>
            
            <div class="text-gray-600 dark:text-gray-400">Klikkaukset:</div>
            <div class="text-gray-900 dark:text-white">${stats.clicks}</div>
            
            <div class="text-gray-600 dark:text-gray-400">Klikkausprosentti:</div>
            <div class="text-gray-900 dark:text-white">${stats.clickThroughRate}%</div>
            
            <div class="text-gray-600 dark:text-gray-400">Viimeksi näytetty:</div>
            <div class="text-gray-900 dark:text-white">${lastViewed}</div>
            
            <div class="text-gray-600 dark:text-gray-400">Viimeksi klikattu:</div>
            <div class="text-gray-900 dark:text-white">${lastClicked}</div>
          </div>
        `;
      }
    } catch (error) {
      console.error(`Error loading stats for popup ${popupId}:`, error);
      const statsContainer = document.getElementById(`details-stats-${popupId}`);
      if (statsContainer) {
        statsContainer.innerHTML = `
          <p class="text-center text-red-500">Virhe tilastojen lataamisessa</p>
        `;
      }
    }
  }
}

export default PopupDetails;