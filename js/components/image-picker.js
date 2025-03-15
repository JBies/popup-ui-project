// js/components/image-picker.js
// Kuvien valitseminen lomakkeisiin

import PopupPreview from './preview.js';

/**
 * ImagePicker-luokka vastaa kuvien valitsemisesta lomakkeisiin
 */
class ImagePicker {
  /**
   * Alustaa kuvavalitsimen
   * @param {Array} images - Lista kuvista
   */
  static init(images = []) {
    this.images = images;
    this.state = {
      selectedImageUrl: null,
      selectedImageId: null,
      targetForm: null
    };
    
    this.loadPickerImages();
    this.setupEventListeners();
  }
  
  /**
   * Lataa kuvat valitsinmodaaliin
   */
  static loadPickerImages() {
    const imagePickerGrid = document.getElementById('imagePickerGrid');
    if (!imagePickerGrid) return;
    
    // Tyhjennä grid
    imagePickerGrid.innerHTML = '';
    
    // Jos ei kuvia, näytä viesti
    if (!this.images || this.images.length === 0) {
      imagePickerGrid.innerHTML = '<p class="p-4 text-gray-500 dark:text-gray-400">Ei kuvia valittavana</p>';
      return;
    }
    
    // Renderöi kuvat
    this.images.forEach(image => {
      const pickerItem = document.createElement('div');
      pickerItem.className = 'picker-image-item';
      pickerItem.dataset.id = image._id;
      pickerItem.dataset.url = image.url;
      pickerItem.innerHTML = `<img src="${image.url}" alt="${image.name || 'Kuva'}" onerror="this.src='data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%3E%3Crect%20fill%3D%22%23ddd%22%20width%3D%22100%22%20height%3D%22100%22%2F%3E%3Ctext%20fill%3D%22%23888%22%20font-family%3D%22Arial%22%20font-size%3D%2212%22%20x%3D%2220%22%20y%3D%2250%22%3EVirheellinen%20kuva%3C%2Ftext%3E%3C%2Fsvg%3E';">`;
      imagePickerGrid.appendChild(pickerItem);
    });
  }
  
  /**
   * Asettaa tapahtumakuuntelijat kuvavalitsimen elementeille
   */
  static setupEventListeners() {
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
  }
  
  /**
   * Käsittelee klikkaukset kuvavalitsimen gridissä
   * @param {Event} e - Klikkaustapahtuma
   */
  static handleImagePickerClick(e) {
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
  static handleImagePickerDblClick(e) {
    const item = e.target.closest('.picker-image-item');
    if (!item) return;
    
    this.selectImageFromLibrary(item.dataset.url);
  }
  
  /**
   * Valitsee kuvan kirjastosta ja asettaa sen lomakkeelle
   * @param {string} imageUrl - Valitun kuvan URL
   */
  static selectImageFromLibrary(imageUrl) {
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
    PopupPreview.updatePreview(target === 'edit' ? 'edit' : 'create');

    // Sulje dialogi
    const dialog = document.getElementById('imagePickerDialog');
    if (dialog) dialog.style.display = 'none';

    // Nollaa valinta
    this.state.selectedImageUrl = null;
    this.state.selectedImageId = null;
    this.state.targetForm = null;
  }
}

export default ImagePicker;