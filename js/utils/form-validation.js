// js/utils/form-validation.js
// Lomakkeiden validointifunktiot

/**
 * FormValidation-luokka sisältää lomakkeiden validointisääntöjä
 */
class FormValidation {
    /**
     * Validoi popup-lomake
     * @param {Object} formData - Lomakkeen tiedot
     * @returns {Object} Validointitulos { isValid, errors }
     */
    static validatePopupForm(formData) {
      const errors = [];
      let isValid = true;
      
      // Tarkista, että vähintään content tai imageUrl on annettu
      if ((!formData.content || formData.content.trim() === '') && 
          (!formData.imageUrl || formData.imageUrl.trim() === '')) {
        errors.push('Popupissa on oltava joko sisältöä tai kuva');
        isValid = false;
      }
      
      // Jos tyyppi on "image", kuva on pakollinen
      if (formData.popupType === 'image' && (!formData.imageUrl || formData.imageUrl.trim() === '')) {
        errors.push('Kuva on pakollinen, kun popupin tyyppi on "Image"');
        isValid = false;
      }
      
      // Tarkista, että leveys ja korkeus ovat sallituissa rajoissa
      const width = parseInt(formData.width);
      const height = parseInt(formData.height);
      
      if (isNaN(width) || width < 100 || width > 800) {
        errors.push('Leveyden on oltava välillä 100-800 pikseliä');
        isValid = false;
      }
      
      if (isNaN(height) || height < 100 || height > 600) {
        errors.push('Korkeuden on oltava välillä 100-600 pikseliä');
        isValid = false;
      }
      
      // Tarkista URL:n muoto, jos se on annettu
      if (formData.linkUrl && formData.linkUrl.trim() !== '') {
        try {
          new URL(formData.linkUrl);
        } catch (e) {
          errors.push('Virheellinen URL-osoite. Varmista, että URL alkaa "http://" tai "https://"');
          isValid = false;
        }
      }
      
      return { isValid, errors };
    }
  }
  
  export default FormValidation;