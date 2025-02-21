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
            row.insertCell().textContent = popup.popupType;
            row.insertCell().textContent = popup.content;

            const actionsCell = row.insertCell();
            actionsCell.innerHTML = `
                <button onclick="editPopup('${popup._id}', '${popup.popupType}', '${popup.content}')">Edit</button>
                <button onclick="deletePopup('${popup._id}')">Delete</button>
            `;
        });
    } catch (error) {
        console.error('Error loading popups:', error);
    }
});

function editPopup(id, popupType, content) {
    const popup = { popupType, content };
    
    const editPopupId = document.getElementById('editPopupId');
    const editPopupType = document.getElementById('editPopupType');
    const editWidth = document.getElementById('editWidth');
    const editHeight = document.getElementById('editHeight');
    const editPosition = document.getElementById('editPosition');
    const editAnimation = document.getElementById('editAnimation');
    const editBackgroundColor = document.getElementById('editBackgroundColor');
    const editTextColor = document.getElementById('editTextColor');
    const editContent = document.getElementById('editContent');

    if (editPopupId && editPopupType && editWidth && editHeight && editPosition && editAnimation && editBackgroundColor && editTextColor && editContent) {
        editPopupId.value = id;
        editPopupType.value = popup.popupType || 'square';
        editWidth.value = popup.width || 200;
        editHeight.value = popup.height || 150;
        editPosition.value = popup.position || 'center';
        editAnimation.value = popup.animation || 'none';
        editBackgroundColor.value = popup.backgroundColor || '#ffffff';
        editTextColor.value = popup.textColor || '#000000';
        editContent.value = popup.content || '';
        
        document.getElementById('editPopupForm').style.display = 'block';
        updatePreview('edit');
    } else {
        console.error('One or more elements are missing');
    }
}

function updatePreview(prefix = 'edit') {
    const previewContainer = document.getElementById(`${prefix}Preview`);
    if (!previewContainer) return;

    const popupType = document.getElementById(prefix === 'create' ? 'popupType' : 'editPopupType')?.value || 'square';
    const content = document.getElementById(prefix === 'create' ? 'content' : 'editContent')?.value || '';

    const previewPopup = document.createElement('div');
    previewPopup.style.borderRadius = popupType === 'circle' ? '50%' : '4px';
    previewPopup.innerHTML = content;

    previewContainer.innerHTML = '';
    previewContainer.appendChild(previewPopup);
}

async function updatePopup() {
    const id = document.getElementById('editPopupId').value;
    const popupData = {
        popupType: document.getElementById('editPopupType').value,
        width: document.getElementById('editWidth').value,
        height: document.getElementById('editHeight').value,
        position: document.getElementById('editPosition').value,
        animation: document.getElementById('editAnimation').value,
        backgroundColor: document.getElementById('editBackgroundColor').value,
        textColor: document.getElementById('editTextColor').value,
        content: document.getElementById('editContent').value
    };

    try {
        const response = await fetch(`/api/admin/popups/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(popupData)
        });

        if (response.ok) {
            alert('Popup updated successfully!');
            document.getElementById('editPopupForm').style.display = 'none';
            window.location.reload();
        } else {
            throw new Error('Failed to update popup');
        }
    } catch (error) {
        console.error('Error updating popup:', error);
        alert('Failed to update popup');
    }
}

async function deletePopup(popupId) {
    await fetch(`/api/admin/popups/delete/${popupId}`, { method: 'POST' });
    alert('Popup deleted successfully!');
    window.location.reload();
}