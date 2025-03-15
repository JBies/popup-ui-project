// js/components/image-library.js
// Kuvakirjaston toiminnallisuudet

import API from '../utils/api.js';
import PopupPreview from './preview.js';

/**
 * ImageLibrary-luokka hallitsee kuvakirjaston toimintoja
 */
class ImageLibrary {
  constructor() {
    // Alustetaan tila selkeästi ja kokonaan
    this.state = {
      images: [],           // Kuvien lista
      selectedImageUrl: null, // Valitun kuvan URL
      selectedImageId: null,  // Valitun kuvan ID
      targetForm: null       // 'create' tai 'edit'
    };
  }

  /**
   * Alustaa kuvakirjaston
   */
  async init() {
    try {
      // Varmistetaan, että tilaobjekti on olemassa ennen metodikutsuja
      if (!this.state) {
        this.state = {
          images: [],
          selectedImageUrl: null,
          selectedImageId: null,
          targetForm: null
        };
      }
      
      await this.loadImageLibrary();
      this.setupEventListeners();
    } catch (error) {
      console.error('Kuvakirjaston alustusvirhe:', error);
    }
  }

  /**
   * Lataa käyttäjän kuvat kuvakirjastoon
   */
  async loadImageLibrary() {
    try {
      const images = await API.getUserImages();
      
      // Varmista, että this.state on määritelty ennen kuin asetat arvoja
      if (!this.state) {
        this.state = {};
      }
      
      this.state.images = images || []; // Varmista, että images-kenttä on aina vähintään tyhjä taulukko
      
      const imageGrid = document.getElementById('imageGrid');
      const imagePickerGrid = document.getElementById('imagePickerGrid');
      
      // Tyhjennä gridit
      if (imageGrid) imageGrid.innerHTML = '';
      if (imagePickerGrid) imagePickerGrid.innerHTML = '';
      
      if (!images || images.length === 0) {
        if (imageGrid) imageGrid.innerHTML = '<p class="p-4 text-gray-500 dark:text-gray-400">Ei kuvia kirjastossa</p>';
        if (imagePickerGrid) imagePickerGrid.innerHTML = '<p class="p-4 text-gray-500 dark:text-gray-400">Ei kuvia kirjastossa</p>';
        return;
      }
      
      // Lisää kuvat molempiin grideihin
      images.forEach(image => this.renderImageItem(image, imageGrid, imagePickerGrid));
      
      // Näytä kuvakirjasto
      const libraryElement = document.getElementById('imageLibrary');
      if (libraryElement) libraryElement.style.display = 'block';
    } catch (error) {
      console.error('Error loading image library:', error);
      
      // Näytä käyttäjäystävällinen virheilmoitus
      const imageGrid = document.getElementById('imageGrid');
      const imagePickerGrid = document.getElementById('imagePickerGrid');
      
      const errorMessage = '<div class="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">Virhe kuvakirjaston lataamisessa. Yritä päivittää sivu.</div>';
      
      if (imageGrid) imageGrid.innerHTML = errorMessage;
      if (imagePickerGrid) imagePickerGrid.innerHTML = errorMessage;
    }
  }

  selectImageFromLibrary(imageUrl) {
    const target = this.state.targetForm || 'create';

    if (target === 'create') {
      document.getElementById('imageUrl').value = imageUrl;
      document.getElementById('imagePreview').src = imageUrl;
      document.getElementById('imagePreviewContainer').style.display = 'block';
    } else if (target === 'edit') {
      document.getElementById('editImageUrl').value = imageUrl;
      document.getElementById('editImagePreview').src = imageUrl;
      document.getElementById('editImagePreviewContainer').style.display = 'block';
    }

    // Päivitä esikatselu
    // Korjataan tämä rivi käyttämään importattua PopupPreview-luokkaa
    PopupPreview.updatePreview(target === 'edit' ? 'edit' : 'create');

    // Sulje dialogi
    const dialog = document.getElementById('imagePickerDialog');
    if (dialog) dialog.style.display = 'none';

    // Nollaa valinta
    this.state.selectedImageUrl = null;
    this.state.selectedImageId = null;
    this.state.targetForm = null;
  }

  /**
   * Renderöi yksittäisen kuvan kuvakirjastoon ja valitsimeen
   * @param {Object} image - Kuvan tiedot
   * @param {HTMLElement} imageGrid - Kuvakirjaston grid-elementti
   * @param {HTMLElement} imagePickerGrid - Kuvavalitsimen grid-elementti
   */
  renderImageItem(image, imageGrid, imagePickerGrid) {
    // Varmistetaan, että image-objekti on validi
    if (!image || !image.url) {
      console.warn('Invalid image object:', image);
      return;
    }
  
    // Kuvakirjaston näkymä
    if (imageGrid) {
      try {
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        imageItem.innerHTML = `
          <img src="${image.url}" alt="${image.name || 'Kuva'}" onerror="this.src='data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%3E%3Crect%20fill%3D%22%23ddd%22%20width%3D%22100%22%20height%3D%22100%22%2F%3E%3Ctext%20fill%3D%22%23888%22%20font-family%3D%22Arial%22%20font-size%3D%2212%22%20x%3D%2220%22%20y%3D%2250%22%3EVirheellinen%20kuva%3C%2Ftext%3E%3C%2Fsvg%3E';">
          <div class="image-info">
            <span>${this.formatFileSize(image.size || 0)}</span>
          </div>
          <div class="image-actions">
            <button type="button" data-action="use" data-id="${image._id}" data-url="${image.url}">Käytä</button>
            <button type="button" data-action="details" data-id="${image._id}">Info</button>
            <button type="button" data-action="delete" data-id="${image._id}">Poista</button>
          </div>
        `;
        imageGrid.appendChild(imageItem);
      } catch (error) {
        console.error('Error rendering image item to grid:', error);
      }
    }
    
    // Valitsin-dialoogi näkymä
    if (imagePickerGrid) {
      try {
        const pickerItem = document.createElement('div');
        pickerItem.className = 'picker-image-item';
        pickerItem.dataset.id = image._id;
        pickerItem.dataset.url = image.url;
        pickerItem.innerHTML = `<img src="${image.url}" alt="${image.name || 'Kuva'}" onerror="this.src='data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%3E%3Crect%20fill%3D%22%23ddd%22%20width%3D%22100%22%20height%3D%22100%22%2F%3E%3Ctext%20fill%3D%22%23888%22%20font-family%3D%22Arial%22%20font-size%3D%2212%22%20x%3D%2220%22%20y%3D%2250%22%3EVirheellinen%20kuva%3C%2Ftext%3E%3C%2Fsvg%3E';">`;
        imagePickerGrid.appendChild(pickerItem);
      } catch (error) {
        console.error('Error rendering image item to picker:', error);
      }
    }
  }

  /**
   * Asettaa tapahtumakuuntelijat kuvakirjaston elementeille
   */
  setupEventListeners() {
    // Kuvakirjaston grid-elementti
    const imageGrid = document.getElementById('imageGrid');
    if (imageGrid) {
      imageGrid.addEventListener('click', (e) => this.handleImageGridClick(e));
    }
    
    // Kuvavalitsimen grid-elementti
    const imagePickerGrid = document.getElementById('imagePickerGrid');
    if (imagePickerGrid) {
      imagePickerGrid.addEventListener('click', (e) => this.handleImagePickerClick(e));
      imagePickerGrid.addEventListener('dblclick', (e) => this.handleImagePickerDblClick(e));
    }
    
    // Kuvavalitsimen sulkemisnappi
    const closeImagePicker = document.getElementById('closeImagePicker');
    if (closeImagePicker) {
      closeImagePicker.addEventListener('click', () => {
        const dialog = document.getElementById('imagePickerDialog');
        if (dialog) dialog.style.display = 'none';
      });
    }
    
    // Kuvavalitsimen avausnapit lomakkeilla
    const selectImageBtn = document.getElementById('selectImageBtn');
    if (selectImageBtn) {
      selectImageBtn.addEventListener('click', () => {
        const dialog = document.getElementById('imagePickerDialog');
        if (dialog) dialog.style.display = 'flex';
        this.state.targetForm = 'create';
      });
    }
    
    const editSelectImageBtn = document.getElementById('editSelectImageBtn');
    if (editSelectImageBtn) {
      editSelectImageBtn.addEventListener('click', () => {
        const dialog = document.getElementById('imagePickerDialog');
        if (dialog) dialog.style.display = 'flex';
        this.state.targetForm = 'edit';
      });
    }
    
    // Klikkaus modaalin ulkopuolelle sulkee sen
    const imagePickerDialog = document.getElementById('imagePickerDialog');
    if (imagePickerDialog) {
      imagePickerDialog.addEventListener('click', (e) => {
        if (e.target === imagePickerDialog) {
          imagePickerDialog.style.display = 'none';
        }
      });
    }
    
    // Kuvan tiedot -dialogin sulkeminen
    const closeImageDetails = document.getElementById('closeImageDetails');
    if (closeImageDetails) {
      closeImageDetails.addEventListener('click', () => {
        const dialog = document.getElementById('imageDetailsDialog');
        if (dialog) dialog.style.display = 'none';
      });
    }
    
    // Klikkaus modaalin ulkopuolelle sulkee myös tiedot-dialogin
    const imageDetailsDialog = document.getElementById('imageDetailsDialog');
    if (imageDetailsDialog) {
      imageDetailsDialog.addEventListener('click', (e) => {
        if (e.target === imageDetailsDialog) {
          imageDetailsDialog.style.display = 'none';
        }
      });
    }
    
    // Lisää kuvia -painike
    const uploadMoreImagesBtn = document.getElementById('uploadMoreImagesBtn');
    if (uploadMoreImagesBtn) {
      uploadMoreImagesBtn.addEventListener('click', () => {
        // Simuloi tiedoston valitsimen avaamista
        const imageInput = document.getElementById('image');
        if (imageInput) imageInput.click();
      });
    }
  }

  /**
   * Käsittelee klikkaukset kuvakirjaston gridissä
   * @param {Event} e - Klikkaustapahtuma
   */
  handleImageGridClick(e) {
    const button = e.target.closest('button');
    if (button) {
      // Käsitellään napin klikkaus (käytä/poista/info)
      const action = button.dataset.action;
      const imageId = button.dataset.id;
      const imageUrl = button.dataset.url;
      
      if (action === 'use') {
        this.selectImageFromLibrary(imageUrl);
      } else if (action === 'delete') {
        if (confirm('Haluatko varmasti poistaa tämän kuvan?')) {
          this.deleteImage(imageId);
        }
      } else if (action === 'details') {
        this.showImageDetails(imageId);
      }
    } else {
      // Jos klikataan kuvaa (ei nappia), näytetään tiedot
      const imageItem = e.target.closest('.image-item');
      if (imageItem) {
        const useButton = imageItem.querySelector('button[data-action="use"]');
        if (useButton) {
          const imageId = useButton.dataset.id;
          this.showImageDetails(imageId);
        }
      }
    }
  }

  /**
   * Käsittelee klikkaukset kuvavalitsimen gridissä
   * @param {Event} e - Klikkaustapahtuma
   */
  handleImagePickerClick(e) {
    const item = e.target.closest('.picker-image-item');
    if (!item) return;
    
    // Poista aiempi valinta
    const selectedItems = document.querySelectorAll('.picker-image-item.selected');
    selectedItems.forEach(el => el.classList.remove('selected'));
    
    // Lisää valinta klikattuun kuvaan
    item.classList.add('selected');
    
    // Tallenna valitun kuvan tiedot
    this.state.selectedImageUrl = item.dataset.url;
    this.state.selectedImageId = item.dataset.id;
  }

  /**
   * Käsittelee tuplaklikkaukset kuvavalitsimen gridissä
   * @param {Event} e - Klikkaustapahtuma
   */
  handleImagePickerDblClick(e) {
    const item = e.target.closest('.picker-image-item');
    if (!item) return;
    
    this.selectImageFromLibrary(item.dataset.url);
  }

  /**
   * Valitsee kuvan kirjastosta ja asettaa sen lomakkeelle
   * @param {string} imageUrl - Valitun kuvan URL
   */
  selectImageFromLibrary(imageUrl) {
    const target = this.state.targetForm || 'create';

    if (target === 'create') {
      document.getElementById('imageUrl').value = imageUrl;
      document.getElementById('imagePreview').src = imageUrl;
      document.getElementById('imagePreviewContainer').style.display = 'block';
    } else if (target === 'edit') {
      document.getElementById('editImageUrl').value = imageUrl;
      document.getElementById('editImagePreview').src = imageUrl;
      document.getElementById('editImagePreviewContainer').style.display = 'block';
    }

    // Päivitä esikatselu
    // Huom: Tämä riippuu siitä, miten updatePreview on toteutettu
    PopupPreview.updatePreview(target === 'edit' ? 'edit' : 'create');

    // Sulje dialogi
    const dialog = document.getElementById('imagePickerDialog');
    if (dialog) dialog.style.display = 'none';

    // Nollaa valinta
    this.state.selectedImageUrl = null;
    this.state.selectedImageId = null;
    this.state.targetForm = null;
  }

  /**
   * Poistaa kuvan kirjastosta
   * @param {string} imageId - Poistettavan kuvan ID
   */
  async deleteImage(imageId) {
    try {
      const response = await API.deleteImage(imageId);
      
      if (response.message.includes('käytetään popupeissa')) {
        alert('Kuvaa ei voi poistaa, koska sitä käytetään aktiivisissa popupeissa');
      } else {
        alert('Kuva poistettu onnistuneesti');
        await this.loadImageLibrary(); // Päivitä kuvakirjasto
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Virhe kuvan poistossa');
    }
  }

  /**
   * Näyttää kuvan tiedot ja käyttökohteet
   * @param {string} imageId - Näytettävän kuvan ID
   */
  async showImageDetails(imageId) {
    try {
      const data = await API.getImageDetails(imageId);
      const { image, popups } = data;
      
      // Täytä kuvan tiedot dialogiin
      document.getElementById('detailsImage').src = image.url;
      document.getElementById('detailsName').textContent = image.name;
      document.getElementById('detailsSize').textContent = this.formatFileSize(image.size);
      document.getElementById('detailsDate').textContent = new Date(image.createdAt).toLocaleDateString();
      
      // Näytä lista popupeista, joissa kuvaa käytetään
      const popupList = document.getElementById('detailsPopupList');
      popupList.innerHTML = '';
      
      if (popups.length === 0) {
        popupList.innerHTML = '<li class="no-popups-message">Kuvaa ei käytetä missään popupissa</li>';
      } else {
        popups.forEach(popup => {
          const li = document.createElement('li');
          li.innerHTML = `
            <strong>${popup.popupType}</strong> - 
            ${popup.content ? this.truncateText(popup.content, 30) : 'Ei sisältöä'}
            <em>(Luotu: ${new Date(popup.createdAt).toLocaleDateString()})</em>
          `;
          popupList.appendChild(li);
        });
      }
      
      // Näytä dialogi
      const dialog = document.getElementById('imageDetailsDialog');
      if (dialog) dialog.style.display = 'flex';
    } catch (error) {
      console.error('Error loading image details:', error);
      alert('Virhe kuvan tietojen lataamisessa');
    }
  }

  /**
   * Lyhentää tekstin haluttuun pituuteen ja lisää "..." loppuun
   * @param {string} text - Lyhennettävä teksti
   * @param {number} maxLength - Maksimipituus
   * @returns {string} Lyhennetty teksti
   */
  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  }

  /**
   * Formatoi tiedoston koon käyttäjäystävälliseen muotoon
   * @param {number} bytes - Koko tavuina
   * @returns {string} Formatoitu koko
   */
  formatFileSize(bytes) {
    if (bytes < 1024) {
      return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    } else {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
  }
}

export default ImageLibrary;