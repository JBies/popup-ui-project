// js/components/image-library.js

import API from '../utils/api.js';
import ImageGallery from './image-gallery.js';
import ImageUploader from './image-uploader.js';
import ImagePicker from './image-picker.js';
import PopupPreview from './preview.js';

/**
 * ImageLibrary-luokka hallitsee kuvakirjaston toimintoja
 */
class ImageLibrary {
  constructor() {
    this.images = [];
    this.init();
  }

  /**
   * Alustaa kuvakirjaston
   */
  async init() {
    try {
      // Lataa kuvat
      this.images = await ImageGallery.loadGallery(this.handleImageAction.bind(this));
      
      // Alusta kuvavalitsin
      ImagePicker.init(this.images);
      
      // Alusta kuvien lataus
      ImageUploader.init({
        onUploadComplete: this.handleUploadComplete.bind(this),
        onError: this.handleUploadError.bind(this)
      });
    } catch (error) {
      console.error('Kuvakirjaston alustusvirhe:', error);
    }
  }
  
  /**
   * Käsittelee kuvatoiminnot (käytä, näytä tiedot, poista)
   * @param {string} action - Toiminnon tyyppi
   * @param {string} imageId - Kuvan ID
   * @param {string} imageUrl - Kuvan URL
   */
  async handleImageAction(action, imageId, imageUrl) {
    try {
      switch (action) {
        case 'use':
          ImagePicker.selectImageFromLibrary(imageUrl);
          break;
          
        case 'details':
          await ImageGallery.showImageDetails(imageId);
          break;
          
        case 'delete':
          if (confirm('Haluatko varmasti poistaa tämän kuvan?')) {
            await this.deleteImage(imageId);
          }
          break;
      }
    } catch (error) {
      console.error(`Error handling image action ${action}:`, error);
      alert(`Virhe toiminnon suorittamisessa: ${error.message}`);
    }
  }
  
  /**
   * Käsittelee onnistuneen kuvan latauksen
   * @param {Object} data - Ladatun kuvan tiedot
   * @param {string} formType - Lomaketyyppi ('create' tai 'edit')
   */
  async handleUploadComplete(data, formType) {
    if (!data) return;
    
    // Päivitä esikatselu
    PopupPreview.updatePreview(formType);
    
    // Päivitä kuvakirjasto
    this.images = await ImageGallery.loadGallery(this.handleImageAction.bind(this));
    
    // Päivitä kuvavalitsin
    ImagePicker.init(this.images);
  }
  
  /**
   * Käsittelee kuvan latauksen virheet
   * @param {Error} error - Virhe
   * @param {string} formType - Lomaketyyppi ('create' tai 'edit')
   */
  handleUploadError(error, formType) {
    console.error(`Error uploading image (${formType}):`, error);
    alert(`Virhe kuvan lataamisessa: ${error.message}`);
  }
  
  /**
   * Poistaa kuvan
   * @param {string} imageId - Poistettavan kuvan ID
   */
  async deleteImage(imageId) {
    try {
      const response = await API.deleteImage(imageId);
      
      if (response.message.includes('käytetään popupeissa')) {
        alert('Kuvaa ei voi poistaa, koska sitä käytetään aktiivisissa popupeissa');
      } else {
        alert('Kuva poistettu onnistuneesti');
        
        // Päivitä kuvakirjasto
        this.images = await ImageGallery.loadGallery(this.handleImageAction.bind(this));
        
        // Päivitä kuvavalitsin
        ImagePicker.init(this.images);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Virhe kuvan poistossa');
    }
  }
}

export default ImageLibrary;