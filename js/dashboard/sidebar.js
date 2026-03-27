// js/dashboard/sidebar.js
export function initSidebar(user) {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  // Templates-linkki
  document.getElementById('nav-templates')?.addEventListener('click', e => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('open-templates'));
  });

  // Mobile hamburger (lisätään topbaariin dynaamisesti)
  const topbar = document.getElementById('topbar');
  if (topbar && window.innerWidth <= 768) {
    const hamburger = document.createElement('button');
    hamburger.className = 'btn btn-secondary btn-icon';
    hamburger.style.marginRight = '8px';
    hamburger.innerHTML = '<i class="fa fa-bars"></i>';
    topbar.insertBefore(hamburger, topbar.firstChild);
    hamburger.addEventListener('click', e => {
      e.stopPropagation();
      sidebar.classList.toggle('open');
    });
    document.addEventListener('click', e => {
      if (!sidebar.contains(e.target)) sidebar.classList.remove('open');
    });
  }
}
