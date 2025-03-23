// admin-popups.js
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/admin/popups');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const popups = await response.json();

        if (!Array.isArray(popups)) {
            throw new Error('Expected an array of popups');
        }

        const popupsTable = document.getElementById('popupsTable').getElementsByTagName('tbody')[0];

        popups.forEach(popup => {
            const row = popupsTable.insertRow();
            row.insertCell().textContent = popup.name;
            row.insertCell().textContent = popup.popupType;
            row.insertCell().textContent = popup.content;

            // Luodaan toimintopainikkeet ilman inline-tapahtumankäsittelijöitä
            const actionsCell = row.insertCell();
            
            // Edit-painike
            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.dataset.id = popup._id;
            editButton.dataset.popup = JSON.stringify(popup).replace(/"/g, '&quot;');
            editButton.className = 'edit-popup-btn';
            actionsCell.appendChild(editButton);
            
            // Delete-painike
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.dataset.id = popup._id;
            deleteButton.className = 'delete-popup-btn';
            actionsCell.appendChild(deleteButton);
        });
        
        // Lisätään tapahtumankäsittelijät toimintopainikkeille
        setupButtonEventListeners();
    } catch (error) {
        console.error('Error loading popups:', error);
    }

    // Lisätään lomakkeiden kenttiin tapahtumankäsittelijät esikatselu-päivitykselle
    const editFields = ['editPopupType','editWidth','editHeight','editPosition','editAnimation','editBackgroundColor','editTextColor','editContent','editDelay','editShowDuration','editStartDate','editEndDate'];
    editFields.forEach(field => {
        const element = document.getElementById(field);
        if (element) {
            element.addEventListener('input', () => updatePreview('edit'));
        }
    });

    // Alusta esikatselu
    updatePreview('edit');

    // Rekisteröi päivityslomakkeen lähetys
    setupUpdatePopupForm();
});

// Lisätään tapahtumankäsittelijät toimintopainikkeille
function setupButtonEventListeners() {
    // Edit-painikkeiden käsittelijät
    document.querySelectorAll('.edit-popup-btn').forEach(button => {
        button.addEventListener('click', () => {
            const id = button.dataset.id;
            const popupData = button.dataset.popup;
            editPopup(id, popupData);
        });
    });
    
    // Delete-painikkeiden käsittelijät
    document.querySelectorAll('.delete-popup-btn').forEach(button => {
        button.addEventListener('click', () => {
            const id = button.dataset.id;
            deletePopup(id);
        });
    });
    
    // Peruuta-painikkeen käsittelijä
    const cancelButton = document.getElementById('cancelEditBtn');
    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            document.getElementById('editPopupForm').style.display = 'none';
        });
    }
}

// Edit popup
function editPopup(id, popupData) {
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

    // Muotoile päivämäärät oikein datetime-local kenttää varten (YYYY-MM-DDThh:mm)
    if (popup.timing?.startDate) {
        const startDate = new Date(popup.timing.startDate);
        document.getElementById('editStartDate').value = startDate.toISOString().slice(0, 16);
    } else {
        document.getElementById('editStartDate').value = '';
    }

    if (popup.timing?.endDate) {
        const endDate = new Date(popup.timing.endDate);
        document.getElementById('editEndDate').value = endDate.toISOString().slice(0, 16);
    } else {
        document.getElementById('editEndDate').value = '';
    }

    // Näytä lomake
    document.getElementById('editPopupForm').style.display = 'block';

    // Päivitä esikatselu
    updatePreview('edit');
}

function setupUpdatePopupForm() {
    // Handle popup update form submission
    document.getElementById('updatePopupForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editPopupId').value;

        const popupData = {
            name: document.getElementById('editPopupName')?.value || 'Unnamed Popup',
            popupType: document.getElementById('editPopupType')?.value || 'square',
            width: document.getElementById('editWidth')?.value || 200,
            height: document.getElementById('editHeight')?.value || 150,
            position: document.getElementById('editPosition')?.value || 'center',
            animation: document.getElementById('editAnimation')?.value || 'none',
            backgroundColor: document.getElementById('editBackgroundColor')?.value || '#ffffff',
            textColor: document.getElementById('editTextColor')?.value || '#000000',
            content: document.getElementById('editContent')?.value || '',

            // Ajastustiedot turvallisesti
            delay: document.getElementById('editDelay')?.value || 0,
            showDuration: document.getElementById('editShowDuration')?.value || 0,
            startDate: document.getElementById('editStartDate')?.value || null,
            endDate: document.getElementById('editEndDate')?.value || null
        };

        console.log("Sending popup data:", popupData); // Debug

        try {
            const response = await fetch(`/api/popups/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(popupData)
            });

            if (response.ok) {
                alert('Popup updated successfully!');
                document.getElementById('editPopupForm').style.display = 'none';
                //fetchUserPopups();
                window.location.reload();
            } else {
                throw new Error('Failed to update popup');
            }
        } catch (error) {
            console.error('Error updating popup:', error);
            alert('Failed to update popup');
        }
    });
}

async function deletePopup(id) {
    if (confirm('Are you sure you want to delete this popup?')) {
        fetch(`/api/popups/${id}`, { method: 'DELETE' })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    alert(data.message);
                    window.location.reload();
                }
            });
    }
}

// Funktio reaaliaikaisen esikatselun päivittämiseen
function updatePreview(prefix = 'create') {
    const previewContainer = document.getElementById(`${prefix}Preview`);
    if (!previewContainer) return;

    // Haetaan elementit oikeilla ID:illä
    const popupType = document.getElementById(prefix === 'create' ? 'popupType' : 'editPopupType')?.value || 'square';
    const width = document.getElementById(prefix === 'create' ? 'width' : 'editWidth')?.value || 200;
    const height = document.getElementById(prefix === 'create' ? 'height' : 'editHeight')?.value || 150;
    const position = document.getElementById(prefix === 'create' ? 'position' : 'editPosition')?.value || 'center';
    const animation = document.getElementById(prefix === 'create' ? 'animation' : 'editAnimation')?.value || 'none';
    const backgroundColor = document.getElementById(prefix === 'create' ? 'backgroundColor' : 'editBackgroundColor')?.value || '#ffffff';
    const textColor = document.getElementById(prefix === 'create' ? 'textColor' : 'editTextColor')?.value || '#000000';
    const content = document.getElementById(prefix === 'create' ? 'content' : 'editContent')?.value || '';

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
    previewPopup.style.width = `${width}px`;
    previewPopup.style.height = `${height}px`;
    previewPopup.style.backgroundColor = backgroundColor;
    previewPopup.style.color = textColor;
    previewPopup.style.borderRadius = popupType === 'circle' ? '50%' : '4px';
    previewPopup.style.padding = '10px';
    previewPopup.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    previewPopup.style.position = 'absolute';
    previewPopup.innerHTML = content;
    previewPopup.style.overflow = 'auto';
    previewPopup.style.display = 'flex';
    previewPopup.style.alignItems = 'center';
    previewPopup.style.justifyContent = 'center';
    previewPopup.style.textAlign = 'center'; // Tekstin rivit keskitetään
    previewPopup.style.overflow = 'auto'; // Lisää scrollaus, jos sisältö ei mahdu
    previewPopup.style.fontSize = '16px';

    const contentWrapper = document.createElement('div');
    contentWrapper.style.width = 'center'; // Sisältö keskellä
    // contentWrapper.innerHTML = content; // teki tuplana tekstit esikatseluun
    previewPopup.appendChild(contentWrapper);

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

    // Lisää animaatio
    if (animation !== 'none') {
        previewPopup.style.animation = animation === 'fade' ? 'fadeIn 0.5s' : 'slideIn 0.5s';
    }
    // ajastus
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