// VArmistaa että DOM on ladattu
document.addEventListener("DOMContentLoaded", function () {
    console.log("JS valmis.");

    // Kuvan latauksen käsittely create-lomakkeessa
    const imageInput = document.getElementById('image');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const imageUrlInput = document.getElementById('imageUrl');
    const removeImageBtn = document.getElementById('removeImage');
    
    if (imageInput) {
        imageInput.addEventListener('change', function(e) {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                
                console.log("Selected file:", file.name, file.type, file.size);
                
                // Näytä latausanimaatio tai -ilmoitus
                imagePreviewContainer.style.display = 'block';
                imagePreview.src = URL.createObjectURL(file);
                
                // Luo FormData-objekti tiedoston lähettämistä varten
                const formData = new FormData();
                formData.append('image', file);
                
                console.log("Uploading image...");
                
                // Lähetä kuva serverille
                fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                })
                .then(response => {
                    console.log("Upload response status:", response.status);
                    if (!response.ok) {
                        throw new Error('Image upload failed with status: ' + response.status);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log("Image upload successful, received URL:", data.imageUrl);
                    
                    // Tallenna saatu URL piilotettuun input-kenttään
                    imageUrlInput.value = data.imageUrl;
                    console.log("Set imageUrl input value to:", data.imageUrl);
                    console.log("Current imageUrl input value:", imageUrlInput.value);
                    
                    // Päivitä esikatselu
                    updatePreview('create');
                })
                .catch(error => {
                    console.error('Virhe kuvan latauksessa:', error);
                    alert('Virhe kuvan latauksessa: ' + error.message);
                    
                    // Tyhjennä tiedosto ja esikatselu virheen sattuessa
                    imageInput.value = '';
                    imagePreviewContainer.style.display = 'none';
                });
            }
        });
    }
    
    // Kuvan poistopainikkeen toiminta
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', function() {
            imageInput.value = '';
            imageUrlInput.value = '';
            imagePreviewContainer.style.display = 'none';
            
            // Päivitä esikatselu
            updatePreview('create');
        });
    }
    
    // Edit-lomakkeen toiminnot kuville
    const editImageInput = document.getElementById('editImage');
    const editImagePreviewContainer = document.getElementById('editImagePreviewContainer');
    const editImagePreview = document.getElementById('editImagePreview');
    const editImageUrlInput = document.getElementById('editImageUrl');
    const editRemoveImageBtn = document.getElementById('editRemoveImage');
    
    if (editImageInput) {
        editImageInput.addEventListener('change', function(e) {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                
                editImagePreviewContainer.style.display = 'block';
                editImagePreview.src = URL.createObjectURL(file);
                
                const formData = new FormData();
                formData.append('image', file);
                
                fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    editImageUrlInput.value = data.imageUrl;
                    updatePreview('edit');
                })
                .catch(error => {
                    console.error('Virhe kuvan latauksessa:', error);
                    alert('Virhe kuvan latauksessa');
                    
                    editImageInput.value = '';
                    editImagePreviewContainer.style.display = 'none';
                });
            }
        });
    }
    
    if (editRemoveImageBtn) {
        editRemoveImageBtn.addEventListener('click', function() {
            editImageInput.value = '';
            editImageUrlInput.value = '';
            editImagePreviewContainer.style.display = 'none';
            
            updatePreview('edit');
        });
    }


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
    // Lisää event listener "Lisää kuvia" -painikkeelle
    document.getElementById('uploadMoreImagesBtn').addEventListener('click', () => {
        // Simuloi tiedoston valitsimen avaamista
        document.getElementById('image').click();
    });


});

// Printtaa konsolille annetun tekstin
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


// avaa ja sulje popup
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

// hae käyttäjän tiedot ja näytä popupit
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

// logout napiin event listeneri
document.getElementById('logoutButton').addEventListener('click', () => {
    fetch('/auth/logout', { method: 'POST' })
        .then(() => {
            window.location.reload(); // Reload the page after logout
        });
});

// createPopupForm-käsittelijä
document.getElementById('createPopupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const popupType = document.getElementById('popupType').value;
    const content = document.getElementById('content').value.trim();
    
    // Tarkistetaan imageUrl
    const imageUrlInput = document.getElementById('imageUrl');
    const imageUrl = imageUrlInput ? imageUrlInput.value.trim() : '';
    
    console.log("Form submission:", {
        popupType,
        content,
        imageUrl
    });
    
    // Validoi lomakkeella
    if (popupType === 'image' && !imageUrl) {
        alert('Kuva on pakollinen, kun popupin tyyppi on "Image"');
        return;
    }
    
    if (!content && !imageUrl) {
        alert('Popupissa on oltava joko sisältöä tai kuva');
        return;
    }
    
    // Kerää tiedot turvallisesti
    const popupData = {
        popupType: popupType,
        width: parseInt(document.getElementById('width').value) || 200,
        height: parseInt(document.getElementById('height').value) || 150,
        position: document.getElementById('position').value,
        animation: document.getElementById('animation').value,
        backgroundColor: document.getElementById('backgroundColor').value,
        textColor: document.getElementById('textColor').value,
        content: content,
        imageUrl: imageUrl, // Varmistetaan että tämä tulee mukaan
        
        // Ajastustiedot turvallisesti
        delay: parseInt(document.getElementById('delay').value) || 0,
        showDuration: parseInt(document.getElementById('showDuration').value) || 0,
        
        // Päivämäärät vain jos ne on asetettu
        startDate: document.getElementById('startDate').value || null,
        endDate: document.getElementById('endDate').value || null
    };

    console.log("Sending popup data:", popupData); // Debug
    
    try {
        const response = await fetch('/api/popups', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(popupData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Server returned error:", errorData);
            throw new Error(errorData.message || 'Failed to create popup');
        }
        
        const responseData = await response.json();
        console.log("Popup created successfully:", responseData);
        
        alert('Popup created successfully!');
        fetchUserPopups();
        document.getElementById('createPopupForm').reset();
        document.getElementById('imagePreviewContainer').style.display = 'none';
        document.getElementById('imageUrl').value = '';
        updatePreview('create');
    } catch (error) {
        console.error('Error creating popup:', error);
        alert('Error creating popup: ' + error.message);
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
    
    console.log("Editing popup:", popup); // Debug - lisätään tämä lokitus
    
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
    
    // Käsittele kuva
    const editImageUrlInput = document.getElementById('editImageUrl');
    const editImagePreviewContainer = document.getElementById('editImagePreviewContainer');
    const editImagePreview = document.getElementById('editImagePreview');
    
    if (editImageUrlInput && editImagePreviewContainer && editImagePreview) {
        if (popup.imageUrl) {
            console.log("Setting image preview:", popup.imageUrl); // Debug
            editImageUrlInput.value = popup.imageUrl;
            editImagePreview.src = popup.imageUrl;
            editImagePreviewContainer.style.display = 'block';
        } else {
            editImageUrlInput.value = '';
            editImagePreviewContainer.style.display = 'none';
        }
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

    // Validoi lomake ennen lähetystä
    if (popupType === 'image' && !imageUrl) {
        alert('Kuva on pakollinen, kun popupin tyyppi on "Image"');
        return;
    }
    
    if (!content && !imageUrl) {
        alert('Joko sisältö tai kuva on pakollinen');
        return;
    }

    const popupData = {
        popupType: document.getElementById('editPopupType')?.value || 'square',
        width: document.getElementById('editWidth')?.value || 200,
        height: document.getElementById('editHeight')?.value || 150,
        position: document.getElementById('editPosition')?.value || 'center',
        animation: document.getElementById('editAnimation')?.value || 'none',
        backgroundColor: document.getElementById('editBackgroundColor')?.value || '#ffffff',
        textColor: document.getElementById('editTextColor')?.value || '#000000',
        content: document.getElementById('editContent')?.value || '',
        // Lisää kuva-URL
        imageUrl: document.getElementById('editImageUrl')?.value || '',
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
    // Hae kuva-URL
    const imageUrl = document.getElementById(prefix === 'create' ? 'imageUrl' : 'editImageUrl')?.value || '';

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
    
    // Käsittele "image"-popup-tyyppi erikseen
    if (popupType === 'image' && imageUrl) {
        // Jos tyyppi on "image" ja kuva-URL on määritetty, käytetään kuvaa suoraan popupina
        previewPopup.style.background = `url(${imageUrl}) no-repeat center center`;
        previewPopup.style.backgroundSize = 'contain';
        previewPopup.style.padding = '0';
    } else {
        // Muussa tapauksessa käytetään normaalia popupia
        previewPopup.style.backgroundColor = backgroundColor;
        previewPopup.style.color = textColor;
        previewPopup.style.padding = '10px';
        
        const contentWrapper = document.createElement('div');
        contentWrapper.style.width = 'center'; // Sisältö keskellä
        contentWrapper.innerHTML = content;
        previewPopup.appendChild(contentWrapper);
        
        // Jos kuva-URL on määritetty (mutta tyyppi ei ole "image"), lisää kuva popupiin
        if (imageUrl && popupType !== 'image') {
            const image = document.createElement('img');
            image.src = imageUrl;
            image.style.maxWidth = '100%';
            image.style.maxHeight = '70%';
            image.style.objectFit = 'contain';
            image.style.marginTop = '10px';
            previewPopup.appendChild(image);
        }
    }
    
    previewPopup.style.width = `${width}px`;
    previewPopup.style.height = `${height}px`;
    previewPopup.style.borderRadius = popupType === 'circle' ? '50%' : '4px';
    previewPopup.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    previewPopup.style.position = 'absolute';
    previewPopup.style.overflow = 'auto';
    previewPopup.style.display = 'flex';
    previewPopup.style.alignItems = 'center';
    previewPopup.style.justifyContent = 'center';
    previewPopup.style.textAlign = 'center';
    previewPopup.style.fontSize = '16px';

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

    // Lisää nämä toiminnot script.js tiedostoon

// Kuvakirjaston lataaminen
async function loadImageLibrary() {
    try {
        const response = await fetch('/api/images');
        if (!response.ok) {
            throw new Error('Failed to fetch images');
        }
        
        const images = await response.json();
        const imageGrid = document.getElementById('imageGrid');
        const imagePickerGrid = document.getElementById('imagePickerGrid');
        
        // Tyhjennä gridit
        imageGrid.innerHTML = '';
        imagePickerGrid.innerHTML = '';
        
        if (images.length === 0) {
            imageGrid.innerHTML = '<p>Ei kuvia kirjastossa</p>';
            imagePickerGrid.innerHTML = '<p>Ei kuvia kirjastossa</p>';
            return;
        }
        
        // Lisää kuvat molempiin grideihin
        images.forEach(image => {
            // Kuvakirjaston näkymä
            const imageItem = document.createElement('div');
            imageItem.className = 'image-item';
            imageItem.innerHTML = `
                <img src="${image.url}" alt="${image.name}">
                <div class="image-info">
                    <span>${formatFileSize(image.size)}</span>
                </div>
                <div class="image-actions">
                    <button data-action="use" data-id="${image._id}" data-url="${image.url}">Käytä</button>
                    <button data-action="details" data-id="${image._id}">Info</button>
                    <button data-action="delete" data-id="${image._id}">Poista</button>
                </div>
            `;
            imageGrid.appendChild(imageItem);
            
            // Valitsin-dialoogi näkymä
            const pickerItem = document.createElement('div');
            pickerItem.className = 'picker-image-item';
            pickerItem.dataset.id = image._id;
            pickerItem.dataset.url = image.url;
            pickerItem.innerHTML = `<img src="${image.url}" alt="${image.name}">`;
            imagePickerGrid.appendChild(pickerItem);
        });
        
        // Lisää event listenerit kuvakirjaston toiminnoille, kun kuvat on jo luotu
        addImageLibraryEventListeners(imageGrid, imagePickerGrid);
        
        // Näytä kuvakirjasto
        document.getElementById('imageLibrary').style.display = 'block';
    } catch (error) {
        console.error('Error loading image library:', error);
        alert('Virhe kuvakirjaston lataamisessa');
    }
}

// Event listenerit kuvakirjaston toiminnoille
function addImageLibraryEventListeners(imageGrid, imagePickerGrid) {
    // Kuvakirjaston toiminnot
    imageGrid.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (button) {
            // Käsitellään napin klikkaus (käytä/poista/info)
            const action = button.dataset.action;
            const imageId = button.dataset.id;
            const imageUrl = button.dataset.url;
            
            if (action === 'use') {
                selectImageFromLibrary(imageUrl);
            } else if (action === 'delete') {
                if (confirm('Haluatko varmasti poistaa tämän kuvan?')) {
                    deleteImage(imageId);
                }
            } else if (action === 'details') {
                showImageDetails(imageId);
            }
        } else {
            // Jos klikataan kuvaa (ei nappia), näytetään tiedot
            const imageItem = e.target.closest('.image-item');
            if (imageItem) {
                const useButton = imageItem.querySelector('button[data-action="use"]');
                if (useButton) {
                    const imageId = useButton.dataset.id;
                    showImageDetails(imageId);
                }
            }
        }
    });
    
    // Kuvavalitsin-dialoogi event listenerit
    if (imagePickerGrid) {
        imagePickerGrid.addEventListener('click', (e) => {
            const item = e.target.closest('.picker-image-item');
            if (!item) return;
            
            // Poista aiempi valinta
            const selectedItems = imagePickerGrid.querySelectorAll('.selected');
            selectedItems.forEach(el => el.classList.remove('selected'));
            
            // Lisää valinta klikattuun kuvaan
            item.classList.add('selected');
            
            // Tallenna valitun kuvan tiedot
            window.selectedImageUrl = item.dataset.url;
            window.selectedImageId = item.dataset.id;
        });
        
        // Kaksoisklikkaus kuvan valitsemiseen
        imagePickerGrid.addEventListener('dblclick', (e) => {
            const item = e.target.closest('.picker-image-item');
            if (!item) return;
            
            selectImageFromLibrary(item.dataset.url);
        });
    }
    
    // Kuvavalitsimen sulkeminen
    const closeImagePicker = document.getElementById('closeImagePicker');
    if (closeImagePicker) {
        closeImagePicker.addEventListener('click', () => {
            document.getElementById('imagePickerDialog').style.display = 'none';
        });
    }
    
    // Kuvavalitsimen avaaminen create-lomakkeelta
    const selectImageBtn = document.getElementById('selectImageBtn');
    if (selectImageBtn) {
        selectImageBtn.addEventListener('click', () => {
            document.getElementById('imagePickerDialog').style.display = 'flex';
            window.imagePickerTarget = 'create';
        });
    }
    
    // Kuvavalitsimen avaaminen edit-lomakkeelta
    const editSelectImageBtn = document.getElementById('editSelectImageBtn');
    if (editSelectImageBtn) {
        editSelectImageBtn.addEventListener('click', () => {
            document.getElementById('imagePickerDialog').style.display = 'flex';
            window.imagePickerTarget = 'edit';
        });
    }
    
    // Click outside modal to close
    const imagePickerDialog = document.getElementById('imagePickerDialog');
    if (imagePickerDialog) {
        imagePickerDialog.addEventListener('click', (e) => {
            if (e.target === imagePickerDialog) {
                imagePickerDialog.style.display = 'none';
            }
        });
    }
    
    // Kuvan tiedot -dialogin sulkeminen
    const closeImageDetails = document.getElementById('closeImageDetails');
    if (closeImageDetails) {
        closeImageDetails.addEventListener('click', () => {
            document.getElementById('imageDetailsDialog').style.display = 'none';
        });
    }
    
    // Click outside modal to close
    const imageDetailsDialog = document.getElementById('imageDetailsDialog');
    if (imageDetailsDialog) {
        imageDetailsDialog.addEventListener('click', (e) => {
            if (e.target === imageDetailsDialog) {
                imageDetailsDialog.style.display = 'none';
            }
        });
    }
}

// Kuvan valinta kirjastosta
function selectImageFromLibrary(imageUrl) {
    const target = window.imagePickerTarget || 'create';
    
    if (target === 'create') {
        document.getElementById('imageUrl').value = imageUrl;
        document.getElementById('imagePreview').src = imageUrl;
        document.getElementById('imagePreviewContainer').style.display = 'block';
    } else if (target === 'edit') {
        document.getElementById('editImageUrl').value = imageUrl;
        document.getElementById('editImagePreview').src = imageUrl;
        document.getElementById('editImagePreviewContainer').style.display = 'block';
    }
    
    // Päivitä esikatselu
    updatePreview(target === 'edit' ? 'edit' : 'create');
    
    // Sulje dialogi
    document.getElementById('imagePickerDialog').style.display = 'none';
    
    // Nollaa valinta
    window.selectedImageUrl = null;
    window.selectedImageId = null;
    window.imagePickerTarget = null;
}

// Kuvan poisto
async function deleteImage(imageId) {
    try {
        const response = await fetch(`/api/images/${imageId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Kuva poistettu onnistuneesti');
            loadImageLibrary(); // Päivitä kuvakirjasto
        } else {
            if (data.message.includes('käytetään popupeissa')) {
                alert('Kuvaa ei voi poistaa, koska sitä käytetään aktiivisissa popupeissa');
            } else {
                alert('Virhe kuvan poistossa: ' + data.message);
            }
        }
    } catch (error) {
        console.error('Error deleting image:', error);
        alert('Virhe kuvan poistossa');
    }
}

// Apufunktio tiedoston koon muotoiluun
function formatFileSize(bytes) {
    if (bytes < 1024) {
        return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(1) + ' KB';
    } else {
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
}

// Lisää kuvakirjaston lataus käyttäjän kirjautumisen jälkeen
function showUserInterface() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('userInfo').style.display = 'block';
    document.getElementById('popupForm').style.display = 'block';
    document.getElementById('popupList').style.display = 'block';
    document.getElementById('userName').textContent = currentUser.displayName;
    
    fetchUserPopups();
    loadImageLibrary(); // Lataa kuvakirjasto
}

// Näytä kuvan tiedot ja käyttö
async function showImageDetails(imageId) {
    try {
        const response = await fetch(`/api/images/${imageId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch image details');
        }
        
        const data = await response.json();
        const { image, popups } = data;
        
        // Täytä kuvan tiedot dialogiin
        document.getElementById('detailsImage').src = image.url;
        document.getElementById('detailsName').textContent = image.name;
        document.getElementById('detailsSize').textContent = formatFileSize(image.size);
        document.getElementById('detailsDate').textContent = new Date(image.createdAt).toLocaleDateString();
        
        // Näytä lista popupeista, joissa kuvaa käytetään
        const popupList = document.getElementById('detailsPopupList');
        popupList.innerHTML = '';
        
        if (popups.length === 0) {
            popupList.innerHTML = '<li class="no-popups-message">Kuvaa ei käytetä missään popupissa</li>';
        } else {
            popups.forEach(popup => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <strong>${popup.popupType}</strong> - 
                    ${popup.content ? truncateText(popup.content, 30) : 'Ei sisältöä'}
                    <em>(Luotu: ${new Date(popup.createdAt).toLocaleDateString()})</em>
                `;
                popupList.appendChild(li);
            });
        }
        
        // Näytä dialogi
        document.getElementById('imageDetailsDialog').style.display = 'flex';
    } catch (error) {
        console.error('Error loading image details:', error);
        alert('Virhe kuvan tietojen lataamisessa');
    }
}

// Apufunktio tekstin lyhentämiseen
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

// Päivitä olemassa oleva käyttäjätietojen hakufunktio
fetch('/api/user')
    .then(response => response.json())
    .then(data => {
        if (data.user) {
            currentUser = data.user;
            showUserInterface();
        }
    });

    // Tyhjennä ja päivitä esikatselu
    previewContainer.innerHTML = '';
    previewWrapper.appendChild(previewPopup);
    previewContainer.appendChild(previewWrapper);
}
