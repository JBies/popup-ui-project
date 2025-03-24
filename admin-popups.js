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
            notificationMessage: document.getElementById('notificationMessage')
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
            
            // Ajastustiedot
            delay: parseInt(document.getElementById('editDelay').value) || 0,
            showDuration: parseInt(document.getElementById('editShowDuration').value) || 0,
            startDate: document.getElementById('editStartDate').value || null,
            endDate: document.getElementById('editEndDate').value || null
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
        previewPopup.innerHTML = content;
        
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
                const originalTransform = previewPopup.style.transform;
                previewPopup.style.transform = originalTransform + ' translateY(-20px)';
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