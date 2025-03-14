// preview-test.js - Yksinkertainen testi esikatselun varmistamiseksi
document.addEventListener('DOMContentLoaded', function() {
    // Etsi kaikki lomakekentät
    const formFields = document.querySelectorAll('#createPopupForm input, #createPopupForm select, #createPopupForm textarea');
    
    // Lisää event listener jokaiseen kenttään
    formFields.forEach(field => {
      field.addEventListener('input', updatePreviewSimple);
    });
    
    // Kutsu esikatselua heti sivun latautuessa
    updatePreviewSimple();
    
    // Yksinkertainen esikatselu-funktio
    function updatePreviewSimple() {
      console.log("Simple preview update triggered");
      
      const previewContainer = document.getElementById('createPreview');
      if (!previewContainer) {
        console.warn("Preview container not found");
        return;
      }
      
      // Hae arvot lomakkeelta
      const popupType = document.getElementById('popupType')?.value || 'square';
      const width = document.getElementById('width')?.value || 200;
      const height = document.getElementById('height')?.value || 150;
      const position = document.getElementById('position')?.value || 'center';
      const backgroundColor = document.getElementById('backgroundColor')?.value || '#ffffff';
      const textColor = document.getElementById('textColor')?.value || '#000000';
      const content = document.getElementById('content')?.value || '';
      
      // Luo preview container
      const previewWrapper = document.createElement('div');
      previewWrapper.style.position = 'relative';
      previewWrapper.style.height = '300px';
      previewWrapper.style.backgroundColor = '#f5f5f5';
      previewWrapper.style.margin = '0';
      previewWrapper.style.overflow = 'hidden';
      previewWrapper.style.borderRadius = '0.375rem';
  
      // Luo popup-esikatselu
      const previewPopup = document.createElement('div');
      previewPopup.style.width = `${width}px`;
      previewPopup.style.height = `${height}px`;
      previewPopup.style.backgroundColor = backgroundColor;
      previewPopup.style.color = textColor;
      previewPopup.style.borderRadius = popupType === 'circle' ? '50%' : '4px';
      previewPopup.style.padding = '10px';
      previewPopup.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
      previewPopup.style.position = 'absolute';
      previewPopup.style.overflow = 'auto';
      previewPopup.style.display = 'flex';
      previewPopup.style.alignItems = 'center';
      previewPopup.style.justifyContent = 'center';
      
      // Lisää sisältö
      previewPopup.innerHTML = content;
      
      // Aseta sijainti
      switch (position) {
        case 'top-left':
          previewPopup.style.top = '10px';
          previewPopup.style.left = '10px';
          break;
        case 'top-right':
          previewPopup.style.top = '10px';
          previewPopup.style.right = '10px';
          break;
        case 'bottom-left':
          previewPopup.style.bottom = '10px';
          previewPopup.style.left = '10px';
          break;
        case 'bottom-right':
          previewPopup.style.bottom = '10px';
          previewPopup.style.right = '10px';
          break;
        default: // center
          previewPopup.style.top = '50%';
          previewPopup.style.left = '50%';
          previewPopup.style.transform = 'translate(-50%, -50%)';
      }
  
      // Tyhjennä ja päivitä esikatselu
      previewContainer.innerHTML = '';
      previewWrapper.appendChild(previewPopup);
      previewContainer.appendChild(previewWrapper);
    }
  });