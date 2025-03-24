// js/components/popup-list.js

import API from '../utils/api.js';
import PopupForm from './popup-form.js';
import PopupDetails from './popup-details.js';
import PopupPreviewModal from './popup-preview-modal.js';

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
  fetchUserPopups() {
    API.getUserPopups()
      .then(popups => {
        this.renderPopupList(popups);
        
        // Lisätään testikutsu ensimmäiselle popupille
        if (popups && popups.length > 0) {
          console.log("Testing direct call to editPopup with first popup");
          setTimeout(() => {
            PopupForm.editPopup(popups[0]._id, popups[0]);
          }, 2000);
        }
      })
      .catch(error => {
        console.error('Error fetching popups:', error);
      });
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
    
    if (!popups || popups.length === 0) {
      popupList.innerHTML = '<div class="col-span-3 p-4 text-center text-gray-500 dark:text-gray-400">Ei popuppeja. Luo uusi popup yllä olevalla lomakkeella.</div>';
      return;
    }
    
    popups.forEach(popup => {
      // Luodaan korttipohjainen layout
      const li = document.createElement('li');
      li.className = 'bg-gray-800 dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden h-auto';
      li.dataset.id = popup._id;
      
      // Luodaan otsikko+infot
      const card = document.createElement('div');
      card.className = 'h-full flex flex-col';
      
      // Popupin kuva tai esikatselualue
      const previewArea = document.createElement('div');
      previewArea.className = 'h-32 relative';
      
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
          <button type="button" class="details-btn text-gray-300 hover:text-white" title="Näytä tiedot">
            <i class="fas fa-info-circle"></i>
          </button>
          <button type="button" class="preview-btn text-gray-300 hover:text-white ml-2" title="Esikatsele">
            <i class="fas fa-eye"></i>
          </button>
        </div>
        <div>
          <button type="button" class="delete-btn text-red-500 hover:text-red-700" title="Poista">
            <i class="fas fa-trash-alt"></i>
          </button>
          <button type="button" class="edit-btn bg-primary-600 hover:bg-primary-700 text-white py-1 px-3 rounded-md text-sm">
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

          // Varmista, että popup-data on kokonainen objekti
          console.log("Popup data for", popup._id, ":", popup);
      
      // Tapahtumakuuntelijat
      this.addCardEventListeners(li, popup);
    });
  }

  /**
 * Lisää kortille tapahtumankuuntelijat
 * @param {HTMLElement} card - Popup-kortin elementti
 * @param {Object} popup - Popupin tiedot
 */
addCardEventListeners(card, popup) {
  const detailsBtn = card.querySelector('.details-btn');
  if (detailsBtn) {
      detailsBtn.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          PopupDetails.showPopupDetails(popup);
      });
  }

  const previewBtn = card.querySelector('.preview-btn');
  if (previewBtn) {
      previewBtn.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          PopupPreviewModal.previewPopup(popup);
      });
  }
  
  const editBtn = card.querySelector('.edit-btn');
  if (editBtn) {
      editBtn.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          console.log('Edit button clicked for popup:', popup._id);
          
          // Käytetään PopupForm.editPopup
          if (typeof PopupForm.editPopup === 'function') {
              PopupForm.editPopup(popup._id, popup);
              
              // Varmista että modaali on näkyvissä
              setTimeout(() => {
                  const editForm = document.getElementById('editPopupForm');
                  if (editForm) {
                      console.log('Ensuring edit form is visible');
                      editForm.style.display = 'flex';
                  }
              }, 50);
          } else {
              console.error('PopupForm.editPopup is not a function');
          }
      });
  }

  const deleteBtn = card.querySelector('.delete-btn');
  if (deleteBtn) {
      deleteBtn.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.deletePopup(popup._id);
      });
  }
}

  /**
   * Poistaa popupin
   * @param {string} id - Popupin ID
   */
  async deletePopup(id) {
    if (confirm('Haluatko varmasti poistaa tämän popupin?')) {
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