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
 */
static editPopup(id, popupData) {
  console.log('PopupForm.editPopup called with ID:', id);
  console.log('Popup data received:', popupData);
  
  // Parsitaan popup-data, jos se on string
  const popup = typeof popupData === 'string' ? JSON.parse(popupData) : popupData;

  // Aseta kaikki arvot lomakkeelle
  document.getElementById('editPopupId').value = id;
  document.getElementById('editPopupName').value = popup.name || 'Unnamed Popup';
  document.getElementById('editPopupType').value = popup.popupType || 'square';
  document.getElementById('editWidth').value = popup.width || 200;
  document.getElementById('editHeight').value = popup.height || 150;
  document.getElementById('editPosition').value = popup.position || 'center';
  document.getElementById('editAnimation').value = popup.animation || 'none';
  document.getElementById('editBackgroundColor').value = popup.backgroundColor || '#ffffff';
  document.getElementById('editTextColor').value = popup.textColor || '#000000';
  document.getElementById('editContent').value = popup.content || '';
  
  // Timing-asetukset
  document.getElementById('editDelay').value = popup.timing?.delay || 0;
  document.getElementById('editShowDuration').value = popup.timing?.showDuration || 0;
  
  // Kuvien käsittely
  if (popup.imageUrl) {
      document.getElementById('editImageUrl').value = popup.imageUrl;
      
      // Jos on previewContainer, päivitä myös se
      const previewContainer = document.getElementById('editImagePreviewContainer');
      const previewImg = document.getElementById('editImagePreview');
      
      if (previewContainer && previewImg) {
          previewImg.src = popup.imageUrl;
          previewContainer.style.display = 'block';
      }
  } else {
      document.getElementById('editImageUrl').value = '';
      
      // Piilota preview jos se on olemassa
      const previewContainer = document.getElementById('editImagePreviewContainer');
      if (previewContainer) {
          previewContainer.style.display = 'none';
      }
  }
  
  // Aseta linkki-URL jos kenttä on olemassa
  const linkUrlField = document.getElementById('editLinkUrl');
  if (linkUrlField) {
      linkUrlField.value = popup.linkUrl || '';
  }

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

  // Näytä modaali
  const editForm = document.getElementById('editPopupForm');
  if (editForm) {
      // Käytä flex-näyttöä ja keskitä sisältö
      editForm.style.display = 'flex';
      editForm.style.alignItems = 'center';
      editForm.style.justifyContent = 'center';
      
      // Varmista että modaali on oikean kokoinen mobiililaitteilla
      const modal = editForm.querySelector('.modal');
      if (modal) {
          // Mobiililaitteilla varmista että modaali mahtuu näytölle
          if (window.innerWidth < 768) {
              modal.style.width = '95%';
              modal.style.maxHeight = '95vh';
          } else {
              modal.style.width = '90%';
              modal.style.maxWidth = '900px';
              modal.style.maxHeight = '90vh';
          }
          
          // Varmista että sisältö on vieritettävissä
          const modalBody = modal.querySelector('.modal-body');
          if (modalBody) {
              modalBody.style.overflowY = 'auto';
              modalBody.style.maxHeight = 'calc(90vh - 130px)';
          }
      }
      
      console.log('Edit form should now be visible with display: flex');
  } else {
      console.error('Edit form element not found!');
  }

  // Päivitä esikatselu
  if (typeof PopupPreview.updatePreview === 'function') {
      PopupPreview.updatePreview('edit');
  }
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
      if (sizeControls) sizeControls.style.display = 'none'; 
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

// Sulje modaali nappien toiminnot
document.addEventListener('DOMContentLoaded', function() {
  // Popup-modaalin sulkeminen
  const closeEditModalBtn = document.getElementById('closeEditModal');
  if (closeEditModalBtn) {
      closeEditModalBtn.addEventListener('click', function() {
          document.getElementById('editPopupForm').style.display = 'none';
      });
  }
  
  // Sulje modaali myös napista
  const cancelEditBtn = document.getElementById('cancelEdit');
  if (cancelEditBtn) {
      cancelEditBtn.addEventListener('click', function() {
          document.getElementById('editPopupForm').style.display = 'none';
      });
  }
  
  // Jos käyttäjä klikkaa modaalin ulkopuolelle, sulje se
  const editPopupModal = document.getElementById('editPopupForm');
  if (editPopupModal) {
      editPopupModal.addEventListener('click', function(event) {
          if (event.target === this) {
              this.style.display = 'none';
          }
      });
  }
  
  // Tallenna modaali submit-napista
  const updatePopupBtn = document.getElementById('updatePopup');
  if (updatePopupBtn) {
      updatePopupBtn.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('updatePopupForm').dispatchEvent(new Event('submit'));
      });
      
  }
});

export default PopupForm;
