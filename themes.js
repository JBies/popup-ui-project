// Vaihtaa teemaa tumman ja vaalean välillä
function toggleTheme() {
    // Vaihda dark-luokka html-elementissä
    document.documentElement.classList.toggle('dark');
    
    // Tallenna asetus localStorageen
    const isDarkMode = document.documentElement.classList.contains('dark');
    localStorage.setItem('darkMode', isDarkMode ? 'true' : 'false');
    
    // Päivitä teemapainikkeen ikoni
    updateThemeIcon();
  }
  
  // Päivitä teemapainikkeen ikoni nykyisen teeman mukaan
  function updateThemeIcon() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    if (themeToggleBtn) {
      // Vaihda ikoni teeman mukaan
      themeToggleBtn.innerHTML = isDarkMode 
        ? '<i class="fas fa-sun"></i>' // Aurinko-ikoni kun teema on tumma
        : '<i class="fas fa-moon"></i>'; // Kuu-ikoni kun teema on vaalea
    }
  }
  
  // Alusta teema-asetukset sivun latautuessa
  function initTheme() {
    // Tarkista käyttäjän aiempi asetus
    const savedDarkMode = localStorage.getItem('darkMode');
    
    // Käytä järjestelmän asetusta, jos käyttäjä ei ole tehnyt valintaa
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Aseta tumma teema, jos käyttäjä on valinnut sen tai järjestelmä käyttää tummaa teemaa
    if (savedDarkMode === 'true' || (savedDarkMode === null && prefersDarkMode)) {
      document.documentElement.classList.add('dark');
    }
    
    // Päivitä teemapainikkeen ikoni
    updateThemeIcon();
  }
  
  // Aseta tapahtumakuuntelijat kun DOM on valmis
  document.addEventListener('DOMContentLoaded', () => {
    // Alusta teema
    initTheme();
    
    // Lisää tapahtumakuuntelija teemapainikkeelle
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', toggleTheme);
    }
  });