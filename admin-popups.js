// admin-popups.js
document.addEventListener('DOMContentLoaded', async () => {
    const response = await fetch('/api/admin/popups');
    const popups = await response.json();

    const popupsTable = document.getElementById('popupsTable').getElementsByTagName('tbody')[0];

    popups.forEach(popup => {
        const row = popupsTable.insertRow();
        row.insertCell().textContent = popup.type;
        row.insertCell().textContent = popup.content;
        row.insertCell().textContent = popup.position;

        const actionsCell = row.insertCell();
        actionsCell.innerHTML = `
            <a href="/admin-popups-edit.html?id=${popup._id}">Edit</a>
            <button onclick="deletePopup('${popup._id}')">Delete</button>
        `;
    });
});

async function deletePopup(popupId) {
    await fetch(`/api/admin/popups/delete/${popupId}`, { method: 'POST' });
    alert('Popup deleted successfully!');
    window.location.reload();
}