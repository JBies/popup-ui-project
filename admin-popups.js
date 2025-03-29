// admin-popups.js
document.addEventListener('DOMContentLoaded', () => {
    // Alusta sovellus
    const app = new PopupAdmin();
    app.init();
});

/**
 * PopupAdmin - Popup-hallinnan pääluokka
 */
class PopupAdmin {
    constructor() {
        // Tallenna DOM-elementit
        this.elements = {
            // Taulukko
            popupsTableBody: document.getElementById('popupsTableBody'),
            
            // Modaali
            editPopupModal: document.getElementById('editPopupModal'),
            closeModal: document.getElementById('closeModal'),
            cancelButton: document.getElementById('cancelButton'),
            saveButton: document.getElementById('saveButton'),
            
            // Lomake
            updatePopupForm: document.getElementById('updatePopupForm'),
            editPopupId: document.getElementById('editPopupId'),
            
            // Esikatselu
            previewInputs: document.querySelectorAll('.preview-input'),
            editPreview: document.getElementById('editPreview'),
            
            // Muut
            loader: document.getElementById('loader'),
            notification: document.getElementById('notification'),
            notificationMessage: document.getElementById('notificationMessage'),

            // Kuvan muokkaus -elementit
            editImageUrl: document.getElementById('editImageUrl'),
            editImagePreview: document.getElementById('editImagePreview'),
            editImagePreviewImg: document.getElementById('editImagePreviewImg'),
            selectImageBtn: document.getElementById('selectImageBtn'),
            removeImageBtn: document.getElementById('removeImageBtn'),
            
            // Kuvakirjasto
            imageLibraryModal: document.getElementById('imageLibraryModal'),
            closeImageLibrary: document.getElementById('closeImageLibrary'),
            imageLibraryGrid: document.getElementById('imageLibraryGrid'),
            uploadImageInput: document.getElementById('uploadImageInput'),
            uploadImageBtn: document.getElementById('uploadImageBtn'),
            selectImageFromLibraryBtn: document.getElementById('selectImageFromLibraryBtn'),
            cancelImageSelectionBtn: document.getElementById('cancelImageSelectionBtn'),
            selectedLibraryImageUrl: null,
            selectedLibraryImageId: null
        };
        
        // Popup-data
        this.popups = [];
        this.currentPopupId = null;
    }
    
    /**
     * Alustaa sovelluksen toiminnallisuuden
     */
    init() {
        // Hae popup-data
        this.fetchPopups();
        
        // Aseta tapahtumankuuntelijat
        this.setupEventListeners();
    }
    
    /**
     * Asettaa tapahtumankuuntelijat elementeille
     */
    setupEventListeners() {
        // Sulje modaali
        this.elements.closeModal.addEventListener('click', () => this.closeModal());
        this.elements.cancelButton.addEventListener('click', () => this.closeModal());
        
        // Tallenna muutokset
        this.elements.saveButton.addEventListener('click', () => this.savePopup());
        
        // Esikatselu
        this.elements.previewInputs.forEach(input => {
            input.addEventListener('input', () => this.updatePreview());
        });

        // Kuvan muokkaus -toiminnot
        this.elements.selectImageBtn.addEventListener('click', () => this.openImageLibrary());
        this.elements.removeImageBtn.addEventListener('click', () => this.removeImage());
        this.elements.editImageUrl.addEventListener('input', () => this.updateImagePreview());

        // Kuvakirjaston toiminnot
        this.elements.closeImageLibrary.addEventListener('click', () => this.closeImageLibrary());
        this.elements.cancelImageSelectionBtn.addEventListener('click', () => this.closeImageLibrary());
        this.elements.uploadImageBtn.addEventListener('click', () => this.elements.uploadImageInput.click());
        this.elements.uploadImageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        this.elements.selectImageFromLibraryBtn.addEventListener('click', () => this.selectImageFromLibrary());

    }
    
    /**
     * Hakee popup-datan palvelimelta
     */
    async fetchPopups() {
        try {
            this.showLoader();
            
            const response = await fetch('/api/admin/popups');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.popups = await response.json();
            this.renderPopupTable();
        } catch (error) {
            console.error('Error loading popups:', error);
            this.showNotification('Failed to load popups. Please try again.', 'error');
            
            // Näytä virheviesti taulukossa
            this.elements.popupsTableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 2rem; color: #ef4444;">
                        <i class="fas fa-exclamation-circle"></i> 
                        Error loading popups. Please refresh the page to try again.
                    </td>
                </tr>
            `;
        } finally {
            this.hideLoader();
        }
    }
    
    /**
     * Renderöi popup-taulukon
     */
    renderPopupTable() {
        if (!this.popups || !this.popups.length) {
            this.elements.popupsTableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 2rem; color: #6b7280;">
                        <i class="fas fa-info-circle"></i> No popups found
                    </td>
                </tr>
            `;
            return;
        }
        
        // Tyhjennä taulukko
        this.elements.popupsTableBody.innerHTML = '';
        
        // Lisää rivit
        this.popups.forEach(popup => {
            const row = document.createElement('tr');
            
            // Nimi
            const nameCell = document.createElement('td');
            nameCell.textContent = popup.name || 'Unnamed Popup';
            row.appendChild(nameCell);
            
            // Tyyppi
            const typeCell = document.createElement('td');
            typeCell.textContent = popup.popupType;
            row.appendChild(typeCell);
            
            // Sisältö
            const contentCell = document.createElement('td');
            // Näytä kuva tai tekstisisältö
            if (popup.imageUrl && popup.popupType === 'image') {
                contentCell.innerHTML = `<div style="max-width: 100px; max-height: 60px; overflow: hidden;">
                    <img src="${popup.imageUrl}" alt="Popup image" style="width: 100%; height: auto;">
                </div>`;
            } else {
                // Lyhennä pitkät tekstit
                contentCell.textContent = popup.content ? (popup.content.length > 100 ? 
                    popup.content.substring(0, 100) + '...' : popup.content) : '-';
            }
            row.appendChild(contentCell);
            
            // Toiminnot
            const actionsCell = document.createElement('td');
            actionsCell.className = 'actions';

            // Info/tilastot-nappi
            const infoButton = document.createElement('button');
            infoButton.className = 'btn btn-sm';
            infoButton.innerHTML = '<i class="fas fa-chart-bar"></i> Stats'; // Muokattu ikoniksi ja tekstiksi
            infoButton.addEventListener('click', () => this.showPopupStats(popup._id));
            actionsCell.appendChild(infoButton);
            
            // Pieni väli nappien väliin
            actionsCell.appendChild(document.createTextNode(' '));
            
            // Muokkausnappi
            const editButton = document.createElement('button');
            editButton.className = 'btn btn-primary btn-sm';
            editButton.innerHTML = '<i class="fas fa-edit"></i> Edit';
            editButton.addEventListener('click', () => this.editPopup(popup._id));
            actionsCell.appendChild(editButton);
            
            // Poistonappi
            const deleteButton = document.createElement('button');
            deleteButton.className = 'btn btn-danger btn-sm';
            deleteButton.innerHTML = '<i class="fas fa-trash"></i> Delete';
            deleteButton.addEventListener('click', () => this.deletePopup(popup._id));
            actionsCell.appendChild(deleteButton);
            
            row.appendChild(actionsCell);
            
            this.elements.popupsTableBody.appendChild(row);
        });
    }

    /**
 * Näyttää popupin tilastot modaalissa
 * @param {string} popupId - Popupin ID
 */
async showPopupStats(popupId) {
    try {
        this.showLoader();
        
        // Hae popup tilastot
        const response = await fetch(`/api/popups/stats/${popupId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const stats = await response.json();
        
        // Hae popup tiedot
        const popup = this.popups.find(p => p._id === popupId);
        if (!popup) {
            throw new Error(`Popup not found with ID: ${popupId}`);
        }
        
        // Muotoile päivämäärät
        const formatDate = (dateStr) => {
            if (!dateStr) return 'Ei koskaan';
            return new Date(dateStr).toLocaleString();
        };
        
        // Luo modaali
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        modalOverlay.style.display = 'flex';
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.maxWidth = '600px';
        
        // Otsikko
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        modalHeader.innerHTML = `
            <h3 class="modal-title">Popup Statistics - ${popup.name || 'Unnamed Popup'}</h3>
            <button type="button" class="modal-close">×</button>
        `;
        
        // Sisältö
        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';
        
        // Perusinfot
        modalBody.innerHTML = `
            <div class="stats-section mb-4">
                <h4 class="text-lg font-medium mb-2">Popup Details</h4>
                <table class="w-full border-collapse">
                    <tr>
                        <td class="py-1 pr-4 font-medium">ID:</td>
                        <td class="py-1">${popup._id}</td>
                    </tr>
                    <tr>
                        <td class="py-1 pr-4 font-medium">Type:</td>
                        <td class="py-1">${popup.popupType}</td>
                    </tr>
                    <tr>
                        <td class="py-1 pr-4 font-medium">Created:</td>
                        <td class="py-1">${formatDate(popup.createdAt)}</td>
                    </tr>
                </table>
            </div>
            
            <div class="stats-section mb-4">
                <h4 class="text-lg font-medium mb-2">Performance</h4>
                <table class="w-full border-collapse">
                    <tr>
                        <td class="py-1 pr-4 font-medium">Views:</td>
                        <td class="py-1">${stats.views || 0}</td>
                    </tr>
                    <tr>
                        <td class="py-1 pr-4 font-medium">Clicks:</td>
                        <td class="py-1">${stats.clicks || 0}</td>
                    </tr>
                    <tr>
                        <td class="py-1 pr-4 font-medium">Click Rate:</td>
                        <td class="py-1">${stats.clickThroughRate || 0}%</td>
                    </tr>
                    <tr>
                        <td class="py-1 pr-4 font-medium">Last Viewed:</td>
                        <td class="py-1">${formatDate(stats.lastViewed)}</td>
                    </tr>
                    <tr>
                        <td class="py-1 pr-4 font-medium">Last Clicked:</td>
                        <td class="py-1">${formatDate(stats.lastClicked)}</td>
                    </tr>
                </table>
            </div>
            
            <div class="stats-section">
                <h4 class="text-lg font-medium mb-2">Embed Code</h4>
                <div class="p-3 bg-gray-100 rounded">
                    <pre style="white-space: pre-wrap; word-break: break-all; font-size: 12px; font-family: monospace;"><code>&lt;script src="https://popupmanager.net/popup-embed.js"&gt;&lt;/script&gt;
&lt;script&gt;
  window.addEventListener('load', function() {
    ShowPopup('${popup._id}');
  });
&lt;/script&gt;</code></pre>
                </div>
            </div>
        `;
        
        // Footer
        const modalFooter = document.createElement('div');
        modalFooter.className = 'modal-footer';
        modalFooter.innerHTML = `
            <button type="button" class="btn">Close</button>
        `;
        
        // Kokoa modaali
        modal.appendChild(modalHeader);
        modal.appendChild(modalBody);
        modal.appendChild(modalFooter);
        modalOverlay.appendChild(modal);
        
        // Lisää modaali DOMiin
        document.body.appendChild(modalOverlay);
        
        // Lisää tapahtumankuuntelijat
        const closeButton = modalHeader.querySelector('.modal-close');
        const closeBtn = modalFooter.querySelector('.btn');
        const closeModal = () => {
            document.body.removeChild(modalOverlay);
        };
        
        closeButton.addEventListener('click', closeModal);
        closeBtn.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    } catch (error) {
        console.error('Error loading popup stats:', error);
        this.showNotification('Error loading popup statistics', 'error');
    } finally {
        this.hideLoader();
    }
}
    
    /**
     * Avaa muokkausmodaalin
     * @param {string} popupId - Muokattavan popupin ID
     */
    async editPopup(popupId) {
        try {
            this.showLoader();
            
            // Etsi popup ID:n perusteella
            const popup = this.popups.find(p => p._id === popupId);
            if (!popup) {
                throw new Error('Popup not found');
            }
            
            // Tallenna nykyinen ID
            this.currentPopupId = popupId;
            
            // Täytä lomake tiedoilla
            this.fillEditForm(popup);
            
            // Näytä modaali
            this.elements.editPopupModal.style.display = 'block';
            
            // Päivitä esikatselu
            this.updatePreview();
        } catch (error) {
            console.error('Error opening edit modal:', error);
            this.showNotification('Error opening edit form', 'error');
        } finally {
            this.hideLoader();
        }
    }
    
    /**
     * Täyttää muokkauslomakkeen popupin tiedoilla
     * @param {Object} popup - Popup-objekti
     */
    fillEditForm(popup) {
        // Aseta perustiedot
        this.elements.editPopupId.value = popup._id;
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

        // Päivämäärät
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
        // Näytä kuva, jos sellainen on
        if (popup.imageUrl) {
            this.elements.editImageUrl.value = popup.imageUrl;
            this.elements.editImagePreviewImg.src = popup.imageUrl;
            this.elements.editImagePreview.style.display = 'block';
        } else {
            this.elements.editImageUrl.value = '';
            this.elements.editImagePreview.style.display = 'none';
        }
    }
    
    /**
     * Kerää lomakkeen tiedot objektiksi
     * @returns {Object} Lomakkeen tiedot objektina
     */
    collectFormData() {
        return {
            name: document.getElementById('editPopupName').value || 'Unnamed Popup',
            popupType: document.getElementById('editPopupType').value,
            width: parseInt(document.getElementById('editWidth').value) || 200,
            height: parseInt(document.getElementById('editHeight').value) || 150,
            position: document.getElementById('editPosition').value,
            animation: document.getElementById('editAnimation').value,
            backgroundColor: document.getElementById('editBackgroundColor').value,
            textColor: document.getElementById('editTextColor').value,
            content: document.getElementById('editContent').value,
            delay: parseInt(document.getElementById('editDelay').value) || 0,
            showDuration: parseInt(document.getElementById('editShowDuration').value) || 0,
            startDate: document.getElementById('editStartDate').value || null,
            endDate: document.getElementById('editEndDate').value || null,
            imageUrl: document.getElementById('editImageUrl').value || null
        };
    }
    
    /**
     * Tallentaa popupin muutokset
     */
    async savePopup() {
        if (!this.currentPopupId) {
            this.showNotification('No popup selected', 'error');
            return;
        }
        
        try {
            this.showLoader();
            
            const popupData = this.collectFormData();
            
            const response = await fetch(`/api/popups/${this.currentPopupId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(popupData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to update popup');
            }
            
            // Päivitä popup-lista
            await this.fetchPopups();
            
            // Näytä onnistumisilmoitus
            this.showNotification('Popup updated successfully', 'success');
            
            // Sulje modaali
            this.closeModal();
        } catch (error) {
            console.error('Error updating popup:', error);
            this.showNotification('Error updating popup', 'error');
        } finally {
            this.hideLoader();
        }
    }
    
    /**
     * Poistaa popupin
     * @param {string} popupId - Poistettavan popupin ID
     */
    async deletePopup(popupId) {
        if (!confirm('Are you sure you want to delete this popup?')) {
            return;
        }
        
        try {
            this.showLoader();
            
            const response = await fetch(`/api/popups/${popupId}`, { 
                method: 'DELETE' 
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete popup');
            }
            
            // Päivitä popup-lista
            await this.fetchPopups();
            
            // Näytä onnistumisilmoitus
            this.showNotification('Popup deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting popup:', error);
            this.showNotification('Error deleting popup', 'error');
        } finally {
            this.hideLoader();
        }
    }
    

/**
 * Päivittää esikatselun
 */
updatePreview() {
    const previewContainer = this.elements.editPreview;
    if (!previewContainer) return;
    
    // Tyhjennä aiempi sisältö
    previewContainer.innerHTML = '';
    
    // Hae lomakkeen tiedot
    const popupType = document.getElementById('editPopupType').value || 'square';
    const width = parseInt(document.getElementById('editWidth').value) || 200;
    const height = parseInt(document.getElementById('editHeight').value) || 150;
    const position = document.getElementById('editPosition').value || 'center';
    const animation = document.getElementById('editAnimation').value || 'none';
    const backgroundColor = document.getElementById('editBackgroundColor').value || '#ffffff';
    const textColor = document.getElementById('editTextColor').value || '#000000';
    const content = document.getElementById('editContent').value || '';
    
    // Luo popup-elementti
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
    previewPopup.style.textAlign = 'center';
    
    // Lisää kuva, jos sellainen on määritetty
    const imageUrl = document.getElementById('editImageUrl').value;
    if (imageUrl && popupType === 'image') {
        // Jos popup on image-tyyppiä, näytä vain kuva
        previewPopup.style.background = `url(${imageUrl}) no-repeat center center`;
        previewPopup.style.backgroundSize = 'contain';
        previewPopup.innerHTML = '';  // Tyhjennä sisältö, vain kuva näytetään
    } else if (imageUrl) {
        // Muissa popup-tyypeissä näytä sekä teksti että kuva
        const contentElement = document.createElement('div');
        contentElement.innerHTML = content;
        contentElement.style.marginBottom = '10px';
        previewPopup.appendChild(contentElement);
        
        const imageElement = document.createElement('img');
        imageElement.src = imageUrl;
        imageElement.style.maxWidth = '100%';
        imageElement.style.maxHeight = '50%';
        imageElement.style.objectFit = 'contain';
        previewPopup.appendChild(imageElement);
    } else {
        // Jos kuvaa ei ole, näytä vain teksti
        previewPopup.innerHTML = content;
    }
    
    // Aseta sijainti esikatselussa
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
    
    // Lisää popup esikatseluun
    previewContainer.appendChild(previewPopup);
    
    // Animoi popup, jos animaatio on valittu
    if (animation !== 'none') {
        if (animation === 'fade') {
            previewPopup.style.opacity = '0';
            previewPopup.style.transition = 'opacity 0.5s ease-in-out';
            setTimeout(() => {
                previewPopup.style.opacity = '1';
            }, 10);
        } else if (animation === 'slide') {
            const originalTransform = previewPopup.style.transform || '';
            const slideTransform = originalTransform + (originalTransform ? ' ' : '') + 'translateY(-20px)';
            previewPopup.style.transform = slideTransform;
            previewPopup.style.opacity = '0';
            previewPopup.style.transition = 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out';
            setTimeout(() => {
                previewPopup.style.transform = originalTransform;
                previewPopup.style.opacity = '1';
            }, 10);
        }
    }
}

    /**
 * Päivittää kuvan esikatselun
 */
updateImagePreview() {
    const imageUrl = this.elements.editImageUrl.value;
    
    if (imageUrl) {
        this.elements.editImagePreviewImg.src = imageUrl;
        this.elements.editImagePreview.style.display = 'block';
    } else {
        this.elements.editImagePreview.style.display = 'none';
    }
    
    // Päivitä popup-esikatselu
    this.updatePreview();
}

/**
 * Poistaa kuvan
 */
removeImage() {
    this.elements.editImageUrl.value = '';
    this.elements.editImagePreview.style.display = 'none';
    
    // Päivitä popup-esikatselu
    this.updatePreview();
}

/**
 * Avaa kuvakirjaston
 */
async openImageLibrary() {
    try {
        this.showLoader();
        
        // Näytä kuvakirjasto-modaali
        this.elements.imageLibraryModal.style.display = 'block';
        
        // Hae kuvat
        await this.loadImageLibrary();
    } catch (error) {
        console.error('Error opening image library:', error);
        this.showNotification('Error loading image library', 'error');
    } finally {
        this.hideLoader();
    }
}

/**
 * Sulkee kuvakirjaston
 */
closeImageLibrary() {
    this.elements.imageLibraryModal.style.display = 'none';
    this.selectedLibraryImageUrl = null;
}

/**
 * Lataa kuvat kuvakirjastoon
 */
async loadImageLibrary() {
    try {
        const response = await fetch('/api/images');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const images = await response.json();
        this.renderImageLibrary(images);
    } catch (error) {
        console.error('Error loading images:', error);
        
        // Näytä virheviesti kuvaruudukossa
        this.elements.imageLibraryGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #ef4444;">
                <i class="fas fa-exclamation-circle"></i> 
                Error loading images
            </div>
        `;
    }
}

/**
 * Renderöi kuvakirjaston
 * @param {Array} images - Lista kuvaobjekteista
 */
renderImageLibrary(images) {
    const grid = this.elements.imageLibraryGrid;
    
    // Tyhjennä grid
    grid.innerHTML = '';
    
    if (!images || images.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #6b7280;">
                <i class="fas fa-info-circle"></i> 
                No images found. Upload your first image!
            </div>
        `;
        return;
    }
    
    // Lisää kuvat ruudukkoon
    images.forEach(image => {
        const imageItem = document.createElement('div');
        imageItem.className = 'image-library-item';
        imageItem.dataset.url = image.url;
        
        // Luo kuvan container, jossa on kiinteä korkeus
        const imgContainer = document.createElement('div');
        imgContainer.style.width = '100%';
        imgContainer.style.height = '100px';
        imgContainer.style.overflow = 'hidden';
        imgContainer.style.position = 'relative';
        
        const img = document.createElement('img');
        img.src = image.url;
        img.alt = image.name || 'Image';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.objectPosition = 'center';
        
        imgContainer.appendChild(img);
        imageItem.appendChild(imgContainer);
        
        // Lisää kuvan nimi/tiedot
        const imgInfo = document.createElement('div');
        imgInfo.style.padding = '5px';
        imgInfo.style.fontSize = '11px';
        imgInfo.style.textOverflow = 'ellipsis';
        imgInfo.style.whiteSpace = 'nowrap';
        imgInfo.style.overflow = 'hidden';
        imgInfo.textContent = image.name || 'Image';
        
        imageItem.appendChild(imgInfo);
        grid.appendChild(imageItem);
        
        // Lisää klikkitapahtuma
        imageItem.addEventListener('click', () => this.selectImageInLibrary(imageItem));
    });
}

/**
 * Valitsee kuvan kuvakirjastossa
 * @param {HTMLElement} imageItem - Valittu kuvaelementti
 */
selectImageInLibrary(imageItem) {
    // Poista aiempi valinta
    const selectedItems = this.elements.imageLibraryGrid.querySelectorAll('.image-library-item.selected');
    selectedItems.forEach(item => item.classList.remove('selected'));
    
    // Valitse uusi kuva
    imageItem.classList.add('selected');
    this.selectedLibraryImageUrl = imageItem.dataset.url;
}

/**
 * Käsittelee kuvan latauksen
 * @param {Event} event - Tiedoston lataustapahtuma
 */
async handleImageUpload(event) {
    if (!event.target.files || !event.target.files[0]) return;
    
    try {
        this.showLoader();
        
        const file = event.target.files[0];
        
        // Luo FormData
        const formData = new FormData();
        formData.append('image', file);
        
        // Lähetä kuva palvelimelle
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Failed to upload image');
        }
        
        const data = await response.json();
        
        // Päivitä kuvakirjasto
        await this.loadImageLibrary();
        
        // Näytä ilmoitus
        this.showNotification('Image uploaded successfully', 'success');
        
        // Tyhjennä tiedostokenttä
        this.elements.uploadImageInput.value = '';
    } catch (error) {
        console.error('Error uploading image:', error);
        this.showNotification('Error uploading image', 'error');
    } finally {
        this.hideLoader();
    }
}

/**
 * Valitsee kuvan kuvakirjastosta
 */
selectImageFromLibrary() {
    if (!this.selectedLibraryImageUrl) {
        this.showNotification('Please select an image first', 'error');
        return;
    }
    
    // Aseta kuvan URL lomakkeelle
    this.elements.editImageUrl.value = this.selectedLibraryImageUrl;
    
    // Päivitä esikatselu
    this.updateImagePreview();
    
    // Sulje kuvakirjasto
    this.closeImageLibrary();
}
    
    /**
     * Sulkee modaalin
     */
    closeModal() {
        this.elements.editPopupModal.style.display = 'none';
        this.currentPopupId = null;
    }
    
    /**
     * Näyttää latausindikaattorin
     */
    showLoader() {
        this.elements.loader.style.display = 'flex';
    }
    
    /**
     * Piilottaa latausindikaattorin
     */
    hideLoader() {
        this.elements.loader.style.display = 'none';
    }
    
    /**
     * Näyttää ilmoituksen käyttäjälle
     * @param {string} message - Näytettävä viesti
     * @param {string} type - Ilmoituksen tyyppi ('success' tai 'error')
     */
    showNotification(message, type = 'success') {
        const notification = this.elements.notification;
        const messageElement = this.elements.notificationMessage;
        
        // Aseta viesti ja tyyli
        messageElement.textContent = message;
        notification.className = `notification notification-${type}`;
        
        // Näytä ilmoitus
        notification.classList.add('show');
        
        // Piilota ilmoitus 3 sekunnin kuluttua
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}