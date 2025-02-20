// admin-users.js
document.addEventListener('DOMContentLoaded', async () => {
    const response = await fetch('/api/admin/users');
    const users = await response.json();

    const usersTable = document.getElementById('usersTable').getElementsByTagName('tbody')[0];

    users.forEach(user => {
        const row = usersTable.insertRow();
        row.insertCell().textContent = user.displayName;
        row.insertCell().textContent = user.email;
        row.insertCell().textContent = user.role;

        const actionsCell = row.insertCell();
        actionsCell.innerHTML = `
            <select onchange="updateRole('${user._id}', this.value)">
                <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
            </select>
            <button onclick="deleteUser('${user._id}')">Delete</button>
        `;
    });
});

async function updateRole(userId, role) {
    await fetch(`/api/admin/users/update-role/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
    });
    alert('Role updated successfully!');
}

async function deleteUser(userId) {
    await fetch(`/api/admin/users/delete/${userId}`, { method: 'POST' });
    alert('User deleted successfully!');
    window.location.reload();
}