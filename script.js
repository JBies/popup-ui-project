// VArmistaa että DOM on ladattu
document.addEventListener("DOMContentLoaded", function () {
    console.log("JS valmis.");


    // Luodaan painikkeelle eventListener
    const button = document.getElementById("delayButton");
    if (button) {
        button.addEventListener("click", function  () {
            console.log("Painettu.")
            console.log("Haarantekotesti teksti.")
            //setTimeout(afterTimeout, 5000);
            printPopups();
        });
    }
});

//Printtaa konsolille annetun tekstin
function afterTimeout() {
    console.log("5s on kulunut!")

    // Demo siitä, miten popup aukeaa ajastetusti
    
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('popup').style.display = 'block';

    printPopups();

    //let pvm = document.getElementById("startDate").value;
    //console.log("'"+pvm+"'");
}

function printPopups() {
    fetch('/api/popups')
        .then(response => response.json())
        .then(data => {
            const popupList = document.getElementById('popups');
            //let parsedLst = JSON.parse(popupList);
            console.log(popupList);
        })
};

         // Hae käyttäjän tiedot palvelimelta
         async function fetchUser() {
            const response = await fetch('/api/user');
            const data = await response.json();

            if (data.user && data.user.role === 'admin') {
                // Näytä admin-valikko
                document.getElementById('adminMenu').style.display = 'block';
            }
        }

        // Suorita fetchUser-funktio, kun sivu latautuu
        document.addEventListener('DOMContentLoaded', fetchUser);

        
        // Open and close popup logic
        document.getElementById('openPopup').addEventListener('click', () => {
            document.getElementById('overlay').style.display = 'block';
            document.getElementById('popup').style.display = 'block';
        });
        document.getElementById('closePopup').addEventListener('click', () => {
            document.getElementById('overlay').style.display = 'none';
            document.getElementById('popup').style.display = 'none';
        });

        // Lisää input event listenerit create-lomakkeen kentille
        document.addEventListener('DOMContentLoaded', () => {
            // Create-lomakkeen kenttien event listenerit
            const createFields = ['popupType', 'width', 'height', 'position', 'animation', 'backgroundColor', 'textColor', 'content', 'delay', 'showDuration', 'startDate', 'endDate'];
            createFields.forEach(field => {
                const element = document.getElementById(field);
                if (element) {
                    element.addEventListener('input', () => updatePreview('create'));
                }
            });
        
            // Edit-lomakkeen kenttien event listenerit
            const editFields = createFields.map(field => 'edit' + field.charAt(0).toUpperCase() + field.slice(1));
            editFields.forEach(field => {
                const element = document.getElementById(field);
                if (element) {
                    element.addEventListener('input', () => updatePreview('edit'));
                }
            });
        
            // Alusta previewit
            updatePreview('create');
            updatePreview('edit');
        });

        // Fetch user info on page load
        fetch('/api/user')
            .then(response => response.json())
            .then(data => {
                if (data.user) {
                    document.getElementById('loginSection').style.display = 'none';
                    document.getElementById('userInfo').style.display = 'block';
                    document.getElementById('popupForm').style.display = 'block';
                    document.getElementById('popupList').style.display = 'block';
                    document.getElementById('userName').textContent = data.user.displayName;
                    fetchUserPopups();
                }
            });

        // Logout button logic
        document.getElementById('logoutButton').addEventListener('click', () => {
            fetch('/auth/logout', { method: 'POST' })
                .then(() => {
                    window.location.reload(); // Reload the page after logout
                });
        });

        // Handle popup creation form submission
        document.getElementById('createPopupForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Kerää tiedot turvallisesti
            const popupData = {
                popupType: document.getElementById('popupType')?.value || 'square',
                width: parseInt(document.getElementById('width')?.value) || 200,
                height: parseInt(document.getElementById('height')?.value) || 150,
                position: document.getElementById('position')?.value || 'center',
                animation: document.getElementById('animation')?.value || 'none',
                backgroundColor: document.getElementById('backgroundColor')?.value || '#ffffff',
                textColor: document.getElementById('textColor')?.value || '#000000',
                content: document.getElementById('content')?.value || '',
                
                // Ajastustiedot turvallisesti
                delay: parseInt(document.getElementById('delay')?.value) || 0,
                showDuration: parseInt(document.getElementById('showDuration')?.value) || 0,
                
                // Päivämäärät vain jos ne on asetettu
                startDate: document.getElementById('startDate')?.value || null,
                endDate: document.getElementById('endDate')?.value || null
            };
        
            console.log("Sending popup data:", popupData); // Debug
        
            try {
                const response = await fetch('/api/popups', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(popupData)
                });
        
                if (response.ok) {
                    alert('Popup created successfully!');
                    fetchUserPopups();
                    document.getElementById('createPopupForm').reset();
                    updatePreview();
                } else {
                    throw new Error('Failed to create popup');
                }
            } catch (error) {
                console.error('Error creating popup:', error);
                alert('Failed to create popup');
            }
        });

        // Hae ja näytä käyttäjän popupit ja embed koodi
        function fetchUserPopups() {
            fetch('/api/popups')
                .then(response => response.json())
                .then(data => {
                    const popupList = document.getElementById('popups');
                    popupList.innerHTML = '';
                    data.forEach(popup => {
                        const li = document.createElement('li');
                        li.className = 'popup-item';
                        li.innerHTML = `
                            <div class="popup-info">
                            <p><strong>Type:</strong> ${popup.popupType}</p>
                            <p><strong>Content:</strong> ${popup.content}</p>
                            <p><strong>Size:</strong> ${popup.width || 200}x${popup.height || 150}px</p>
                            <div class="embed-code">
                                <p><strong>Embed Code:</strong></p>
                                <textarea readonly class="embed-code-text" onclick="this.select()">
                        <script src="${window.location.origin}/popup-embed.js"></script>
                        <script>
                            window.addEventListener('load', function() {
                                ShowPopup('${popup._id}');
                            });
                        </script>
                                </textarea>
                            </div>
                            <div class="popup-actions">
                                <button onclick="editPopup('${popup._id}', ${JSON.stringify(popup)
                                    .replace(/"/g, '&quot;')})">Edit</button>
                                <button onclick="deletePopup('${popup._id}')">Delete</button>
                            </div>
                        `;
                        popupList.appendChild(li);
                    });
                });
        }

        // Edit a popup
        function editPopup(id, popupData) {
            // Parsitaan popup-data, jos se on string
            const popup = typeof popupData === 'string' ? JSON.parse(popupData) : popupData;
            
            // Aseta kaikki arvot lomakkeelle
            document.getElementById('editPopupId').value = id;
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

        // Handle popup update form submission
        document.getElementById('updatePopupForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('editPopupId').value;

            const popupData = {
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
                    fetchUserPopups();
                } else {
                    throw new Error('Failed to update popup');
                }
            } catch (error) {
                console.error('Error updating popup:', error);
                alert('Failed to update popup');
            }
        });

        // Cancel edit
        document.getElementById('cancelEdit').addEventListener('click', () => {
            document.getElementById('editPopupForm').style.display = 'none';
        });

        // Delete a popup
        function deletePopup(id) {
            if (confirm('Are you sure you want to delete this popup?')) {
                fetch(`/api/popups/${id}`, { method: 'DELETE' })
                    .then(response => response.json())
                    .then(data => {
                        if (data.message) {
                            alert(data.message);
                            fetchUserPopups(); // Refresh the popup list
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

        // Lisää event listenerit reaaliaikaiselle päivitykselle
        const updatePreviewInputs = ['PopupType', 'Width', 'Height', 'Position', 'Animation', 'BackgroundColor', 'TextColor', 'Content'];
        updatePreviewInputs.forEach(input => {
            document.getElementById(input)?.addEventListener('input', () => updatePreview(''));
            document.getElementById(`edit${input}`)?.addEventListener('input', () => updatePreview('edit'));
        });

        // Päivitä edit-popup funktio
        function editPopup(id, popup) {
            document.getElementById('editPopupId').value = id;
            document.getElementById('editPopupType').value = popup.PopupType;
            document.getElementById('editWidth').value = popup.width || 200;
            document.getElementById('editHeight').value = popup.height || 150;
            document.getElementById('editPosition').value = popup.position || 'center';
            document.getElementById('editAnimation').value = popup.animation || 'none';
            document.getElementById('editBackgroundColor').value = popup.backgroundColor || '#ffffff';
            document.getElementById('editTextColor').value = popup.textColor || '#000000';
            document.getElementById('editContent').value = popup.content;
            
            document.getElementById('editPopupForm').style.display = 'block';
            updatePreview('edit');
        }

        // Päivitä updatePopup funktio
        document.getElementById('updatePopupForm').addEventListener('submit', async (e) => {
            e.preventDefault();
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
                const response = await fetch(`/api/popups/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(popupData)
                });

                if (response.ok) {
                    alert('Popup updated successfully!');
                    document.getElementById('editPopupForm').style.display = 'none';
                    fetchUserPopups();
                } else {
                    throw new Error('Failed to update popup');
                }
            } catch (error) {
                console.error('Error updating popup:', error);
                alert('Failed to update popup');
            }
        });
