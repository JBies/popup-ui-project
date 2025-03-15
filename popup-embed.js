// popup-embed.js
(function() {
    // Popup Manager
    window.ShowPopup = async function(popupId) {
        try {
            console.log("ShowPopup called with ID:", popupId); // Debug
            
            // Hae popup data API:sta
            const baseUrl = window.location.origin;
            const url = `${baseUrl}/api/popups/embed/${popupId}`;
            console.log("Fetching popup data from:", url);
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const popup = await response.json();
            
            console.log("Received popup data:", popup); // Debug
            
            // Rekisteröi näyttökerta
            try {
                await fetch(`${baseUrl}/api/popups/view/${popupId}`, { method: 'POST' });
                console.log("View registered for popup:", popupId);
            } catch (statsError) {
                console.error("Failed to register view:", statsError);
                // Jatketaan silti, tilastojen epäonnistuminen ei estä popupia näkymästä
            }

            // Tarkista vain ajastusasetukset (päivämäärät)
            if (!shouldShowPopup(popup)) return;

            // Luo popup elementti
            createAndShowPopup(popup);
        } catch (error) {
            console.error('Error showing popup:', error);
        }
    };

    // Apufunktio ajastuksen tarkistamiseen - vain päivämäärät, ei frequency
    function shouldShowPopup(popup) {
        // Tarkista vain start ja end date
        const now = new Date();
        
        // Tarkista onko start date validi ja tulevaisuudessa
        if (popup.timing?.startDate && popup.timing.startDate !== 'default') {
            try {
                const startDate = new Date(popup.timing.startDate);
                // Varmista että pystytään luomaan validi päivämäärä
                if (!isNaN(startDate.getTime())) {
                    if (startDate > now) {
                        console.log("Start date is in future, not showing popup yet");
                        return false;
                    }
                }
            } catch (e) {
                console.warn("Invalid start date, ignoring:", popup.timing.startDate);
            }
        }
        
        // Tarkista onko end date validi ja menneisyydessä
        if (popup.timing?.endDate && popup.timing.endDate !== 'default') {
            try {
                const endDate = new Date(popup.timing.endDate);
                // Varmista että pystytään luomaan validi päivämäärä
                if (!isNaN(endDate.getTime())) {
                    if (endDate < now) {
                        console.log("End date has passed, not showing popup anymore");
                        return false;
                    }
                }
            } catch (e) {
                console.warn("Invalid end date, ignoring:", popup.timing.endDate);
            }
        }
    
        return true;
    }

    // Apufunktio klikkausten rekisteröintiin
    async function registerClick(popupId) {
        try {
            const baseUrl = window.location.origin;
            await fetch(`${baseUrl}/api/popups/click/${popupId}`, { method: 'POST' });
            console.log("Click registered for popup:", popupId);
        } catch (error) {
            console.error("Failed to register click:", error);
        }
    }

    // Apufunktio popupin luomiseen ja näyttämiseen
    function createAndShowPopup(popup) {
        // Hae ja loki timing-tiedot
        const timing = popup.timing || {};
        
        // Varmista että delay ja duration ovat numeroita
        let delay = 0;
        let duration = 0;
        
        try {
            delay = parseInt(timing.delay);
            if (isNaN(delay)) delay = 0;
        } catch (e) {
            console.warn("Invalid delay value, defaulting to 0");
        }
        
        try {
            duration = parseInt(timing.showDuration);
            if (isNaN(duration)) duration = 0;
        } catch (e) {
            console.warn("Invalid duration value, defaulting to 0");
        }
    
        // Luo popup
        const popupElement = document.createElement('div');
        popupElement.id = `popup-${popup._id}`;
        popupElement.style.position = 'fixed';
        popupElement.style.width = `${popup.width || 300}px`;
        popupElement.style.height = `${popup.height || 200}px`;
        popupElement.style.zIndex = '999999';
        popupElement.style.display = 'none'; // Piilotettu aluksi
        popupElement.style.opacity = '0';
        popupElement.style.transition = 'opacity 0.5s ease-in-out';
        
        // Tulostusloki linkkiä varten
        console.log("Popup link URL:", popup.linkUrl);
        
        // Lisää kursori-tyyli ja klikattavuuden ilmaisin jos linkki on määritetty
        if (popup.linkUrl && popup.linkUrl.trim() !== '') {
            console.log("This popup has a link - making it clickable");
            popupElement.style.cursor = 'pointer';
            // Lisätään linkki-indikaattori (pieni ikoni)
            const linkIndicator = document.createElement('div');
            linkIndicator.innerHTML = '🔗';
            linkIndicator.style.position = 'absolute';
            linkIndicator.style.bottom = '5px';
            linkIndicator.style.right = '5px';
            linkIndicator.style.fontSize = '16px';
            linkIndicator.style.opacity = '0.7';
            linkIndicator.style.zIndex = '1000000';
            popupElement.appendChild(linkIndicator);
        }
        
        // Käsittele "image"-popup-tyyppi erikseen
        if (popup.popupType === 'image' && popup.imageUrl) {
            popupElement.style.background = `url("${popup.imageUrl}") no-repeat center center`;
            popupElement.style.backgroundSize = 'contain';
            popupElement.style.padding = '0';
            
            // Lisää vain sulkunappi
            const closeButton = document.createElement('div');
            closeButton.innerHTML = "×";
            closeButton.style.position = 'absolute';
            closeButton.style.top = '10px';
            closeButton.style.right = '10px';
            closeButton.style.cursor = 'pointer';
            closeButton.style.fontSize = '24px';
            closeButton.style.fontWeight = 'bold';
            closeButton.style.color = '#ffffff'; // Valkoinen sulkunappi näkyy paremmin kuvan päällä
            closeButton.style.textShadow = '0 0 3px rgba(0,0,0,0.5)'; // Varjo näkyvyyden parantamiseksi
            closeButton.onclick = function(e) {
                e.stopPropagation(); // Estä klikkauksen leviäminen popupiin
                closePopup(popup._id);
            };
            popupElement.appendChild(closeButton);
        } else {
            // Muussa tapauksessa käytetään normaalia popupia
            popupElement.style.backgroundColor = popup.backgroundColor || '#ffffff';
            popupElement.style.color = popup.textColor || '#000000';
            popupElement.style.borderRadius = popup.popupType === 'circle' ? '50%' : '4px';
            popupElement.style.padding = '20px';
            popupElement.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
            popupElement.style.display = 'none'; // Tärkeä: aluksi piilotettu
            popupElement.style.alignItems = 'center';
            popupElement.style.justifyContent = 'center';
            popupElement.style.textAlign = 'center';
            popupElement.style.overflow = 'auto';
            
            // Luodaan sisältökontaineri
            const contentContainer = document.createElement('div');
            contentContainer.style.width = '100%';
            contentContainer.style.height = '100%';
            contentContainer.style.display = 'flex';
            contentContainer.style.flexDirection = 'column';
            contentContainer.style.alignItems = 'center';
            contentContainer.style.justifyContent = 'center';
            contentContainer.style.position = 'relative';
    
            // Lisää sisältö, jos on
            if (popup.content) {
                const contentElement = document.createElement('div');
                contentElement.innerHTML = popup.content;
                contentElement.style.maxWidth = '100%';
                contentElement.style.marginBottom = popup.imageUrl ? '10px' : '0';
                contentContainer.appendChild(contentElement);
            }

            // Lisää animaatio
            if (animation !== 'none') {
                let animationClass;
    
                    if (animation === 'fade') {
                    popupElement.style.opacity = '0';
                    popupElement.style.transition = 'opacity 0.5s ease-in-out';
                    setTimeout(() => {
                        popupElement.style.opacity = '1';
                    }, 10);
                    } else if (animation === 'slide') {
                    // Valitaan animaation suunta sijainnin perusteella
                    let startTransform;
                    
                    switch (position) {
                        case 'top-left':
                        case 'top-right':
                        startTransform = 'translateY(-50px)';
                        break;
                        case 'bottom-left':
                        case 'bottom-right':
                        startTransform = 'translateY(50px)';
                        break;
                        default: // center
                        startTransform = 'translateY(-50px)';
                    }
        
        popupElement.style.transform = startTransform;
        popupElement.style.opacity = '0';
        popupElement.style.transition = 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out';
        setTimeout(() => {
            popupElement.style.transform = 'translateY(0)';
            popupElement.style.opacity = '1';
        }, 10);
        }
    }

            // Lisää animaatio jos määritetty
            if (popup.animation !== 'none') {
                let animationName = '';
                switch (popup.position) {
                    case 'top-left':
                    case 'top-right':
                        animationName = 'slideInTop';
                        break;
                    case 'bottom-left':
                    case 'bottom-right':
                        animationName = 'slideInBottom';
                        break;
                    default:
                        animationName = 'slideInTop'; // Oletus ylhäältä alas
                }

                // Jos animaatio on "slide", käytetään oikeaa animaatiota sijainnin mukaan
                if (popup.animation === 'slide') {
                    switch (popup.position) {
                        case 'top-left':
                        case 'bottom-left':
                            animationName = 'slideInLeft';
                            break;
                        case 'top-right':
                        case 'bottom-right':
                            animationName = 'slideInRight';
                            break;
                        default:
                            animationName = 'slideInTop'; // Oletus ylhäältä alas
                    }
                } else if (popup.animation === 'fade') {
                    animationName = 'fadeIn';
                }

                previewPopup.style.animation = `${animationName} 0.5s`;
                console.log(`Applied animation: ${animationName}`);
            }
    
            // Lisää kuva, jos on
            if (popup.imageUrl) {
                const imageElement = document.createElement('img');
                imageElement.src = popup.imageUrl;
                imageElement.style.maxWidth = '100%';
                imageElement.style.maxHeight = '70%';
                imageElement.style.objectFit = 'contain';
                contentContainer.appendChild(imageElement);
            }
    
            // Lisää sulkunappi
            const closeButton = document.createElement('div');
            closeButton.innerHTML = "×";
            closeButton.style.position = 'absolute';
            closeButton.style.top = '10px';
            closeButton.style.right = '10px';
            closeButton.style.cursor = 'pointer';
            closeButton.style.fontSize = '24px';
            closeButton.style.fontWeight = 'bold';
            closeButton.style.color = popup.textColor;
            closeButton.onclick = function(e) {
                e.stopPropagation(); // Estä klikkauksen leviäminen popupiin
                closePopup(popup._id);
            };
            contentContainer.appendChild(closeButton);
    
            // Lisää sisältökontaineri popupiin
            popupElement.appendChild(contentContainer);
        }
    
        // Aseta sijainti
        switch (popup.position) {
            case 'top-left':
                popupElement.style.top = '20px';
                popupElement.style.left = '20px';
                break;
            case 'top-right':
                popupElement.style.top = '20px';
                popupElement.style.right = '20px';
                break;
            case 'bottom-left':
                popupElement.style.bottom = '20px';
                popupElement.style.left = '20px';
                break;
            case 'bottom-right':
                popupElement.style.bottom = '20px';
                popupElement.style.right = '20px';
                break;
            default:
                popupElement.style.top = '50%';
                popupElement.style.left = '50%';
                popupElement.style.transform = 'translate(-50%, -50%)';
        }
    
        // Lisää klikkaus-käsittelijä, jos linkki on määritetty
        if (popup.linkUrl && popup.linkUrl.trim() !== '') {
            console.log("Adding click handler to popup with link:", popup.linkUrl);
            popupElement.addEventListener('click', function() {
                console.log("Popup clicked! Navigating to:", popup.linkUrl);
                
                // Rekisteröi klikkaus
                try {
                    const baseUrl = window.location.origin;
                    fetch(`${baseUrl}/api/popups/click/${popup._id}`, { method: 'POST' })
                        .then(response => {
                            console.log("Click registered successfully:", response.status);
                        })
                        .catch(error => {
                            console.error("Error registering click:", error);
                        });
                } catch (error) {
                    console.error("Failed to register click:", error);
                }
                
                // Avaa linkki uudessa välilehdessä
                window.open(popup.linkUrl, '_blank');
                
                // Sulje popup
                closePopup(popup._id);
            });
        }
    
        // Lisää elementti sivulle
        document.body.appendChild(popupElement);
    
        // Määritä globaali closePopup-funktio
        window.closePopup = function(id) {
            console.log("Closing popup:", id);
            const popup = document.getElementById(`popup-${id}`);
            if (popup) {
                popup.style.opacity = '0';
                setTimeout(() => {
                    popup.remove();
                }, 500);
            }
        };
    
        console.log(`Popup will show after ${delay} seconds and close after ${duration > 0 ? duration : 'never'} seconds`);
    
        // Näytä popup viiveellä
        setTimeout(() => {
            popupElement.style.display = 'flex';
            
            // Animoi sisääntulo
            setTimeout(() => {
                popupElement.style.opacity = '1';
            }, 10); // Pieni viive jotta display:flex ehtii vaikuttaa
    
            console.log(`Popup shown, will ${duration > 0 ? `close after ${duration} seconds` : 'stay open until closed'}`);
    
            // Sulje automaattisesti jos duration on asetettu
            if (duration > 0) {
                setTimeout(() => {
                    console.log(`Auto-closing popup after ${duration} seconds`);
                    closePopup(popup._id);
                }, duration * 1000);
            }
        }, delay * 1000);
    }
    
    // Apufunktio klikkausten rekisteröintiin
    async function registerClick(popupId) {
        try {
            const baseUrl = window.location.origin;
            const response = await fetch(`${baseUrl}/api/popups/click/${popupId}`, { method: 'POST' });
            console.log("Click registered for popup:", popupId, "Status:", response.status);
            return true;
        } catch (error) {
            console.error("Failed to register click:", error);
            return false;
        }
    }
})();