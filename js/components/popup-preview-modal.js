// js/components/popup-preview-modal.js
// Moduuli, joka vastaa popup-esikatseluikkunan näyttämisestä

/**
 * PopupPreviewModal-luokka vastaa popupin esikatselusta modaalissa
 */
class PopupPreviewModal {
    /**
     * Näyttää popupin esikatselun modaalissa
     * @param {Object} popup - Popupin tiedot
     */
    static previewPopup(popup) {
      console.log("Previewing popup:", popup);
    
      // Luo overlay
      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
      
      // Luo popup-elementin container (helpottaa sijoittelua)
      const previewContainer = document.createElement('div');
      previewContainer.className = 'relative';
      
      // Luo popup-elementti
      const previewPopup = document.createElement('div');
      previewPopup.style.width = `${popup.width || 200}px`;
      previewPopup.style.height = `${popup.height || 150}px`;
      
      // Käsittele eri popup-tyypit
      if (popup.popupType === 'image' && popup.imageUrl) {
        // Kuva-popup
        previewPopup.className = 'bg-center bg-no-repeat bg-contain';
        previewPopup.style.backgroundImage = `url(${popup.imageUrl})`;
      } else {
        // Normaali popup
        previewPopup.className = `${popup.popupType === 'circle' ? 'rounded-full' : 'rounded-lg'} shadow-lg flex flex-col items-center justify-center overflow-auto`;
        previewPopup.style.backgroundColor = popup.backgroundColor || '#ffffff';
        previewPopup.style.color = popup.textColor || '#000000';
        
        // Lisää sisältö
        if (popup.content) {
          previewPopup.innerHTML = popup.content;
        }
        
        // Lisää kuva, jos sellainen on määritetty
        if (popup.imageUrl) {
          const img = document.createElement('img');
          img.src = popup.imageUrl;
          img.className = 'max-w-full max-h-full object-contain mt-2';
          previewPopup.appendChild(img);
        }
      }
      
      // Lisää popupin asettelua varten oikea positiointi
      switch (popup.position) {
        case 'top-left':
          previewContainer.className += ' absolute top-16 left-16';
          break;
        case 'top-right':
          previewContainer.className += ' absolute top-16 right-16';
          break;
        case 'bottom-left':
          previewContainer.className += ' absolute bottom-16 left-16';
          break;
        case 'bottom-right':
          previewContainer.className += ' absolute bottom-16 right-16';
          break;
        default: // center
          previewContainer.className += ' flex items-center justify-center';
      }
      
      // Lisää sulkupainike
      const closeBtn = document.createElement('button');
      closeBtn.className = 'absolute -top-10 right-0 bg-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg hover:bg-red-600 transition-colors';
      closeBtn.textContent = '×';
      
      // Lisää INFO-teksti
      const infoText = document.createElement('div');
      infoText.className = 'absolute -top-10 left-0 text-white text-sm';
      infoText.textContent = 'Esikatselutila';
      
      // Kokoa kaikki elementit
      previewContainer.appendChild(previewPopup);
      previewContainer.appendChild(closeBtn);
      previewContainer.appendChild(infoText);
      overlay.appendChild(previewContainer);
      document.body.appendChild(overlay);
      
      // Lisää sulkutoiminnot
      closeBtn.addEventListener('click', () => {
        document.body.removeChild(overlay);
      });
      
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          document.body.removeChild(overlay);
        }
      });
      
      // Animoi popup sisään
      if (popup.animation === 'fade') {
        previewPopup.style.opacity = '0';
        previewPopup.style.transition = 'opacity 0.5s';
        setTimeout(() => {
          previewPopup.style.opacity = '1';
        }, 10);
      } else if (popup.animation === 'slide') {
        previewPopup.style.transform = 'translateY(-50px)';
        previewPopup.style.transition = 'transform 0.5s';
        setTimeout(() => {
          previewPopup.style.transform = 'translateY(0)';
        }, 10);
      }
    }
  }
  
  export default PopupPreviewModal;
