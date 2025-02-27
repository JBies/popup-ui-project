// popup-embed.js
(function() {
    // Popup Manager
    window.ShowPopup = async function(popupId) {
        try {
            // Hae popup data API:sta
            const baseUrl = window.location.origin;
            const response = await fetch(`${baseUrl}/api/popups/embed/${popupId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const popup = await response.json();
            
            console.log("Received popup data:", popup);

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
    
        // Puhdistetaan loggaus näyttämään vain validit arvot
        console.log("Popup timing details:", {
            delay,
            duration,
            frequency: "always", // Nyt aina näytetään
            // Näytä päivämäärät vain jos ne eivät ole "default"
            startDate: timing.startDate && timing.startDate !== "default" ? timing.startDate : null,
            endDate: timing.endDate && timing.endDate !== "default" ? timing.endDate : null
        });

        // Luo popup
        const popupElement = document.createElement('div');
        popupElement.id = `popup-${popup._id}`;
        popupElement.style.position = 'fixed';
        popupElement.style.backgroundColor = popup.backgroundColor || '#ffffff';
        popupElement.style.color = popup.textColor || '#000000';
        popupElement.style.width = `${popup.width || 300}px`;
        popupElement.style.height = `${popup.height || 200}px`;
        popupElement.style.borderRadius = popup.popupType === 'circle' ? '50%' : '4px';
        popupElement.style.padding = '20px';
        popupElement.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
        popupElement.style.zIndex = '999999';
        popupElement.style.display = 'none'; // Piilotettu aluksi
        popupElement.style.alignItems = 'center';
        popupElement.style.justifyContent = 'center';
        popupElement.style.textAlign = 'center';
        popupElement.style.opacity = '0';
        popupElement.style.transition = 'opacity 0.5s ease-in-out';

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

        // Lisää sisältö
        popupElement.innerHTML = `
            <div style="width: 100%; position: relative;">
                ${popup.content}
                <div style="position: absolute; top: 5px; right: 5px;">
                    <button onclick="closePopup('${popup._id}')" style="background: transparent; border: none; cursor: pointer; font-size: 20px; color: ${popup.textColor};">×</button>
                </div>
            </div>
        `;

        // Lisää elementti sivulle
        document.body.appendChild(popupElement);

        // Lisää close-funktio - ei tallenna localStorage:een mitään
        window.closePopup = function(id) {
            console.log("Closing popup:", id);
            const popup = document.getElementById(`popup-${id}`);
            if (popup) {
                popup.style.opacity = '0';
                setTimeout(() => {
                    popup.remove();
                }, 500);
                // Poistettu localStorage tallennus
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
})();