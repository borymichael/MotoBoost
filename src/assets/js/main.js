// Menu mobile : sans JavaScript, les liens restent visibles (voir .js dans main.css).
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('menu-principal');

if (toggle && nav) {
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  };

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });

  // Un lien d'ancre (même page) doit refermer le menu.
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });

  // Repasser en largeur desktop : on réinitialise l'état.
  window.matchMedia('(min-width: 56rem)').addEventListener('change', (event) => {
    if (event.matches) setOpen(false);
  });
}
