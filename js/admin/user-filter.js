// js/admin/user-filter.js
// Käyttäjien suodatustoiminnot

/**
 * UserFilter-luokka vastaa käyttäjien suodattamisesta
 */
class UserFilter {
    /**
     * Alustaa käyttäjien filtterit
     * @param {Array} users - Lista käyttäjistä
     * @param {Function} onFilter - Callback-funktio kun filtteriä muutetaan
     */
    static initFilters(users, onFilter) {
      const filterPending = document.getElementById('filterPending');
      const filterAll = document.getElementById('filterAll');
      
      if (filterPending && filterAll) {
        // Asetetaan pending-laskuri
        this.updatePendingCount(users);
        
        // Lisätään suodatintoiminnot
        filterPending.addEventListener('click', () => {
          const pendingUsers = users.filter(user => user.role === 'pending');
          onFilter(pendingUsers);
          this.setActiveFilter(filterPending);
        });
        
        filterAll.addEventListener('click', () => {
          onFilter(users);
          this.setActiveFilter(filterAll);
        });
        
        // Oletuksena näytetään kaikki käyttäjät
        this.setActiveFilter(filterAll);
      }
    }
    
    /**
     * Päivittää odottavien käyttäjien määrän
     * @param {Array} users - Käyttäjälista
     */
    static updatePendingCount(users) {
      const pendingCount = users.filter(user => user.role === 'pending').length;
      const pendingCountElement = document.getElementById('pendingCount');
      
      if (pendingCountElement) {
        pendingCountElement.textContent = pendingCount;
        
        // Näytetään tai piilotetaan badge tarpeen mukaan
        pendingCountElement.style.display = pendingCount > 0 ? 'inline-flex' : 'none';
      }
    }
    
    /**
     * Asettaa aktiivisen filtterin painikkeille
     * @param {HTMLElement} activeFilter - Aktiiviseksi asetettava filtteri
     */
    static setActiveFilter(activeFilter) {
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      
      activeFilter.classList.add('active');
    }
  }
  
  export default UserFilter;