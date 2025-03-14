// js/components/preview.js
// Popup-esikatselun hallinta

/**
 * PopupPreview-luokka vastaa popup-esikatselujen luomisesta ja päivittämisestä
 */
class PopupPreview {
    /**
     * Päivittää popupin reaaliaikaisen esikatselun
     * @param {string} prefix - 'create' tai 'edit' riippuen lomakkeesta
     */
    static updatePreview(prefix = 'create') {
      console.log("Updating preview for:", prefix); // Debugging
      
      const previewContainer = document.getElementById(`${prefix}Preview`);
      if (!previewContainer) {
        console.warn(`Preview container not found: ${prefix}Preview`);
        return;
      }
      
      console.log("Preview container found:", previewContainer);
              
      // Haetaan elementit oikeilla ID:illä
      const popupType = document.getElementById(prefix === 'create' ? 'popupType' : 'editPopupType')?.value || 'square';
      const width = document.getElementById(prefix === 'create' ? 'width' : 'editWidth')?.value || 200;
      const height = document.getElementById(prefix === 'create' ? 'height' : 'editHeight')?.value || 150;
      const position = document.getElementById(prefix === 'create' ? 'position' : 'editPosition')?.value || 'center';
      const animation = document.getElementById(prefix === 'create' ? 'animation' : 'editAnimation')?.value || 'none';
      const backgroundColor = document.getElementById(prefix === 'create' ? 'backgroundColor' : 'editBackgroundColor')?.value || '#ffffff';
      const textColor = document.getElementById(prefix === 'create' ? 'textColor' : 'editTextColor')?.value || '#000000';
      const content = document.getElementById(prefix === 'create' ? 'content' : 'editContent')?.value || '';
      // Hae kuva-URL
      const imageUrl = document.getElementById(prefix === 'create' ? 'imageUrl' : 'editImageUrl')?.value || '';
  
      // Haetaan ajastuksen elementit turvallisesti
      const delayElement = document.getElementById(prefix === 'create' ? 'delay' : 'editDelay');
      const durationElement = document.getElementById(prefix === 'create' ? 'showDuration' : 'editShowDuration');
  
      // Luo preview container
      const previewWrapper = document.createElement('div');
      previewWrapper.style.position = 'relative';
      previewWrapper.style.height = '300px';
      previewWrapper.style.border = '1px dashed #ccc';
      previewWrapper.style.backgroundColor = '#f5f5f5';
      previewWrapper.style.margin = '20px 0';
      previewWrapper.style.overflow = 'hidden';
  
      // Luo popup-esikatselu
      const previewPopup = document.createElement('div');
      
      // Käsittele "image"-popup-tyyppi erikseen
      if (popupType === 'image' && imageUrl) {
        // Jos tyyppi on "image" ja kuva-URL on määritetty, käytetään kuvaa suoraan popupina
        previewPopup.style.background = `url(${imageUrl}) no-repeat center center`;
        previewPopup.style.backgroundSize = 'contain';
        previewPopup.style.padding = '0';
      } else {
        // Muussa tapauksessa käytetään normaalia popupia
        previewPopup.style.backgroundColor = backgroundColor;
        previewPopup.style.color = textColor;
        previewPopup.style.padding = '10px';
        
        const contentWrapper = document.createElement('div');
        contentWrapper.style.width = 'center'; // Sisältö keskellä
        contentWrapper.innerHTML = content;
        previewPopup.appendChild(contentWrapper);
        
        // Jos kuva-URL on määritetty (mutta tyyppi ei ole "image"), lisää kuva popupiin
        if (imageUrl && popupType !== 'image') {
          const image = document.createElement('img');
          image.src = imageUrl;
          image.style.maxWidth = '100%';
          image.style.maxHeight = '70%';
          image.style.objectFit = 'contain';
          image.style.marginTop = '10px';
          previewPopup.appendChild(image);
        }
      }
      
      previewPopup.style.width = `${width}px`;
      previewPopup.style.height = `${height}px`;
      previewPopup.style.borderRadius = popupType === 'circle' ? '50%' : '4px';
      previewPopup.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
      previewPopup.style.position = 'absolute';
      previewPopup.style.overflow = 'auto';
      previewPopup.style.display = 'flex';
      previewPopup.style.alignItems = 'center';
      previewPopup.style.justifyContent = 'center';
      previewPopup.style.textAlign = 'center';
      previewPopup.style.fontSize = '16px';
  
      // Aseta sijainti
      this.setPopupPosition(previewPopup, position);
  
      // Lisää animaatio
      if (animation !== 'none') {
        previewPopup.style.animation = animation === 'fade' ? 'fadeIn 0.5s' : 'slideIn 0.5s';
      }
  
      // Lisää ajastustiedot esikatseluun vain jos kaikki tarvittavat elementit löytyvät
      if (delayElement && durationElement) {
        const timingInfo = document.createElement('div');
        timingInfo.style.position = 'absolute';
        timingInfo.style.bottom = '10px';
        timingInfo.style.left = '10px';
        timingInfo.style.fontSize = '12px';
        timingInfo.style.color = '#666';
        timingInfo.innerHTML = `
            Delay: ${delayElement.value}s | 
            Duration: ${durationElement.value === '0' ? 'Until closed' : durationElement.value + 's'}
        `;
        previewWrapper.appendChild(timingInfo);
      }
  
      // Tyhjennä ja päivitä esikatselu
      previewContainer.innerHTML = '';
      previewWrapper.appendChild(previewPopup);
      previewContainer.appendChild(previewWrapper);
    }
  
    /**
     * Asettaa popupin sijainnin esikatselussa
     * @param {HTMLElement} popupElement - Popup-elementti
     * @param {string} position - Sijainti ('center', 'top-left', jne.)
     */
    static setPopupPosition(popupElement, position) {
      switch (position) {
        case 'top-left':
          popupElement.style.top = '10px';
          popupElement.style.left = '10px';
          break;
        case 'top-right':
          popupElement.style.top = '10px';
          popupElement.style.right = '10px';
          break;
        case 'bottom-left':
          popupElement.style.bottom = '10px';
          popupElement.style.left = '10px';
          break;
        case 'bottom-right':
          popupElement.style.bottom = '10px';
          popupElement.style.right = '10px';
          break;
        default: // center
          popupElement.style.top = '50%';
          popupElement.style.left = '50%';
          popupElement.style.transform = 'translate(-50%, -50%)';
      }
    }
  
    /**
     * Alustaa preview-toiminnot DOMContentLoaded-tapahtumassa
     */
    static init() {
      document.addEventListener('DOMContentLoaded', () => {
        console.log("Initializing preview listeners"); // Debugging
    
    // Create-lomakkeen kenttien event listenerit
    const createFields = ['popupType', 'width', 'height', 'position', 'animation', 
                         'backgroundColor', 'textColor', 'content', 'delay', 
                         'showDuration', 'startDate', 'endDate'];
    
    createFields.forEach(field => {
      const element = document.getElementById(field);
      if (element) {
        console.log(`Adding listener to field: ${field}`);
        element.addEventListener('input', () => {
          console.log(`Field ${field} changed, updating preview`);
          this.updatePreview('create');
        });
      } else {
        console.warn(`Field not found: ${field}`);
      }
    });
  
        // Edit-lomakkeen kenttien event listenerit
        const editFields = createFields.map(field => 'edit' + field.charAt(0).toUpperCase() + field.slice(1));
        editFields.forEach(field => {
          const element = document.getElementById(field);
          if (element) {
            element.addEventListener('input', () => this.updatePreview('edit'));
          }
        });
  
        // Alusta previewit
        console.log("Initializing previews");
        this.updatePreview('create');
        this.updatePreview('edit');
      });
    }
  }
  
  export default PopupPreview;