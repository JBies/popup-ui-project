// js/components/image-uploader.js
// Kuvien lataaminen palvelimelle

import API from '../utils/api.js';

/**
 * ImageUploader-luokka vastaa kuvien lataamisesta palvelimelle
 */
class ImageUploader {
  /**
   * Alustaa kuvien lataustoiminnallisuuden lomakkeille
   * @param {Object} options - Asetukset
   * @param {Function} options.onUploadComplete - Callback kun lataus on valmis
   * @param {Function} options.onError - Callback virhetilanteissa
   */
  static init(options = {}) {
    console.log('ImageUploader.init called');
    this.setupCreateFormUploader(options);
    this.setupEditFormUploader(options);
    this.setupLibraryUploader(options);
  }

  static async resizeImageIfNeeded(file, maxSizeInBytes = 1 * 1024 * 1024) {
    if (file.size <= maxSizeInBytes) {
      return file; // Kuva on jo sopivan kokoinen
    }
    
    // Luodaan väliaikainen URL kuvalle
    const imageUrl = URL.createObjectURL(file);
    
    // Luodaan canvas kuvan pienentämistä varten
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    // Ladataan kuva
    await new Promise((resolve) => {
      img.onload = resolve;
      img.src = imageUrl;
    });
    
    // Lasketaan uusi koko
    let width = img.width;
    let height = img.height;
    
    // Lasketaan kuvan pienennyskerroin
    const scaleFactor = Math.sqrt(maxSizeInBytes / file.size);
    
    width = Math.floor(width * scaleFactor);
    height = Math.floor(height * scaleFactor);
    
    // Asetetaan canvas-koko
    canvas.width = width;
    canvas.height = height;
    
    // Piirretään kuva pienennettynä
    ctx.drawImage(img, 0, 0, width, height);
    
    // Vapautetaan URL
    URL.revokeObjectURL(imageUrl);
    
    // Muunnetaan canvas BLOB-muotoon
    const blob = await new Promise(resolve => {
      // Käytetään 90% laatua JPEG-muodossa tai alkuperäistä formaattia
      const format = file.type.startsWith('image/png') ? 'image/png' : 'image/jpeg';
      const quality = format === 'image/jpeg' ? 0.9 : undefined;
      canvas.toBlob(resolve, format, quality);
    });
    
    // Luodaan uusi tiedosto
    return new File([blob], file.name, {
      type: blob.type
    });
  }
  
  /**
   * Alustaa kuvien latauksen luomislomakkeelle
   * @param {Object} options - Asetukset
   */
  static setupCreateFormUploader(options = {}) {
    console.log('ImageUploader.setupCreateFormUploader called');
    const imageInput = document.getElementById('image');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const imageUrlInput = document.getElementById('imageUrl');
    const removeImageBtn = document.getElementById('removeImage');
    
    if (imageInput) {
      // Poista mahdolliset olemassaolevat event listenerit
      const newImageInput = imageInput.cloneNode(true);
      imageInput.parentNode.replaceChild(newImageInput, imageInput);
      
      newImageInput.addEventListener('change', async (e) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          
          // Näytä latausanimaatio tai -ilmoitus
          if (imagePreviewContainer) imagePreviewContainer.style.display = 'block';
          if (imagePreview) imagePreview.src = URL.createObjectURL(file);
          
          try {
            // Kokeile pienentää kuvaa jos se on liian iso
            const maxSize = 950 * 1024; // 950 KB, jotta varmasti pysyy alle rajoituksen
            const processedFile = await this.resizeImageIfNeeded(file, maxSize);
            
            console.log(`Original file: ${file.size} bytes, Processed file: ${processedFile.size} bytes`);
            
            // Jos kuva pienentyi, näytä ilmoitus käyttäjälle
            if (processedFile.size < file.size) {
              console.log(`Kuvan kokoa pienennetty: ${(file.size/1024/1024).toFixed(2)}MB → ${(processedFile.size/1024/1024).toFixed(2)}MB`);
            }
            
            const data = await this.uploadImage(processedFile);
            
            // Tallenna saatu URL piilotettuun input-kenttään
            if (imageUrlInput) imageUrlInput.value = data.imageUrl;
            
            // Kutsu callback jos määritelty
            if (options.onUploadComplete) {
              options.onUploadComplete(data, 'create');
            }
          } catch (error) {
            console.error('Virhe kuvan latauksessa:', error);
            alert('Virhe kuvan latauksessa: ' + error.message);
            
            // Tyhjennä tiedosto ja esikatselu virheen sattuessa
            if (e.target) e.target.value = '';
            if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
            
            if (options.onError) {
              options.onError(error, 'create');
            }
          }
        }
      });
    }
    
    // Kuvan poistopainikkeen toiminta
    if (removeImageBtn) {
      removeImageBtn.addEventListener('click', () => {
        if (imageInput) imageInput.value = '';
        if (imageUrlInput) imageUrlInput.value = '';
        if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
        
        if (options.onUploadComplete) {
          options.onUploadComplete(null, 'create');
        }
      });
    }
  }
  
  /**
   * Alustaa kuvien latauksen muokkauslomakkeelle
   * @param {Object} options - Asetukset
   */
  static setupEditFormUploader(options = {}) {
    const editImageInput = document.getElementById('editImage');
    const editImagePreviewContainer = document.getElementById('editImagePreviewContainer');
    const editImagePreview = document.getElementById('editImagePreview');
    const editImageUrlInput = document.getElementById('editImageUrl');
    const editRemoveImageBtn = document.getElementById('editRemoveImage');
    
    if (editImageInput) {
      editImageInput.addEventListener('change', async (e) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          
          if (editImagePreviewContainer) editImagePreviewContainer.style.display = 'block';
          if (editImagePreview) editImagePreview.src = URL.createObjectURL(file);
          
          try {
            const data = await this.uploadImage(file);
            if (editImageUrlInput) editImageUrlInput.value = data.imageUrl;
            
            if (options.onUploadComplete) {
              options.onUploadComplete(data, 'edit');
            }
          } catch (error) {
            console.error('Virhe kuvan latauksessa:', error);
            alert('Virhe kuvan latauksessa');
            
            if (editImageInput) editImageInput.value = '';
            if (editImagePreviewContainer) editImagePreviewContainer.style.display = 'none';
            
            if (options.onError) {
              options.onError(error, 'edit');
            }
          }
        }
      });
    }
    
    if (editRemoveImageBtn) {
      editRemoveImageBtn.addEventListener('click', () => {
        if (editImageInput) editImageInput.value = '';
        if (editImageUrlInput) editImageUrlInput.value = '';
        if (editImagePreviewContainer) editImagePreviewContainer.style.display = 'none';
        
        if (options.onUploadComplete) {
          options.onUploadComplete(null, 'edit');
        }
      });
    }
  }
  
  /**
   * Alustaa kuvien latauksen kuvakirjastoon
   * @param {Object} options - Asetukset
   */
  static setupLibraryUploader(options = {}) {
    const uploadMoreImagesBtn = document.getElementById('uploadMoreImagesBtn');
    
    if (uploadMoreImagesBtn) {
      uploadMoreImagesBtn.addEventListener('click', () => {
        // Tämä painike vain simuloi tiedostonvalitsimen avaamista
        const imageInput = document.getElementById('image');
        if (imageInput) imageInput.click();
      });
    }
  }
  
  /**
   * Lataa kuvan palvelimelle
   * @param {File} file - Ladattava tiedosto
   * @returns {Promise<Object>} Latauksen vastaus
   */
  static async uploadImage(file) {
    console.log("ImageUploader.uploadImage kutsu tiedostolle:", file.name);
    return API.uploadImage(file);
  }
}

export default ImageUploader;