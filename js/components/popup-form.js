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
    this.init();
  }

  /**
   * Alustaa lomakkeiden toiminnallisuudet
   */
  init() {
    this.setupCreateForm();
    this.setupEditForm();
    this.setupImageUpload();
    this.setupPopupTypeChange();
  }

  /**
   * Alustaa uuden popupin luomislomakkeen
   */
  setupCreateForm() {
    const createForm = document.getElementById('createPopupForm');
    if (!createForm) return;

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
        document.getElementById('imagePreviewContainer').style.display = 'none';
        document.getElementById('imageUrl').value = '';
        
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
    return {
      name: document.getElementById(prefix === 'create' ? 'popupName' : 'editPopupName').value.trim() || 'Unnamed Popup',
      popupType: document.getElementById(prefix === 'create' ? 'popupType' : 'editPopupType').value,
      width: parseInt(document.getElementById(prefix === 'create' ? 'width' : 'editWidth').value) || 200,
      height: parseInt(document.getElementById(prefix === 'create' ? 'height' : 'editHeight').value) || 150,
      position: document.getElementById(prefix === 'create' ? 'position' : 'editPosition').value,
      animation: document.getElementById(prefix === 'create' ? 'animation' : 'editAnimation').value,
      backgroundColor: document.getElementById(prefix === 'create' ? 'backgroundColor' : 'editBackgroundColor').value,
      textColor: document.getElementById(prefix === 'create' ? 'textColor' : 'editTextColor').value,
      content: document.getElementById(prefix === 'create' ? 'content' : 'editContent').value.trim(),
      imageUrl: document.getElementById(prefix === 'create' ? 'imageUrl' : 'editImageUrl').value.trim(),
      linkUrl: document.getElementById(prefix === 'create' ? 'linkUrl' : 'editLinkUrl')?.value.trim() || '',
      // Ajastustiedot turvallisesti
      delay: parseInt(document.getElementById(prefix === 'create' ? 'delay' : 'editDelay').value) || 0,
      showDuration: parseInt(document.getElementById(prefix === 'create' ? 'showDuration' : 'editShowDuration').value) || 0,
      // Päivämäärät vain jos ne on asetettu
      startDate: document.getElementById(prefix === 'create' ? 'startDate' : 'editStartDate').value || null,
      endDate: document.getElementById(prefix === 'create' ? 'endDate' : 'editEndDate').value || null
    };
  }

  /**
   * Alustaa popupin muokkauslomakkeen
   */
  setupEditForm() {
    const updateForm = document.getElementById('updatePopupForm');
    if (!updateForm) return;

    // Peruuta-painike sulkee lomakkeen
    const cancelButton = document.getElementById('cancelEdit');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        document.getElementById('editPopupForm').style.display = 'none';
      });
    }

    // Lomakkeen lähetys
    updateForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('editPopupId').value;
      const popupType = document.getElementById('editPopupType').value;
      const content = document.getElementById('editContent').value.trim();
      const imageUrl = document.getElementById('editImageUrl')?.value.trim() || '';

      // Validoi lomake ennen lähetystä
      if (popupType === 'image' && !imageUrl) {
        alert('Kuva on pakollinen, kun popupin tyyppi on "Image"');
        return;
      }
      
      if (!content && !imageUrl) {
        alert('Joko sisältö tai kuva on pakollinen');
        return;
      }

      const popupData = {
        name: document.getElementById('editPopupName').value.trim() || 'Unnamed Popup',
        popupType: popupType,
        width: parseInt(document.getElementById('editWidth').value) || 200,
        height: parseInt(document.getElementById('editHeight').value) || 150,
        position: document.getElementById('editPosition').value || 'center',
        animation: document.getElementById('editAnimation').value || 'none',
        backgroundColor: document.getElementById('editBackgroundColor').value || '#ffffff',
        textColor: document.getElementById('editTextColor').value || '#000000',
        content: content,
        imageUrl: imageUrl,
        linkUrl: document.getElementById('editLinkUrl')?.value || '',
        
        // Ajastustiedot turvallisesti
        delay: parseInt(document.getElementById('editDelay').value) || 0,
        showDuration: parseInt(document.getElementById('editShowDuration').value) || 0,
        startDate: document.getElementById('editStartDate').value || null,
        endDate: document.getElementById('editEndDate').value || null
      };

      try {
        await API.updatePopup(id, popupData);
        alert('Popup updated successfully!');
        
        // Piilota muokkauslomake
        document.getElementById('editPopupForm').style.display = 'none';
        
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
   * popupien määrä ja rajoitukset
   * @param {Object} currentUser - Kirjautunut käyttäjä
   * @param {Array} userPopups - Käyttäjän popupit
   * @returns {Promise<void>}
   * 
   */
  async init() {
    try {
      // Tarkista käyttäjän popupien määrä ja rajoitukset
      const currentUser = await API.getCurrentUser();
      const userPopups = await API.getUserPopups();
      
      if (currentUser && currentUser.role !== 'admin') {
        const popupCount = userPopups ? userPopups.length : 0;
        const popupLimit = currentUser.popupLimit || 1;
        
        // Näytä jäljellä olevat popupit
        const remainingPopups = popupLimit - popupCount;
        const limitInfo = document.createElement('div');
        limitInfo.className = 'popup-limit-info';
        limitInfo.innerHTML = `
          <p class="text-${remainingPopups > 0 ? 'green' : 'red'}-600 dark:text-${remainingPopups > 0 ? 'green' : 'red'}-400 text-sm mb-4">
            <i class="fas fa-info-circle mr-1"></i>
            ${remainingPopups > 0 
              ? `Voit luoda vielä ${remainingPopups} popup${remainingPopups !== 1 ? 'ia' : 'in'} (rajoitus: ${popupLimit}).` 
              : 'Olet saavuttanut popupien maksimimäärän. Ota yhteyttä adminiin saadaksesi lisää.'}
          </p>
        `;
        
        const formElement = document.getElementById('createPopupForm');
        if (formElement) {
          formElement.insertBefore(limitInfo, formElement.firstChild);
        }
        
        // Piilota luomislomake, jos rajoitus on saavutettu
        if (remainingPopups <= 0) {
          const submitButton = document.getElementById('createPopup');
          if (submitButton) {
            submitButton.disabled = true;
            submitButton.style.opacity = '0.5';
            submitButton.style.cursor = 'not-allowed';
          }
        }
      }
      
      // Muut alustukset...
      this.setupCreateForm();
      this.setupEditForm();
      this.setupImageUpload();
      this.setupPopupTypeChange();
    } catch (error) {
      console.error('Error initializing popup form:', error);
    }
  }

  /**
   * Alustaa kuvien latauksen
   */
  setupImageUpload() {
    // Tyhjennä tämä metodi kokonaan ja käytä vain ImageUploader-komponentin logiikkaa
    console.log("PopupForm: setupImageUpload called - ei tehdä mitään, käytetään vain ImageUploaderia");
  }

  /**
   * Muokkaa popupia - tämä metodi voidaan kutsua ulkopuolelta
   * @param {string} id - Popupin ID
   * @param {Object} popupData - Popupin tiedot
   * @param {boolean} userTriggered - Onko käyttäjä käynnistänyt toiminnon (oletuksena false)
   */
  static editPopup(id, popupData, userTriggered = false) {
    // Tarkista että kutsu tulee käyttäjän toiminnosta tai eksplisiittisesti halutaan näyttää lomake
    if (!userTriggered && !window.forceShowEditForm) {
      console.log("Auto-opening of edit form prevented");
      return;
    }

    // Parsitaan popup-data, jos se on string
    const popup = typeof popupData === 'string' ? JSON.parse(popupData) : popupData;
    
    console.log("PopupForm.editPopup called with ID:", id);
    console.log("Popup data received:", popup);

    // Aseta kaikki arvot lomakkeelle
    const nameField = document.getElementById('editPopupName');
    if (nameField) {
      nameField.removeAttribute('required');
    }
    document.getElementById('editPopupId').value = id;
    document.getElementById('editPopupType').value = popup.popupType || 'square';
    document.getElementById('editWidth').value = popup.width || 200;
    document.getElementById('editHeight').value = popup.height || 150;
    document.getElementById('editPosition').value = popup.position || 'center';
    document.getElementById('editAnimation').value = popup.animation || 'none';
    document.getElementById('editBackgroundColor').value = popup.backgroundColor || '#ffffff';
    document.getElementById('editTextColor').value = popup.textColor || '#000000';
    document.getElementById('editContent').value = popup.content || '';
    
    // Aseta linkki-URL
    if (document.getElementById('editLinkUrl')) {
      document.getElementById('editLinkUrl').value = popup.linkUrl || '';
    }
    
    // Timing-asetukset
    document.getElementById('editDelay').value = popup.timing?.delay || 0;
    document.getElementById('editShowDuration').value = popup.timing?.showDuration || 0;
    
    // Muotoile päivämäärät oikein datetime-local kenttää varten (YYYY-MM-DDThh:mm)
    if (popup.timing?.startDate && popup.timing.startDate !== 'default') {
      const startDate = new Date(popup.timing.startDate);
      document.getElementById('editStartDate').value = startDate.toISOString().slice(0, 16);
    } else {
      document.getElementById('editStartDate').value = '';
    }
    
    if (popup.timing?.endDate && popup.timing.endDate !== 'default') {
      const endDate = new Date(popup.timing.endDate);
      document.getElementById('editEndDate').value = endDate.toISOString().slice(0, 16);
    } else {
      document.getElementById('editEndDate').value = '';
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
    document.getElementById('editPopupForm').style.display = 'block';
  console.log("Edit form displayed");
    
    // Päivitä esikatselu
  PopupPreview.updatePreview('edit');
  
  // Päivitä näkyvyys
  PopupForm.updateFormVisibility('edit');
     
  }
  

  /**
   * Lisää kuuntelijan popupin tyypin muutokselle
   */
  setupPopupTypeChange() {
    const popupTypeSelect = document.getElementById('popupType');
    const editPopupTypeSelect = document.getElementById('editPopupType');
    
    if (popupTypeSelect) {
      // Korjataan tämä kutsumaan instanssin metodia this:n kanssa
      popupTypeSelect.addEventListener('change', () => this.updateFormVisibility('create'));
    }
    
    if (editPopupTypeSelect) {
      // Korjataan tämä kutsumaan instanssin metodia this:n kanssa
      editPopupTypeSelect.addEventListener('change', () => this.updateFormVisibility('edit'));
    }
  }

  /**
   * Päivittää lomakkeen osien näkyvyyden popupin tyypin mukaan
   * @param {string} prefix - 'create' tai 'edit' riippuen lomakkeesta
   */
  updateFormVisibility(prefix) {
    // Tämä on nyt instanssin metodi, ei staattinen
    const popupType = document.getElementById(prefix === 'create' ? 'popupType' : 'editPopupType').value;
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
    const popupType = document.getElementById(prefix === 'create' ? 'popupType' : 'editPopupType').value;
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
