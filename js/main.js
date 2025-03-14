// js/main.js
// Pääskriptitiedosto, joka yhdistää kaikki komponentit

import API from './utils/api.js';
import PopupPreview from './components/preview.js';
import PopupForm from './components/popup-form.js';
import PopupList from './components/popup-list.js';
import ImageLibrary from './components/image-library.js';

/**
 * Sovelluksen pääluokka
 */
class PopupManager {
  constructor() {
    this.currentUser = null;
    this.components = {
      popupForm: null,
      popupList: null,
      imageLibrary: null
    };
    
    this.init();
  }

  /**
   * Alustaa sovelluksen
   */
  async init() {
    // Alusta komponentit vasta käyttäjän kirjauduttua
    this.setupAuthListeners();
    
    // Alusta yleiset toiminnot
    this.setupGeneralListeners();
    
    // Alustaa preview-toiminnallisuuden (staattinen luokka)
    PopupPreview.init();
    
    // Tarkista onko käyttäjä kirjautunut
    await this.checkUserAuthentication();
  }

  /**
   * Asettaa kuuntelijat kirjautumistoiminnoille
   */
  setupAuthListeners() {
    // Kirjaudu ulos -painike
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
      logoutButton.addEventListener('click', async () => {
        await API.logout();
        window.location.reload(); // Lataa sivu uudelleen kirjautumisen jälkeen
      });
    }
  }

  /**
   * Asettaa yleiset tapahtumakuuntelijat
   */
  setupGeneralListeners() {
    // Popupin avaus- ja sulkupainikkeet
    const openPopupBtn = document.getElementById('openPopup');
    if (openPopupBtn) {
      openPopupBtn.addEventListener('click', () => {
        document.getElementById('overlay').style.display = 'block';
        document.getElementById('popup').style.display = 'block';
      });
    }
    
    const closePopupBtn = document.getElementById('closePopup');
    if (closePopupBtn) {
      closePopupBtn.addEventListener('click', () => {
        document.getElementById('overlay').style.display = 'none';
        document.getElementById('popup').style.display = 'none';
      });
    }
    
    // Jos on Admin-painike, lisää toiminnallisuus sille
    const delayButton = document.getElementById('delayButton');
    if (delayButton) {
      delayButton.addEventListener('click', () => {
        console.log('5s viive käynnistetty');
        setTimeout(() => {
          console.log('5s on kulunut!');
          // Demo popupin avaamisesta
          document.getElementById('overlay').style.display = 'block';
          document.getElementById('popup').style.display = 'block';
        }, 5000);
      });
    }
  }

/**
   * Tarkistaa onko käyttäjä kirjautunut
   */
async checkUserAuthentication() {
  try {
    const response = await fetch('/api/user');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.user) {
      this.currentUser = data.user;
      
      // Jos käyttäjä on "pending"-tilassa, ohjataan pending-sivulle
      if (data.user.role === 'pending') {
        window.location.href = '/pending';
        return;
      }
      
      this.showUserInterface();
      
      // Jos käyttäjä on admin, näytä admin-valikko
      if (data.user.role === 'admin') {
        const adminMenu = document.getElementById('adminMenu');
        if (adminMenu) adminMenu.style.display = 'block';
      }
    }
  } catch (error) {
    console.error('Error checking authentication:', error);
  }
}

  /**
   * Näyttää kirjautuneen käyttäjän käyttöliittymän
   */
  showUserInterface() {
    // Piilota kirjautumisosio ja näytä käyttäjätiedot
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('userInfo').style.display = 'flex';
    document.getElementById('popupForm').style.display = 'block';
    document.getElementById('popupList').style.display = 'block';
    document.getElementById('userName').textContent = this.currentUser.displayName;
    
    // Alusta komponentit
    this.initComponents();
  }

  /**
   * Alustaa sovelluksen komponentit
   */
  initComponents() {
    // Alusta popup-lomake
    this.components.popupForm = new PopupForm();
    
    // Alusta popup-lista
    this.components.popupList = new PopupList();
    
    // Alusta kuvakirjasto
    this.components.imageLibrary = new ImageLibrary();
    this.components.imageLibrary.init();
    
    // Aseta globaalit viittaukset yhteensopivuuden vuoksi
    // Nämä mahdollistavat vanhan koodin toiminnan uudessa järjestelmässä
    window.fetchUserPopups = () => {
      if (this.components.popupList) {
        this.components.popupList.fetchUserPopups();
      }
    };
    
    window.editPopup = (id, popup) => {
      PopupForm.editPopup(id, popup);
    };
    
    window.deletePopup = (id) => {
      if (this.components.popupList) {
        this.components.popupList.deletePopup(id);
      }
    };
    
    window.updatePreview = (prefix) => {
      PopupPreview.updatePreview(prefix);
    };
  }
}

// Käynnistä sovellus kun DOM on valmis
document.addEventListener('DOMContentLoaded', () => {
  // Luodaan instanssi pääsovelluksesta
  const app = new PopupManager();
});