// js/components/preview.js
// Popup-esikatselun hallinta

/**
 * PopupPreview-luokka vastaa popup-esikatselujen luomisesta ja päivittämisestä
 */
class PopupPreview {
  /**
   * Alustaa preview-toiminnot DOMContentLoaded-tapahtumassa
   */
  static init() {
    console.log("Initializing PopupPreview...");
    
    // Suoritetaan alustus kun DOM on valmis
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupListeners());
    } else {
      // Jos DOM on jo ladattu, suoritetaan alustus heti
      this.setupListeners();
    }
  }
  
  /**
   * Asettaa kaikki tarvittavat tapahtumakuuntelijat
   */
  static setupListeners() {
    console.log("Setting up preview listeners...");
    
    // Create-lomakkeen kentät
    const createFields = [
      'popupType', 'width', 'height', 'position', 'animation',
      'backgroundColor', 'textColor', 'content', 'delay',
      'showDuration', 'startDate', 'endDate', 'imageUrl', 'linkUrl'
    ];
    
    // Edit-lomakkeen kentät
    const editFields = [
      'editPopupType', 'editWidth', 'editHeight', 'editPosition', 'editAnimation',
      'editBackgroundColor', 'editTextColor', 'editContent', 'editDelay',
      'editShowDuration', 'editStartDate', 'editEndDate', 'editImageUrl', 'editLinkUrl'
    ];
    
    // Lisätään kuuntelijat create-lomakkeen kentille
    createFields.forEach(fieldId => {
      const element = document.getElementById(fieldId);
      if (element) {
        console.log(`Adding listener to create field: ${fieldId}`);
        element.addEventListener('input', () => this.updatePreview('create'));
        element.addEventListener('change', () => this.updatePreview('create'));
      }
    });
    
    // Lisätään kuuntelijat edit-lomakkeen kentille
    editFields.forEach(fieldId => {
      const element = document.getElementById(fieldId);
      if (element) {
        console.log(`Adding listener to edit field: ${fieldId}`);
        element.addEventListener('input', () => this.updatePreview('edit'));
        element.addEventListener('change', () => this.updatePreview('edit'));
      }
    });
    
    // Lisätään kuuntelijat tärkeimmille select-elementeille suoraan
    this.addDirectListeners();
    
    // Alusta previewit
    this.updatePreview('create');
    this.updatePreview('edit');
    
    // Lisää päivitysintervalli varmuuden vuoksi
    this.startPreviewUpdateInterval();
    
    console.log("Preview listeners setup complete!");
  }
  
  /**
   * Lisää suorat tapahtumakuuntelijat tärkeille select-elementeille
   */
  static addDirectListeners() {
    // Tärkeimmät select-elementit
    const selects = [
      { id: 'position', prefix: 'create' },
      { id: 'animation', prefix: 'create' },
      { id: 'popupType', prefix: 'create' },
      { id: 'editPosition', prefix: 'edit' },
      { id: 'editAnimation', prefix: 'edit' },
      { id: 'editPopupType', prefix: 'edit' }
    ];
    
    selects.forEach(select => {
      const element = document.getElementById(select.id);
      if (element) {
        // Poistetaan vanhat kuuntelijat ensin varmuuden vuoksi
        element.removeEventListener('change', this.selectChangeHandler);
        
        // Lisätään uusi suora kuuntelija
        const handler = () => {
          console.log(`Direct event: ${select.id} changed to ${element.value}`);
          this.updatePreview(select.prefix);
        };
        
        element.addEventListener('change', handler);
        console.log(`Direct listener added to ${select.id}`);
      } else {
        console.warn(`Element not found: ${select.id}`);
      }
    });
  }
  
  /**
   * Käynnistää intervallipäivityksen esikatselua varten
   */
  static startPreviewUpdateInterval() {
    // Päivitä esikatselu heti kerran
    setTimeout(() => {
      this.updatePreview('create');
      this.updatePreview('edit');
    }, 500);
    
    // Asetetaan suora päivitys formien näkyvyysmuutoksille
    const editPopupForm = document.getElementById('editPopupForm');
    const createPopupForm = document.getElementById('createPopupForm');
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const element = mutation.target;
          if (element === editPopupForm && element.style.display !== 'none') {
            console.log('Edit form became visible, updating preview');
            this.updatePreview('edit');
          } else if (element === createPopupForm && element.style.display !== 'none') {
            console.log('Create form became visible, updating preview');
            this.updatePreview('create');
          }
        }
      });
    });
    
    if (editPopupForm) {
      observer.observe(editPopupForm, { attributes: true });
    }
    
    if (createPopupForm) {
      observer.observe(createPopupForm, { attributes: true });
    }
  }

  /**
   * Päivittää popupin reaaliaikaisen esikatselun
   * @param {string} prefix - 'create' tai 'edit' riippuen lomakkeesta
   */
  static updatePreview(prefix = 'create') {
    console.log(`Updating preview for: ${prefix}`);

    const previewContainer = document.getElementById(`${prefix}Preview`);
    if (!previewContainer) {
      console.warn(`Preview container not found: ${prefix}Preview`);
      return;
    }

    try {
      // Haetaan elementit oikeilla ID:illä
      const popupTypeId = prefix === 'create' ? 'popupType' : 'editPopupType';
      const widthId = prefix === 'create' ? 'width' : 'editWidth';
      const heightId = prefix === 'create' ? 'height' : 'editHeight';
      const positionId = prefix === 'create' ? 'position' : 'editPosition';
      const animationId = prefix === 'create' ? 'animation' : 'editAnimation';
      const backgroundColorId = prefix === 'create' ? 'backgroundColor' : 'editBackgroundColor';
      const textColorId = prefix === 'create' ? 'textColor' : 'editTextColor';
      const contentId = prefix === 'create' ? 'content' : 'editContent';
      const imageUrlId = prefix === 'create' ? 'imageUrl' : 'editImageUrl';
      const delayId = prefix === 'create' ? 'delay' : 'editDelay';
      const showDurationId = prefix === 'create' ? 'showDuration' : 'editShowDuration';
      
      // Haetaan elementit
      const popupTypeElement = document.getElementById(popupTypeId);
      const widthElement = document.getElementById(widthId);
      const heightElement = document.getElementById(heightId);
      const positionElement = document.getElementById(positionId);
      const animationElement = document.getElementById(animationId);
      const backgroundColorElement = document.getElementById(backgroundColorId);
      const textColorElement = document.getElementById(textColorId);
      const contentElement = document.getElementById(contentId);
      const imageUrlElement = document.getElementById(imageUrlId);
      
      // Logitetaan kenttien arvot
      if (positionElement) {
        console.log(`Position element for ${prefix}:`, positionElement);
        console.log(`Position value: ${positionElement.value}`);
      } else {
        console.warn(`Position element not found with ID: ${positionId}`);
      }
      
      // Haetaan kenttien arvot ja käytetään oletusarvoja, jos kenttää ei löydy
      const popupType = popupTypeElement ? popupTypeElement.value : 'square';
      const width = widthElement ? parseInt(widthElement.value) || 200 : 200;
      const height = heightElement ? parseInt(heightElement.value) || 150 : 150;
      const position = positionElement ? positionElement.value : 'center';
      const animation = animationElement ? animationElement.value : 'none';
      const backgroundColor = backgroundColorElement ? backgroundColorElement.value : '#ffffff';
      const textColor = textColorElement ? textColorElement.value : '#000000';
      const content = contentElement ? contentElement.value : '';
      const imageUrl = imageUrlElement ? imageUrlElement.value : '';
      
      // Logita kaikki arvot
      console.log(`Preview values for ${prefix}:`, {
        popupType, width, height, position, animation,
        backgroundColor, textColor, imageUrl
      });
      
      // Luo preview container
      const previewWrapper = document.createElement('div');
      previewWrapper.className = 'preview-wrapper relative h-64 bg-gray-100 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden';
      previewWrapper.style.position = 'relative';
      previewWrapper.style.height = '250px';
      previewWrapper.style.backgroundColor = '#f5f5f5';
      previewWrapper.style.margin = '20px 0';
      previewWrapper.style.overflow = 'hidden';
      previewWrapper.style.border = '1px dashed #ccc';
      previewWrapper.style.borderRadius = '8px';

      const updateButton = document.createElement('button');
      updateButton.style.position = 'absolute';
      updateButton.style.bottom = '5px';
      updateButton.style.right = '5px';
      updateButton.style.backgroundColor = '#007bff';
      updateButton.style.color = 'white';
      updateButton.style.padding = '4px 8px';
      updateButton.style.borderRadius = '3px';
      updateButton.style.border = 'none';
      updateButton.style.cursor = 'pointer';
      updateButton.style.fontSize = '12px';
      updateButton.textContent = 'Päivitä esikatselu';
      updateButton.onclick = (e) => {
        e.preventDefault();
        this.updatePreview(prefix);
      };
      previewWrapper.appendChild(updateButton);

      // Luo popup-esikatselu
      const previewPopup = document.createElement('div');
      previewPopup.className = 'preview-popup absolute overflow-auto shadow-md';
      previewPopup.style.position = 'absolute';
      previewPopup.style.width = `${width}px`;
      previewPopup.style.height = `${height}px`;
      previewPopup.style.backgroundColor = backgroundColor;
      previewPopup.style.color = textColor;
      previewPopup.style.borderRadius = popupType === 'circle' ? '50%' : '4px';
      previewPopup.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
      previewPopup.style.overflow = 'auto';

      // Käsitellään popup-tyypin mukaan
      if (popupType === 'image' && imageUrl) {
        // Jos tyyppi on "image" ja kuva-URL on määritetty, käytetään kuvaa
        previewPopup.style.background = `url(${imageUrl}) no-repeat center center`;
        previewPopup.style.backgroundSize = 'contain';
        previewPopup.style.padding = '0';
      } else {
        // Muuten lisätään sisältö ja mahdollinen kuva
        previewPopup.style.padding = '10px';
        previewPopup.style.display = 'flex';
        previewPopup.style.flexDirection = 'column';
        previewPopup.style.alignItems = 'center';
        previewPopup.style.justifyContent = 'center';
        previewPopup.style.textAlign = 'center';
        
        if (content) {
          const contentDiv = document.createElement('div');
          contentDiv.innerHTML = content;
          contentDiv.style.width = '100%';
          previewPopup.appendChild(contentDiv);
        }
        
        if (imageUrl && popupType !== 'image') {
          const image = document.createElement('img');
          image.src = imageUrl;
          image.style.maxWidth = '100%';
          image.style.maxHeight = '70%';
          image.style.marginTop = '10px';
          previewPopup.appendChild(image);
        }
      }

      // Aseta sijainti
      console.log(`Setting position: ${position}`);
      switch (position) {
        case 'top-left':
          previewPopup.style.top = '10px';
          previewPopup.style.left = '10px';
          console.log("Applied top-left positioning");
          break;
        case 'top-right':
          previewPopup.style.top = '10px';
          previewPopup.style.right = '10px';
          console.log("Applied top-right positioning");
          break;
        case 'bottom-left':
          previewPopup.style.bottom = '10px';
          previewPopup.style.left = '10px';
          console.log("Applied bottom-left positioning");
          break;
        case 'bottom-right':
          previewPopup.style.bottom = '10px';
          previewPopup.style.right = '10px';
          console.log("Applied bottom-right positioning");
          break;
        default: // center
          previewPopup.style.top = '50%';
          previewPopup.style.left = '50%';
          previewPopup.style.transform = 'translate(-50%, -50%)';
          console.log("Applied center positioning (default)");
      }

      // Lisää animaatio jos määritetty
      if (animation !== 'none') {
        const animationName = animation === 'fade' ? 'fadeIn' : 'slideIn';
        previewPopup.style.animation = `${animationName} 1s`;
        console.log(`Applied animation: ${animationName}`);
      }

      // Lisää sijaintitieto esikatseluun
      const positionIndicator = document.createElement('div');
      positionIndicator.style.position = 'absolute';
      positionIndicator.style.top = '5px';
      positionIndicator.style.right = '5px';
      positionIndicator.style.backgroundColor = '#007bff';
      positionIndicator.style.color = 'white';
      positionIndicator.style.padding = '2px 6px';
      positionIndicator.style.borderRadius = '3px';
      positionIndicator.style.fontSize = '12px';
      positionIndicator.textContent = `Sijainti: ${position}`;
      previewWrapper.appendChild(positionIndicator);
      
      // Lisää myös animaatiotieto
      if (animation !== 'none') {
        const animationIndicator = document.createElement('div');
        animationIndicator.style.position = 'absolute';
        animationIndicator.style.top = '5px';
        animationIndicator.style.left = '5px';
        animationIndicator.style.backgroundColor = '#28a745';
        animationIndicator.style.color = 'white';
        animationIndicator.style.padding = '2px 6px';
        animationIndicator.style.borderRadius = '3px';
        animationIndicator.style.fontSize = '12px';
        animationIndicator.textContent = `Animaatio: ${animation}`;
        previewWrapper.appendChild(animationIndicator);
      }

      // Tyhjennä ja päivitä esikatselu
      previewContainer.innerHTML = '';
      previewWrapper.appendChild(previewPopup);
      previewContainer.appendChild(previewWrapper);
      
      console.log(`Preview successfully updated for ${prefix}`);
    } catch (error) {
      console.error('Virhe esikatselun päivityksessä:', error);
      previewContainer.innerHTML = `
        <div style="padding: 20px; background-color: #ffecec; border: 1px solid #f5c6cb; border-radius: 4px; color: #721c24;">
          <strong>Virhe esikatselun päivityksessä:</strong> ${error.message}
        </div>
      `;
    }
  }
}

export default PopupPreview;