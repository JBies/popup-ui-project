// js/main.js

import API from './utils/api.js';
import PopupPreview from './components/preview.js';
import PopupForm from './components/popup-form.js';
import PopupList from './components/popup-list.js';
import PopupDetails from './components/popup-details.js'; 
import PopupPreviewModal from './components/popup-preview-modal.js';
import ImageLibrary from './components/image-library.js';
import ImageGallery from './components/image-gallery.js';
import ImageUploader from './components/image-uploader.js';
import ImagePicker from './components/image-picker.js';

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
    
    // Alustetaan sovellus, kun DOM on täysin latautunut
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  /**
   * Alustaa sovelluksen
   */
  async init() {
    try {
      // Tarkista onko käyttäjä kirjautunut
      await this.checkUserAuthentication();
      
      // Alusta yleiset toiminnot
      this.setupGeneralListeners();
      
      // Alustaa preview-toiminnallisuuden (staattinen luokka)
      console.log("Initializing PopupPreview from main.js");
      PopupPreview.init();
    } catch (error) {
      console.error("Error in PopupManager.init():", error);
    }
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
    
    // Alustetaan kirjautumiseen liittyvät kuuntelijat
    this.setupAuthListeners();
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
    const loginSection = document.getElementById('loginSection');
    const userInfo = document.getElementById('userInfo');
    const popupForm = document.getElementById('popupForm');
    const popupList = document.getElementById('popupList');
    const userName = document.getElementById('userName');
    
    if (loginSection) loginSection.style.display = 'none';
    if (userInfo) userInfo.style.display = 'flex';
    if (popupForm) popupForm.style.display = 'block';
    if (popupList) popupList.style.display = 'block';
    if (userName) userName.textContent = this.currentUser.displayName;
    
    // Alusta komponentit vasta kun käyttöliittymä on näytetty
    // Pieni viive varmistaa että DOM on päivittynyt
    setTimeout(() => {
      this.initComponents();
    }, 300);
  }

  /**
   * Alustaa sovelluksen komponentit
   */
  initComponents() {
    try {
      console.log("Initializing components...");
      
      // Alusta popup-lomake
      this.components.popupForm = new PopupForm();
      
      // Alusta popup-lista
      this.components.popupList = new PopupList();
      
      // Alusta kuvakirjasto
      this.components.imageLibrary = new ImageLibrary();
      
      // Aseta globaalit viittaukset yhteensopivuuden vuoksi
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
      
      console.log("Components initialized successfully");
    } catch (error) {
      console.error('Error initializing components:', error);
    }
  }