// admin-users.js
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/admin/users');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const users = await response.json();

        // Järjestetään käyttäjät: ensin odottavat, sitten muut
        users.sort((a, b) => {
            // Asetetaan pending-käyttäjät ensimmäiseksi
            if (a.role === 'pending' && b.role !== 'pending') return -1;
            if (a.role !== 'pending' && b.role === 'pending') return 1;
            
            // Sitten vertaillaan rekisteröitymispäivää (uusimmat ensin)
            return new Date(b.registeredAt) - new Date(a.registeredAt);
        });

        // Haetaan filter-elementit
        const filterPending = document.getElementById('filterPending');
        const filterAll = document.getElementById('filterAll');
        
        // Lisätään filtteröinti-toiminnallisuus
        if (filterPending && filterAll) {
            filterPending.addEventListener('click', () => {
                renderUsersTable(users.filter(user => user.role === 'pending'));
                setActiveFilter(filterPending);
            });
            
            filterAll.addEventListener('click', () => {
                renderUsersTable(users);
                setActiveFilter(filterAll);
            });
            
            // Oletuksena näytetään kaikki käyttäjät
            setActiveFilter(filterAll);
        }
        
        // Näytetään aluksi kaikki käyttäjät
        renderUsersTable(users);
        updatePendingCount(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        document.getElementById('usersTable').innerHTML = 
            '<tr><td colspan="6" class="error-message">Error loading users. Please try again later.</td></tr>';
    }
});

/**
 * Renderöi käyttäjätaulukon annetuilla käyttäjillä
 * @param {Array} users - Käyttäjäobjektien lista
 */
function renderUsersTable(users) {
    const usersTable = document.getElementById('usersTable').getElementsByTagName('tbody')[0];
    
    // Tyhjennetään taulukko
    usersTable.innerHTML = '';
    
    // Jos ei käyttäjiä, näytetään viesti
    if (users.length === 0) {
        const row = usersTable.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 6;
        cell.className = 'empty-message';
        cell.textContent = 'No users found.';
        return;
    }
    
    // Lisätään käyttäjät taulukkoon
    users.forEach(user => {
        const row = usersTable.insertRow();
        row.className = user.role === 'pending' ? 'user-pending' : (user.role === 'admin' ? 'user-admin' : '');
        
        // Profiilkuva & nimi
        const userCell = row.insertCell();
        userCell.className = 'user-info-cell';
        userCell.innerHTML = `
            <div class="user-info-wrapper">
                <img src="${user.profilePicture || 'https://via.placeholder.com/40'}" class="user-avatar" alt="${user.displayName}">
                <div class="user-name-wrapper">
                    <div class="user-name">${user.displayName}</div>
                    <div class="user-email">${user.email}</div>
                </div>
            </div>
        `;
        
        // Rooli
        const roleCell = row.insertCell();
        roleCell.innerHTML = `
            <span class="role-badge role-${user.role}">${user.role}</span>
        `;
        
        // Rekisteröityminen
        const registeredCell = row.insertCell();
        registeredCell.innerHTML = `
            <div class="date-info">
                <div>${formatDate(user.registeredAt)}</div>
                <div class="time-info">${formatTime(user.registeredAt)}</div>
            </div>
        `;
        
        // Viimeisin kirjautuminen
        const lastLoginCell = row.insertCell();
        lastLoginCell.innerHTML = `
            <div class="date-info">
                <div>${formatDate(user.lastLogin)}</div>
                <div class="time-info">${formatTime(user.lastLogin)}</div>
            </div>
        `;
        
        // Hyväksyntäaika (jos käyttäjä on hyväksytty)
        const approvedCell = row.insertCell();
        if (user.approvedAt) {
            approvedCell.innerHTML = `
                <div class="date-info">
                    <div>${formatDate(user.approvedAt)}</div>
                    <div class="time-info">${formatTime(user.approvedAt)}</div>
                </div>
            `;
        } else {
            approvedCell.textContent = '-';
        }
        
        // Toiminnot
        const actionsCell = row.insertCell();
        actionsCell.className = 'actions-cell';
        
        // Näytetään erilaisia toimintoja roolin mukaan
        if (user.role === 'pending') {
            actionsCell.innerHTML = `
                <button class="approve-btn" data-id="${user._id}">
                    <i class="fas fa-check"></i> Hyväksy
                </button>
                <button class="delete-btn" data-id="${user._id}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
        } else if (user.role === 'user') {
            actionsCell.innerHTML = `
                <select class="role-select" data-id="${user._id}">
                    <option value="user" selected>User</option>
                    <option value="admin">Admin</option>
                </select>
                <button class="delete-btn" data-id="${user._id}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
        } else if (user.role === 'admin') {
            // Estetään admin-käyttäjien muokkaaminen jos on vain 1 admin
            const adminCount = users.filter(u => u.role === 'admin').length;
            
            if (adminCount > 1) {
                actionsCell.innerHTML = `
                    <select class="role-select" data-id="${user._id}">
                        <option value="admin" selected>Admin</option>
                        <option value="user">User</option>
                    </select>
                `;
            } else {
                actionsCell.innerHTML = `
                    <span class="admin-info">Super Admin</span>
                `;
            }
        }
    });
    
    // Lisätään toimintojen tapahtumakuuntelijat
    setupActionHandlers();
}

/**
 * Lisää tapahtumakuuntelijat toimintopainikkeille
 */
function setupActionHandlers() {
    // Hyväksy-painikkeet
    document.querySelectorAll('.approve-btn').forEach(button => {
        button.addEventListener('click', async () => {
            const userId = button.dataset.id;
            await updateUserRole(userId, 'user');
        });
    });
    
    // Roolin valinnat
    document.querySelectorAll('.role-select').forEach(select => {
        select.addEventListener('change', async () => {
            const userId = select.dataset.id;
            const newRole = select.value;
            await updateUserRole(userId, newRole);
        });
    });
    
    // Poisto-painikkeet
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', async () => {
            const userId = button.dataset.id;
            if (confirm('Haluatko varmasti poistaa tämän käyttäjän?')) {
                await deleteUser(userId);
            }
        });
    });
}

/**
 * Päivittää käyttäjän roolin
 * @param {string} userId - Käyttäjän ID
 * @param {string} role - Uusi rooli
 */
async function updateUserRole(userId, role) {
    try {
        const response = await fetch(`/api/admin/users/update-role/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Näytetään onnistumisviesti
            showNotification(`Rooli päivitetty: ${result.user.displayName} on nyt ${role}`, 'success');
            
            // Päivitetään käyttäjälista
            window.location.reload();
        } else {
            throw new Error(result.message || 'Error updating role');
        }
    } catch (error) {
        console.error('Error updating role:', error);
        showNotification('Virhe roolin päivityksessä: ' + error.message, 'error');
    }
}

/**
 * Poistaa käyttäjän
 * @param {string} userId - Käyttäjän ID
 */
async function deleteUser(userId) {
    try {
        const response = await fetch(`/api/admin/users/delete/${userId}`, { 
            method: 'POST' 
        });
        
        if (response.ok) {
            showNotification('Käyttäjä poistettu onnistuneesti', 'success');
            window.location.reload();
        } else {
            const result = await response.json();
            throw new Error(result.message || 'Error deleting user');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showNotification('Virhe käyttäjän poistossa: ' + error.message, 'error');
    }
}

/**
 * Päivittää odottavien käyttäjien määrän
 * @param {Array} users - Käyttäjälista
 */
function updatePendingCount(users) {
    const pendingCount = users.filter(user => user.role === 'pending').length;
    const pendingCountElement = document.getElementById('pendingCount');
    
    if (pendingCountElement) {
        pendingCountElement.textContent = pendingCount;
        
        // Näytetään tai piilotetaan badge tarpeen mukaan
        pendingCountElement.style.display = pendingCount > 0 ? 'inline-flex' : 'none';
    }
}

/**
 * Asettaa aktiivisen filtterin painikkeille
 * @param {HTMLElement} activeFilter - Aktiiviseksi asetettava filtteri
 */
function setActiveFilter(activeFilter) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    activeFilter.classList.add('active');
}

/**
 * Näyttää ilmoituksen käyttäjälle
 * @param {string} message - Ilmoituksen viesti
 * @param {string} type - Ilmoituksen tyyppi (success/error)
 */
function showNotification(message, type = 'info') {
    // Tarkistetaan onko notifikaatio-elementti jo olemassa
    let notification = document.getElementById('notification');
    
    if (!notification) {
        // Luodaan uusi notifikaatio-elementti
        notification = document.createElement('div');
        notification.id = 'notification';
        document.body.appendChild(notification);
    }
    
    // Asetetaan tyyli ja viesti
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Näytetään notifikaatio
    notification.classList.add('show');
    
    // Piilotetaan notifikaatio 3 sekunnin kuluttua
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

/**
 * Formatoi päivämäärän luettavaan muotoon
 * @param {string} dateString - Päivämäärä string-muodossa
 * @returns {string} Formatoitu päivämäärä
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fi-FI', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    }).format(date);
}

/**
 * Formatoi kellonajan luettavaan muotoon
 * @param {string} dateString - Päivämäärä string-muodossa
 * @returns {string} Formatoitu kellonaika
 */
function formatTime(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fi-FI', { 
        hour: '2-digit', 
        minute: '2-digit'
    }).format(date);
}