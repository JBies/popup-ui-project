// js/components/popup-form.js
// Popup-lomakkeen hallinta

import API from '../utils/api.js';
import PopupPreview from './preview.js';
import FormValidation from '../utils/form-validation.js';

/**
 * PopupForm-luokka hallitsee popupin luomis- ja muokkauslomakkeita
 */
class PopupForm {
  constructor() {
    // Varmistetaan että DOM on valmis
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  /**
   * Alustaa lomakkeiden toiminnallisuudet
   */
  init() {
    console.log("Initializing PopupForm...");
    this.setupCreateForm();
    this.setupEditForm();
    this.setupImageUpload();
    this.setupPopupTypeChange();
    console.log("PopupForm initialized successfully");
  }

  /**
   * Alustaa uuden popupin luomislomakkeen
   */
  setupCreateForm() {
    const createForm = document.getElementById('createPopupForm');
    if (!createForm) {
      console.warn("Create popup form not found");
      return;
    }

    createForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Kerää lomakkeen tiedot
      const popupData = this.collectFormData('create');
      
      // Validoi lomake
      const { isValid, errors } = FormValidation.validatePopupForm(popupData);
      
      if (!isValid) {
        alert(errors.join('\n'));
        return;
      }
      
      try {
        await API.createPopup(popupData);
        alert('Popup created successfully!');
        
        // Päivitä popupien lista
        if (window.fetchUserPopups) {
          window.fetchUserPopups();
        }
        
        // Tyhjennä lomake
        createForm.reset();
        const imagePreviewContainer = document.getElementById('imagePreviewContainer');
        const imageUrl = document.getElementById('imageUrl');
        if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
        if (imageUrl) imageUrl.value = '';
        
        // Päivitä esikatselu
        PopupPreview.updatePreview('create');
      } catch (error) {
        console.error('Error creating popup:', error);
        alert('Error creating popup: ' + error.message);
      }
    });
  }

  /**
   * Kerää lomakkeen tiedot objektiin
   * @param {string} prefix - 'create' tai 'edit' riippuen lomakkeesta
   * @returns {Object} Kerätyt tiedot
   */
  collectFormData(prefix) {
    const popupName = document.getElementById(prefix === 'create' ? 'popupName' : 'editPopupName');
    const popupType = document.getElementById(prefix === 'create' ? 'popupType' : 'editPopupType');
    const width = document.getElementById(prefix === 'create' ? 'width' : 'editWidth');
    const height = document.getElementById(prefix === 'create' ? 'height' : 'editHeight');
    const position = document.getElementById(prefix === 'create' ? 'position' : 'editPosition');
    const animation = document.getElementById(prefix === 'create' ? 'animation' : 'editAnimation');
    const backgroundColor = document.getElementById(prefix === 'create' ? 'backgroundColor' : 'editBackgroundColor');
    const textColor = document.getElementById(prefix === 'create' ? 'textColor' : 'editTextColor');
    const content = document.getElementById(prefix === 'create' ? 'content' : 'editContent');
    const imageUrl = document.getElementById(prefix === 'create' ? 'imageUrl' : 'editImageUrl');
    const linkUrl = document.getElementById(prefix === 'create' ? 'linkUrl' : 'editLinkUrl');
    const delay = document.getElementById(prefix === 'create' ? 'delay' : 'editDelay');
    const showDuration = document.getElementById(prefix === 'create' ? 'showDuration' : 'editShowDuration');
    const startDate = document.getElementById(prefix === 'create' ? 'startDate' : 'editStartDate');
    const endDate = document.getElementById(prefix === 'create' ? 'endDate' : 'editEndDate');
    
    return {
      name: popupName?.value?.trim() || 'Unnamed Popup',
      popupType: popupType?.value || 'square',
      width: parseInt(width?.value) || 200,
      height: parseInt(height?.value) || 150,
      position: position?.value || 'center',
      animation: animation?.value || 'none',
      backgroundColor: backgroundColor?.value || '#ffffff',
      textColor: textColor?.value || '#000000',
      content: content?.value?.trim() || '',
      imageUrl: imageUrl?.value?.trim() || '',
      linkUrl: linkUrl?.value?.trim() || '',
      delay: parseInt(delay?.value) || 0,
      showDuration: parseInt(showDuration?.value) || 0,
      startDate: startDate?.value || null,
      endDate: endDate?.value || null
    };
  }

  /**
   * Alustaa popupin muokkauslomakkeen
   */
  setupEditForm() {
    const updateForm = document.getElementById('updatePopupForm');
    if (!updateForm) {
      console.warn("Update popup form not found");
      return;
    }

    // Peruuta-painike sulkee lomakkeen
    const cancelButton = document.getElementById('cancelEdit');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        const editPopupForm = document.getElementById('editPopupForm');
        if (editPopupForm) editPopupForm.style.display = 'none';
      });
    }

    // Lomakkeen lähetys
    updateForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('editPopupId').value;
      
      // Kerää lomakkeen tiedot
      const popupData = this.collectFormData('edit');
      
      // Validoi lomake
      const { isValid, errors } = FormValidation.validatePopupForm(popupData);
      
      if (!isValid) {
        alert(errors.join('\n'));
        return;
      }

      try {
        await API.updatePopup(id, popupData);
        alert('Popup updated successfully!');
        
        // Piilota muokkauslomake
        const editPopupForm = document.getElementById('editPopupForm');
        if (editPopupForm) editPopupForm.style.display = 'none';
        
        // Jos käytössä on popupien listauskomponentti, päivitä lista
        if (window.fetchUserPopups) {
          window.fetchUserPopups();
        }
      } catch (error) {
        console.error('Error updating popup:', error);
        alert('Failed to update popup');
      }
    });
  }

  /**
   * Alustaa kuvien latauksen
   */
  setupImageUpload() {
    // Kuvan latauksen käsittely create-lomakkeessa
    const imageInput = document.getElementById('image');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const imageUrlInput = document.getElementById('imageUrl');
    const removeImageBtn = document.getElementById('removeImage');
    
    if (imageInput) {
      imageInput.addEventListener('change', async (e) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          
          // Näytä latausanimaatio tai -ilmoitus
          if (imagePreviewContainer) imagePreviewContainer.style.display = 'block';
          if (imagePreview) imagePreview.src = URL.createObjectURL(file);
          
          try {
            const data = await API.uploadImage(file);
            
            // Tallenna saatu URL piilotettuun input-kenttään
            if (imageUrlInput) imageUrlInput.value = data.imageUrl;
            
            // Päivitä esikatselu
            PopupPreview.updatePreview('create');
          } catch (error) {
            console.error('Virhe kuvan latauksessa:', error);
            alert('Virhe kuvan latauksessa: ' + error.message);
            
            // Tyhjennä tiedosto ja esikatselu virheen sattuessa
            if (imageInput) imageInput.value = '';
            if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
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
        
        // Päivitä esikatselu
        PopupPreview.updatePreview('create');
      });
    }
    
    // Edit-lomakkeen toiminnot kuville
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
            const data = await API.uploadImage(file);
            if (editImageUrlInput) editImageUrlInput.value = data.imageUrl;
            PopupPreview.updatePreview('edit');
          } catch (error) {
            console.error('Virhe kuvan latauksessa:', error);
            alert('Virhe kuvan latauksessa');
            
            if (editImageInput) editImageInput.value = '';
            if (editImagePreviewContainer) editImagePreviewContainer.style.display = 'none';
          }
        }
      });
    }
    
    if (editRemoveImageBtn) {
      editRemoveImageBtn.addEventListener('click', () => {
        if (editImageInput) editImageInput.value = '';
        if (editImageUrlInput) editImageUrlInput.value = '';
        if (editImagePreviewContainer) editImagePreviewContainer.style.display = 'none';
        
        PopupPreview.updatePreview('edit');
      });
    }
  }

  /**
   * Muokkaa popupia - tämä metodi voidaan kutsua ulkopuolelta
   * @param {string} id - Popupin ID
   * @param {Object} popupData - Popupin tiedot
   */
  static editPopup(id, popupData) {
    console.log("Static editPopup called with ID:", id);
    // Parsitaan popup-data, jos se on string
    const popup = typeof popupData === 'string' ? JSON.parse(popupData) : popupData;
    
    // Varmistetaan että kaikki tarvittavat elementit löytyvät
    const editPopupId = document.getElementById('editPopupId');
    const editPopupName = document.getElementById('editPopupName');
    const editPopupType = document.getElementById('editPopupType');
    const editWidth = document.getElementById('editWidth');
    const editHeight = document.getElementById('editHeight');
    const editPosition = document.getElementById('editPosition');
    const editAnimation = document.getElementById('editAnimation');
    const editBackgroundColor = document.getElementById('editBackgroundColor');
    const editTextColor = document.getElementById('editTextColor');
    const editContent = document.getElementById('editContent');
    const editLinkUrl = document.getElementById('editLinkUrl');
    const editDelay = document.getElementById('editDelay');
    const editShowDuration = document.getElementById('editShowDuration');
    const editStartDate = document.getElementById('editStartDate');
    const editEndDate = document.getElementById('editEndDate');
    
    // Tarkistetaan että elementit löytyvät ennen kuin niihin asetetaan arvoja
    if (!editPopupId || !editPopupType) {
      console.error("Required edit form elements not found");
      return;
    }
    
    // Aseta kaikki arvot lomakkeelle
    editPopupId.value = id;
    
    if (editPopupName) {
      editPopupName.value = popup.name || 'Unnamed Popup';
      // Poistetaan required-attribuutti, joka voi aiheuttaa ongelmia
      editPopupName.removeAttribute('required');
    }
    
    if (editPopupType) editPopupType.value = popup.popupType || 'square';
    if (editWidth) editWidth.value = popup.width || 200;
    if (editHeight) editHeight.value = popup.height || 150;
    if (editPosition) editPosition.value = popup.position || 'center';
    if (editAnimation) editAnimation.value = popup.animation || 'none';
    if (editBackgroundColor) editBackgroundColor.value = popup.backgroundColor || '#ffffff';
    if (editTextColor) editTextColor.value = popup.textColor || '#000000';
    if (editContent) editContent.value = popup.content || '';
    if (editLinkUrl) editLinkUrl.value = popup.linkUrl || '';
    
    // Timing-asetukset
    if (editDelay) editDelay.value = popup.timing?.delay || 0;
    if (editShowDuration) editShowDuration.value = popup.timing?.showDuration || 0;
    
    // Muotoile päivämäärät oikein datetime-local kenttää varten (YYYY-MM-DDThh:mm)
    if (editStartDate && popup.timing?.startDate && popup.timing.startDate !== 'default') {
      try {
        const startDate = new Date(popup.timing.startDate);
        editStartDate.value = startDate.toISOString().slice(0, 16);
      } catch (e) {
        console.warn("Invalid start date:", popup.timing.startDate);
        editStartDate.value = '';
      }
    } else if (editStartDate) {
      editStartDate.value = '';
    }
    
    if (editEndDate && popup.timing?.endDate && popup.timing.endDate !== 'default') {
      try {
        const endDate = new Date(popup.timing.endDate);
        editEndDate.value = endDate.toISOString().slice(0, 16);
      } catch (e) {
        console.warn("Invalid end date:", popup.timing.endDate);
        editEndDate.value = '';
      }
    } else if (editEndDate) {
      editEndDate.value = '';
    }
    
    // Käsittele kuva
    const editImageUrlInput = document.getElementById('editImageUrl');
    const editImagePreviewContainer = document.getElementById('editImagePreviewContainer');
    const editImagePreview = document.getElementById('editImagePreview');
    
    if (editImageUrlInput && editImagePreviewContainer && editImagePreview) {
      if (popup.imageUrl) {
        editImageUrlInput.value = popup.imageUrl;
        editImagePreview.src = popup.imageUrl;
        editImagePreviewContainer.style.display = 'block';
      } else {
        editImageUrlInput.value = '';
        editImagePreviewContainer.style.display = 'none';
      }
    }
    
    // Näytä lomake
    const editPopupForm = document.getElementById('editPopupForm');
    if (editPopupForm) {
      editPopupForm.style.display = 'block';
      
      // Varmistetaan että lomake on näkyvissä vielä pienen viiveen jälkeenkin (mobiiliystävällisyys)
      setTimeout(() => {
        if (editPopupForm) editPopupForm.style.display = 'block';
        
        // Vieritä lomake näkyviin mobiililaitteissa
        if (window.innerWidth < 768) {
          editPopupForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 200);
    }
    
    // Päivitä esikatselu
    try {
      PopupPreview.updatePreview('edit');
    } catch (error) {
      console.error("Error updating preview:", error);
    }
    
    // Päivitä näkyvyys
    try {
      PopupForm.updateFormVisibility('edit');
    } catch (error) {
      console.error("Error updating form visibility:", error);
    }
  }

  /**
   * Lisää kuuntelijan popupin tyypin muutokselle
   */
  setupPopupTypeChange() {
    const popupTypeSelect = document.getElementById('popupType');
    const editPopupTypeSelect = document.getElementById('editPopupType');
    
    if (popupTypeSelect) {
      popupTypeSelect.addEventListener('change', () => this.updateFormVisibility('create'));
    }
    
    if (editPopupTypeSelect) {
      editPopupTypeSelect.addEventListener('change', () => this.updateFormVisibility('edit'));
    }
  }

  /**
   * Päivittää lomakkeen osien näkyvyyden popupin tyypin mukaan
   * @param {string} prefix - 'create' tai 'edit' riippuen lomakkeesta
   */
  updateFormVisibility(prefix) {
    const popupType = document.getElementById(prefix === 'create' ? 'popupType' : 'editPopupType')?.value;
    const sizeControls = document.querySelector(`#${prefix}PopupForm .size-controls`);
    const contentField = document.querySelector(`#${prefix}PopupForm .content-controls`);

    if (popupType === 'image') {
      // Näytä koko ja piilota sisältö
      if (sizeControls) sizeControls.style.display = 'block'; 
      if (contentField) contentField.style.display = 'none'; 
    } else {
      // Näytä koko ja sisältö
      if (sizeControls) sizeControls.style.display = 'block'; 
      if (contentField) contentField.style.display = 'block'; 
    }
    
    // Päivitä esikatselu
    PopupPreview.updatePreview(prefix);
  }

  /**
   * Staattinen versio updateFormVisibility-metodista ulkoista käyttöä varten
   * @param {string} prefix - 'create' tai 'edit' riippuen lomakkeesta
   */
  static updateFormVisibility(prefix) {
    const popupType = document.getElementById(prefix === 'create' ? 'popupType' : 'editPopupType')?.value;
    const sizeControls = document.querySelector(`#${prefix}PopupForm .size-controls`);
    const contentField = document.querySelector(`#${prefix}PopupForm .content-controls`);

    if (popupType === 'image') {
      // Näytä koko ja piilota sisältö
      if (sizeControls) sizeControls.style.display = 'block'; 
      if (contentField) contentField.style.display = 'none'; 
    } else {
      // Näytä koko ja sisältö
      if (sizeControls) sizeControls.style.display = 'block'; 
      if (contentField) contentField.style.display = 'block'; 
    }
    
    // Päivitä esikatselu
    PopupPreview.updatePreview(prefix);
  }
}

export default PopupForm;