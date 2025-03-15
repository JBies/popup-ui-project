// js/components/image-gallery.js
// Kuvakirjaston näyttäminen

import API from '../utils/api.js';

/**
 * ImageGallery-luokka vastaa kuvakirjaston näyttämisestä
 */
class ImageGallery {
  /**
   * Lataa ja näyttää kuvakirjaston sisällön
   * @param {Function} onImageAction - Callback kuvan toiminnoille (käytä/poista/näytä)
   * @returns {Promise<Array>} Ladatut kuvat
   */
  static async loadGallery(onImageAction) {
    try {
      // Haetaan kuvat API:sta
      const images = await API.getUserImages();
      
      // Renderöi kuvakirjasto
      const imageGrid = document.getElementById('imageGrid');
      if (!imageGrid) return images;
      
      // Tyhjennä aiempi sisältö
      imageGrid.innerHTML = '';
      
      // Jos ei kuvia, näytä viesti
      if (!images || images.length === 0) {
        imageGrid.innerHTML = '<p class="p-4 text-gray-500 dark:text-gray-400">Ei kuvia kirjastossa</p>';
        return images;
      }
      
      // Renderöi kuvat
      images.forEach(image => this.renderImageItem(image, imageGrid, onImageAction));
      
      // Näytä kuvakirjasto
      const libraryElement = document.getElementById('imageLibrary');
      if (libraryElement) libraryElement.style.display = 'block';
      
      return images;
    } catch (error) {
      console.error('Error loading image gallery:', error);
      
      // Näytä virheilmoitus
      const imageGrid = document.getElementById('imageGrid');
      if (imageGrid) {
        imageGrid.innerHTML = `
          <div class="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            Virhe kuvakirjaston lataamisessa. Tarkista verkkoyhteys ja yritä uudelleen.
          </div>
        `;
      }
      
      return [];
    }
  }
  
  /**
   * Renderöi yksittäisen kuvan kuvakirjastoon
   * @param {Object} image - Kuvan tiedot
   * @param {HTMLElement} container - Kontainerielementti
   * @param {Function} onAction - Callback toiminnoille
   */
  static renderImageItem(image, container, onAction) {
    if (!image || !image.url || !container) return;
    
    try {
      // Luo kuvan kontainerielementti
      const imageItem = document.createElement('div');
      imageItem.className = 'image-item';
      imageItem.innerHTML = `
        <img src="${image.url}" alt="${image.name || 'Kuva'}" 
             onerror="this.src='data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%3E%3Crect%20fill%3D%22%23ddd%22%20width%3D%22100%22%20height%3D%22100%22%2F%3E%3Ctext%20fill%3D%22%23888%22%20font-family%3D%22Arial%22%20font-size%3D%2212%22%20x%3D%2220%22%20y%3D%2250%22%3EVirheellinen%20kuva%3C%2Ftext%3E%3C%2Fsvg%3E';">
        <div class="image-info">
          <span>${this.formatFileSize(image.size || 0)}</span>
        </div>
        <div class="image-actions">
          <button type="button" data-action="use" data-id="${image._id}" data-url="${image.url}">Käytä</button>
          <button type="button" data-action="details" data-id="${image._id}">Info</button>
          <button type="button" data-action="delete" data-id="${image._id}">Poista</button>
        </div>
      `;
      
      // Lisää toimintopainikkeiden käsittelijät
      if (typeof onAction === 'function') {
        const buttons = imageItem.querySelectorAll('button');
        buttons.forEach(button => {
          button.addEventListener('click', (e) => {
            e.preventDefault();
            onAction(button.dataset.action, button.dataset.id, button.dataset.url);
          });
        });
      }
      
      // Lisää kuva gridiin
      container.appendChild(imageItem);
    } catch (error) {
      console.error('Error rendering image item:', error);
    }
  }
  
  /**
   * Formatoi tiedoston koon käyttäjäystävälliseen muotoon
   * @param {number} bytes - Koko tavuina
   * @returns {string} Formatoitu koko
   */
  static formatFileSize(bytes) {
    if (bytes < 1024) {
      return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    } else {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
  }
  
  /**
   * Hakee ja näyttää kuvan tiedot ja käyttökohteet
   * @param {string} imageId - Kuvan ID
   */
  static async showImageDetails(imageId) {
    try {
      const data = await API.getImageDetails(imageId);
      const { image, popups } = data;
      
      // Luodaan modaali-overlay
      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
      
      // Luodaan modaalin sisältö
      const modal = document.createElement('div');
      modal.className = 'bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full';
      
      // Otsikko + sulkunappi
      modal.innerHTML = `
        <div class="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Kuvan tiedot</h2>
          <button class="close-btn text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <div class="p-4">
          <div class="flex flex-col md:flex-row gap-4">
            <div class="flex-shrink-0">
              <img src="${image.url}" alt="${image.name}" class="max-w-full h-auto max-h-64 rounded border border-gray-200 dark:border-gray-600">
            </div>
            <div class="flex-grow">
              <dl class="grid grid-cols-2 gap-x-4 gap-y-2">
                <dt class="text-gray-600 dark:text-gray-400">Nimi:</dt>
                <dd class="text-gray-900 dark:text-white">${image.name}</dd>
                
                <dt class="text-gray-600 dark:text-gray-400">Koko:</dt>
                <dd class="text-gray-900 dark:text-white">${this.formatFileSize(image.size)}</dd>
                
                <dt class="text-gray-600 dark:text-gray-400">Tyyppi:</dt>
                <dd class="text-gray-900 dark:text-white">${image.mimeType}</dd>
                
                <dt class="text-gray-600 dark:text-gray-400">Ladattu:</dt>
                <dd class="text-gray-900 dark:text-white">${new Date(image.createdAt).toLocaleString()}</dd>
              </dl>
            </div>
          </div>
          
          <div class="mt-6">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Käytetään seuraavissa popupeissa</h3>
            
            <div class="border border-gray-200 dark:border-gray-700 rounded">
              ${popups.length > 0 
                ? `<ul class="divide-y divide-gray-200 dark:divide-gray-700">
                    ${popups.map(popup => `
                      <li class="p-3">
                        <div class="flex items-center justify-between">
                          <div>
                            <span class="font-medium text-gray-900 dark:text-white">${popup.popupType}</span>
                            <span class="text-sm text-gray-500 dark:text-gray-400 ml-2">Luotu: ${new Date(popup.createdAt).toLocaleDateString()}</span>
                          </div>
                          <button class="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300" data-id="${popup._id}">
                            Näytä popup
                          </button>
                        </div>
                        ${popup.content ? `<p class="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">${this.truncateText(popup.content, 100)}</p>` : ''}
                      </li>
                    `).join('')}
                  </ul>`
                : `<p class="p-3 text-gray-500 dark:text-gray-400 text-center">Kuvaa ei käytetä missään popupissa</p>`
              }
            </div>
          </div>
        </div>
      `;
      
      // Lisää modaali DOMiin
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      
      // Lisää sulkutoiminto
      const closeBtn = modal.querySelector('.close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => document.body.removeChild(overlay));
      }
      
      // Sulje klikkaamalla taustaa
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) document.body.removeChild(overlay);
      });
    } catch (error) {
      console.error('Error loading image details:', error);
      alert('Virhe kuvan tietojen lataamisessa');
    }
  }
  
  /**
   * Lyhentää tekstin haluttuun pituuteen
   * @param {string} text - Lyhennettävä teksti
   * @param {number} maxLength - Maksimipituus
   * @returns {string} Lyhennetty teksti
   */
  static truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  }
}

export default ImageGallery;