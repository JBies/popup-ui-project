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

async function editPopup(id, popupType, content) {
    document.getElementById('editPopupId').value = id;
    document.getElementById('editPopupType').value = popupType;
    document.getElementById('editContent').value = content;
    document.getElementById('editPopupForm').style.display = 'block';
}

async function updatePopup() {
    const id = document.getElementById('editPopupId').value;
    const popupType = document.getElementById('editPopupType').value;
    const content = document.getElementById('editContent').value;

    await fetch(`/api/admin/popups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ popupType, content })
    });

    alert('Popup updated successfully!');
    window.location.reload();
}

async function deletePopup(popupId) {
    await fetch(`/api/admin/popups/delete/${popupId}`, { method: 'POST' });
    alert('Popup deleted successfully!');
    window.location.reload();
}