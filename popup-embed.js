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
            
            console.log("Received popup data:", popup); // Debug-viesti

            // Tarkista ajastusasetukset
            if (!shouldShowPopup(popup)) return;

            // Luo popup elementti
            createAndShowPopup(popup);
        } catch (error) {
            console.error('Error showing popup:', error);
        }
    };

    // Apufunktio ajastuksen tarkistamiseen
    function shouldShowPopup(popup) {
        // Tarkista frequency localStorage:sta
        const lastShown = localStorage.getItem(`popup_${popup._id}_lastShown`);
        if (lastShown) {
            const now = new Date();
            const lastShownDate = new Date(lastShown);

            const frequency = popup.timing?.frequency || 'always';
            switch (frequency) {
                case 'once':
                    return false;
                case 'daily':
                    if (now.getDate() === lastShownDate.getDate() && 
                        now.getMonth() === lastShownDate.getMonth() &&
                        now.getFullYear() === lastShownDate.getFullYear()) return false;
                    break;
                case 'weekly':
                    const weekDiff = (now - lastShownDate) / (1000 * 60 * 60 * 24 * 7);
                    if (weekDiff < 1) return false;
                    break;
            }
        }

        // Tarkista start ja end date
        const now = new Date();
        if (popup.timing?.startDate && new Date(popup.timing.startDate) > now) return false;
        if (popup.timing?.endDate && new Date(popup.timing.endDate) < now) return false;

        return true;
    }

    // Apufunktio popupin luomiseen ja näyttämiseen
    function createAndShowPopup(popup) {
        // Hae ja loki timing-tiedot
        const timing = popup.timing || {};
        const delay = parseInt(timing.delay || 0);
        const duration = parseInt(timing.showDuration || 0);

        console.log("Popup timing details:", {
            delay,
            duration,
            frequency: timing.frequency || 'always',
            startDate: timing.startDate,
            endDate: timing.endDate
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

        // Lisää close-funktio
        window.closePopup = function(id) {
            console.log("Closing popup:", id);
            const popup = document.getElementById(`popup-${id}`);
            if (popup) {
                popup.style.opacity = '0';
                setTimeout(() => {
                    popup.remove();
                }, 500);
                localStorage.setItem(`popup_${id}_lastShown`, new Date().toISOString());
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