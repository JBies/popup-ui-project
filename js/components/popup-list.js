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
    popupList.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
    
    popups.forEach(popup => {
      // Luodaan korttipohjainen layout
      const li = document.createElement('li');
      li.className = 'bg-gray-800 dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden h-auto'; // Muutettiin kortin väri ja korkeus
      
      // Luodaan otsikko+infot
      const card = document.createElement('div');
      card.className = 'h-full flex flex-col';
      
      // Popupin kuva tai esikatselualue
      const previewArea = document.createElement('div');
      previewArea.className = 'h-32 relative'; // Rajattu korkeus ylhäällä olevalle esikatselulle
      
      // Jos on kuva, näytetään se, muutoin näytetään esikatselualue
      if (popup.imageUrl) {
        previewArea.style.backgroundImage = `url(${popup.imageUrl})`;
        previewArea.style.backgroundSize = 'cover';
        previewArea.style.backgroundPosition = 'center';
      } else {
        previewArea.style.backgroundColor = popup.backgroundColor || '#ffffff';
        
        // Pieni esikatselu popupin sisällöstä
        if (popup.content) {
          const contentPreview = document.createElement('div');
          contentPreview.className = 'absolute inset-0 p-2 flex items-center justify-center text-sm overflow-hidden text-center';
          contentPreview.style.color = popup.textColor || '#000000';
          contentPreview.innerHTML = popup.content.length > 100 ? popup.content.substring(0, 100) + '...' : popup.content;
          previewArea.appendChild(contentPreview);
        }
      }
      
      // Popupin otsikko + tyyppi
      const titleBar = document.createElement('div');
      titleBar.className = 'bg-gray-700 dark:bg-gray-700 p-3 border-b border-gray-600';
      titleBar.innerHTML = `
        <div class="flex justify-between items-center">
          <h3 class="text-white font-medium truncate">${popup.name || 'Nimetön Popup'}</h3>
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            popup.popupType === 'image' ? 'bg-green-100 text-green-800' : 
            popup.popupType === 'circle' ? 'bg-blue-100 text-blue-800' : 
            'bg-primary-100 text-primary-800'
          } ml-2">${popup.popupType}</span>
        </div>
      `;
      
      // Toimintopainikkeet
      const actions = document.createElement('div');
      actions.className = 'p-3 bg-gray-700 dark:bg-gray-700 flex justify-between items-center mt-auto border-t border-gray-600';
      actions.innerHTML = `
        <div>
          <button class="details-btn text-gray-300 hover:text-white" title="Näytä tiedot">
            <i class="fas fa-info-circle"></i>
          </button>
          <button class="preview-btn text-gray-300 hover:text-white ml-2" title="Esikatsele">
            <i class="fas fa-eye"></i>
          </button>
        </div>
        <div>
          <button class="edit-btn bg-primary-600 hover:bg-primary-700 text-white py-1 px-3 rounded-md text-sm">
            Muokkaa
          </button>
        </div>
      `;
      
      // Kootaan kortti
      card.appendChild(previewArea);
      card.appendChild(titleBar);
      card.appendChild(actions);
      li.appendChild(card);
      popupList.appendChild(li);
/*      
      // Tapahtumakuuntelijat
      const detailsBtn = li.querySelector('.details-btn');
      if (detailsBtn) {
        detailsBtn.addEventListener('click', () => {
          // Näytä tiedot modaalissa
          this.showPopupDetails(popup);
        });
      }
      */

      const detailsBtn = li.querySelector('.details-btn');
      if (detailsBtn) {
        detailsBtn.addEventListener('click', (event) => {
          // Estä tapahtuman oletustoiminto (lomakkeen lähetys)
          event.preventDefault();
          event.stopPropagation();
          
          // Kutsu tietojen näyttämisfunktiota
          this.showPopupDetails(popup);
        });
      }

      const previewBtn = li.querySelector('.preview-btn');
      if (previewBtn) {
        previewBtn.addEventListener('click', (event) => {
          // Estä tapahtuman oletustoiminto (lomakkeen lähetys)
          event.preventDefault();
          event.stopPropagation();
          
          // Kutsu esikatselunäyttämisfunktiota
          this.previewPopup(popup);
        });
      }

      
      const editBtn = li.querySelector('.edit-btn');
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          // estä tapahtuman oletustoiminto (lomakkeen lähetys)
          event.preventDefault();
          event.stopPropagation();
          // Kutsu muokkausfunktiota
          this.editPopup(popup._id, popup);
        });
      }
    });
  }
  
  /**
   * Näyttää popupin tiedot modaalissa
   * @param {Object} popup - Popupin tiedot
   */
  showPopupDetails(popup) {
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
    this.loadPopupStatsToModal(popup._id);
    
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
  async loadPopupStatsToModal(popupId) {
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

   /**
   * Näyttää popupin esikatselun
   * @param {Object} popup - Popupin tiedot
   */
   previewPopup(popup) {
    console.log("Previewing popup:", popup); // Debugging
  
    // Luo overlay
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
    
    // Luo popup-elementin container (helpottaa sijoittelua)
    const previewContainer = document.createElement('div');
    previewContainer.className = 'relative';
    
    // Luo popup-elementti
    const previewPopup = document.createElement('div');
    previewPopup.style.width = `${popup.width || 200}px`;
    previewPopup.style.height = `${popup.height || 150}px`;
    
    // Käsittele eri popup-tyypit
    if (popup.popupType === 'image' && popup.imageUrl) {
      // Kuva-popup
      previewPopup.className = 'bg-center bg-no-repeat bg-contain';
      previewPopup.style.backgroundImage = `url(${popup.imageUrl})`;
    } else {
      // Normaali popup
      previewPopup.className = `${popup.popupType === 'circle' ? 'rounded-full' : 'rounded-lg'} shadow-lg flex flex-col items-center justify-center overflow-auto`;
      previewPopup.style.backgroundColor = popup.backgroundColor || '#ffffff';
      previewPopup.style.color = popup.textColor || '#000000';
      
      // Lisää sisältö
      if (popup.content) {
        previewPopup.innerHTML = popup.content;
      }
      
      // Lisää kuva, jos sellainen on määritetty
      if (popup.imageUrl) {
        const img = document.createElement('img');
        img.src = popup.imageUrl;
        img.className = 'max-w-full max-h-full object-contain mt-2';
        previewPopup.appendChild(img);
      }
    }
    
    // Lisää popupin asettelua varten oikea positiointi
    switch (popup.position) {
      case 'top-left':
        previewContainer.className += ' absolute top-16 left-16';
        break;
      case 'top-right':
        previewContainer.className += ' absolute top-16 right-16';
        break;
      case 'bottom-left':
        previewContainer.className += ' absolute bottom-16 left-16';
        break;
      case 'bottom-right':
        previewContainer.className += ' absolute bottom-16 right-16';
        break;
      default: // center
        previewContainer.className += ' flex items-center justify-center';
    }
    
    // Lisää sulkupainike
    const closeBtn = document.createElement('button');
    closeBtn.className = 'absolute -top-10 right-0 bg-white dark:bg-dark-800 text-dark-800 dark:text-white px-4 py-2 rounded-md shadow-md hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors';
    closeBtn.textContent = 'Sulje esikatselu';
    
    // Lisää INFO-teksti
    const infoText = document.createElement('div');
    infoText.className = 'absolute -top-10 left-0 text-white text-sm';
    infoText.textContent = 'Esikatselutila';
    
    // Kokoa kaikki elementit
    previewContainer.appendChild(previewPopup);
    previewContainer.appendChild(closeBtn);
    previewContainer.appendChild(infoText);
    overlay.appendChild(previewContainer);
    document.body.appendChild(overlay);
    
    // Lisää sulkutoiminnot
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });
    
    // Animoi popup sisään
    if (popup.animation === 'fade') {
      previewPopup.style.opacity = '0';
      previewPopup.style.transition = 'opacity 0.5s';
      setTimeout(() => {
        previewPopup.style.opacity = '1';
      }, 10);
    } else if (popup.animation === 'slide') {
      previewPopup.style.transform = 'translateY(-50px)';
      previewPopup.style.transition = 'transform 0.5s';
      setTimeout(() => {
        previewPopup.style.transform = 'translateY(0)';
      }, 10);
    }
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
      
      // Näytä tilastot ja piilota latausviesti
      document.getElementById(`stats-loading-${popupId}`).style.display = 'none';
      
      // Päivitä tilastosisältö oikein
      const statsContent = document.getElementById(`stats-content-${popupId}`);
      if (statsContent) {
        // Näytä elementti
        statsContent.classList.remove('hidden');
        
        // Lisää viimeisimmät tiedot
        const timeInfo = document.createElement('div');
        timeInfo.className = 'mt-2 pt-2 border-t border-gray-200 dark:border-dark-600 grid grid-cols-2 gap-y-1 text-sm';
        timeInfo.innerHTML = `
          <div class="text-dark-500 dark:text-dark-400">Last viewed:</div>
          <div class="text-dark-800 dark:text-white">${lastViewed}</div>
          
          <div class="text-dark-500 dark:text-dark-400">Last clicked:</div>
          <div class="text-dark-800 dark:text-white">${lastClicked}</div>
        `;
        
        statsContent.appendChild(timeInfo);
      }
    } catch (error) {
      console.error(`Error loading stats for popup ${popupId}:`, error);
      const loadingElement = document.getElementById(`stats-loading-${popupId}`);
      if (loadingElement) {
        loadingElement.textContent = 'Error loading statistics. Please try again later.';
        loadingElement.classList.add('text-red-500', 'dark:text-red-400');
      }
    }
  }

  /**
   * Näyttää popupin muokkauslomakkeen
   * @param {string} id - Popupin ID
   * @param {Object} popup - Popupin tiedot
   */
  editPopup(id, popup) {
    // Kutsu PopupForm-komponentin editPopup-metodia
    PopupForm.editPopup(id, popup);
    
    // Vieritä sivu pehmeästi muokkauslomakkeeseen
    const editForm = document.getElementById('editPopupForm');
    if (editForm) {
      // Pieni viive varmistaa, että lomake on ehtinyt tulla näkyviin
      setTimeout(() => {
        editForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
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