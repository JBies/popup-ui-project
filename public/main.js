// js/main.js

import API from '../js/utils/api.js';
import PopupPreview from '../js/components/preview.js';
import PopupForm from '../js/components/popup-form.js';
import PopupList from '../js/components/popup-list.js';
import PopupDetails from '../js/components/popup-details.js'; 
import PopupPreviewModal from '../js/components/popup-preview-modal.js';
import ImageLibrary from '../js/components/image-library.js';
import ImageGallery from '../js/components/image-gallery.js';
import ImageUploader from '../js/components/image-uploader.js';
import ImagePicker from '../js/components/image-picker.js';

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
    try {
      // Alusta komponentit vasta käyttäjän kirjauduttua
      this.setupAuthListeners();
      
      // Alusta yleiset toiminnot
      this.setupGeneralListeners();
      
      // Alustaa preview-toiminnallisuuden (staattinen luokka)
      console.log("Initializing PopupPreview from main.js");
      PopupPreview.init();
      
      // Tarkista onko käyttäjä kirjautunut
      await this.checkUserAuthentication();
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
    try {
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
    } catch (error) {
      console.error('Error initializing components:', error);
    }
  }
}

// Käynnistä sovellus kun DOM on valmis
document.addEventListener('DOMContentLoaded', () => {
  const app = new PopupManager();
});