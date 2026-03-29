// popup-embed.js
(function() {
    // API-palvelimen URL
    const API_BASE_URL = 'https://popupmanager.net';
    // Näytetään popup vain kerran per istunto
    window.ShowPopup = async function(popupId) {
        try {
            console.log("ShowPopup called with ID:", popupId); // Debug
            
            // Hae popup data API:sta
            const baseUrl = 'https://popupmanager.net';
            const url = `${baseUrl}/api/popups/embed/${popupId}`;
            console.log("Fetching popup data from:", url);
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const popup = await response.json();
            
            console.log("Received popup data:", popup); // Debug
            
            // Tarkista ajastusasetukset (päivämäärät)
            if (!shouldShowPopup(popup)) {
                console.log("Popup not shown due to timing settings");
                return; // Popup ei näytetä ajastuksen takia, joten lopetetaan tähän
            }
            
            // Rekisteröi näyttökerta - VAIN jos popup todella näytetään
            try {
                await fetch(`${baseUrl}/api/popups/view/${popupId}`, { method: 'POST' });
                console.log("View registered for popup:", popupId);
            } catch (statsError) {
                console.error("Failed to register view:", statsError);
                // Jatketaan silti, tilastojen epäonnistuminen ei estä popupia näkymästä
            }
    
            // Tarkista popup-tyyppi
            if (popup.popupType === 'stats_only') {
                console.log("Stats-only popup detected, not showing visual popup");
                // Tilastojenkerääjä-popup ei näytä visuaalista popuppia
                return;
            }
    
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

 
    // Apufunktio popupin luomiseen ja näyttämiseen
    function createAndShowPopup(popup) {
        // Hae animaatio- ja sijaintiasetus (puuttuvat muuttujat aiheuttivat ReferenceError)
        const animation = popup.animation || 'none';
        const position  = popup.position  || 'center';

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
        if (popup.popupType === 'image') {
          // Kuvapopupeille kiinteä korkeus (background-size: contain tarvitsee container-koon)
          popupElement.style.height = `${popup.height || 300}px`;
        } else {
          // Tekstipopupeille sisältö määrää korkeuden — ei lukiteta 200px:iin
          popupElement.style.minHeight = `${popup.height || 100}px`;
          popupElement.style.height = 'auto';
        }
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
            // Firebase signed URL:eihin ei lisätä ?v= parametria (rikkoo allekirjoituksen)
            const isFirebaseUrl = popup.imageUrl.includes('storage.googleapis.com') || popup.imageUrl.includes('X-Goog-');
            const imageUrl = isFirebaseUrl ? popup.imageUrl : popup.imageUrl + (popup.version ? `?v=${popup.version}` : '');
            popupElement.style.background = `url("${imageUrl}") no-repeat center center`;
            popupElement.style.backgroundSize = 'contain';
            popupElement.style.padding = '0';
            
            // Lisää vain sulkunappi
            const closeButton = document.createElement('div');
            closeButton.innerHTML = "×";
            closeButton.style.position = 'absolute';
            closeButton.style.top = '-30px';
            closeButton.style.left = '50%';
            closeButton.style.transform = 'translateX(-50%)';
            closeButton.style.cursor = 'pointer';
            closeButton.style.fontSize = '26px';
            closeButton.style.width = '30px';
            closeButton.style.height = '30px';
            closeButton.style.display = 'flex';
            closeButton.style.alignItems = 'center';
            closeButton.style.justifyContent = 'center';
            closeButton.style.fontWeight = 'bold';
            closeButton.style.color = '#ffffff';
            closeButton.style.backgroundColor = '#000000';
            closeButton.style.borderRadius = '50%';
            closeButton.style.border = '2px solid #000000';
            closeButton.style.textShadow = '0 0 3px rgba(0,0,0,0.5)';
            closeButton.addEventListener('click', function(e) {
                e.stopPropagation(); // Estä klikkauksen leviäminen popupiin
                closePopup(popup._id);
            });
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

                popupElement.style.animation = `${animationName} 0.5s`;
                console.log(`Applied animation: ${animationName}`);
            }
    
            // Lisää kuva, jos on
            if (popup.imageUrl) {
                const imageElement = document.createElement('img');
                // Firebase signed URL:eihin ei lisätä ?v= parametria (rikkoo allekirjoituksen)
                const isFirebaseUrl = popup.imageUrl.includes('storage.googleapis.com') || popup.imageUrl.includes('X-Goog-');
                const imageUrl = isFirebaseUrl ? popup.imageUrl : popup.imageUrl + (popup.version ? `?v=${popup.version}` : '');
                imageElement.src = imageUrl;
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
            closeButton.addEventListener('click', function(e) {
                e.stopPropagation(); // Estä klikkauksen leviäminen popupiin
                closePopup(popup._id);
            });
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
                    fetch(`${API_BASE_URL}/api/popups/click/${popup._id}`, { method: 'POST' })
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
            const response = await fetch(`${API_BASE_URL}/api/popups/click/${popupId}`, { method: 'POST' });
            console.log("Click registered for popup:", popupId, "Status:", response.status);
            return true;
        } catch (error) {
            console.error("Failed to register click:", error);
            return false;
        }
    }
})();
