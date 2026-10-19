(() => {
  const storageKey = 'portfolio-route-transition';
  const pageLabels = {
    'index.html': 'Work',
    'about.html': 'About',
    about: 'About',
    'playground.html': 'Playground',
    'contact.html': 'Contact'
  };

  const pageName = pathname => {
    const parts = pathname.split('/').filter(Boolean);
    return parts.at(-1) || 'index.html';
  };

  const makeOverlay = label => {
    const overlay = document.createElement('div');
    overlay.className = 'page-transition';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');
    const title = document.createElement('span');
    title.className = 'page-transition__title';
    title.textContent = label;
    overlay.append(title);
    document.body.append(overlay);
    return overlay;
  };

  // Route arrivals use the same shared panel transition on every page. Remove
  // the home intro loader before it can paint, even if an older stylesheet is cached.
  let enteringLabel = '';
  try {
    enteringLabel = sessionStorage.getItem(storageKey) || '';
    sessionStorage.removeItem(storageKey);
  } catch {}

  if (enteringLabel) {
    document.documentElement.classList.add('has-route-transition');
    document.getElementById('intro-loader')?.remove();
    const overlay = makeOverlay(enteringLabel);
    requestAnimationFrame(() => setTimeout(() => overlay.classList.add('is-leaving'), 520));
    setTimeout(() => overlay.remove(), 1450);
  }

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a[href]');
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;

    const destination = new URL(link.href, location.href);
    if (destination.origin !== location.origin || !pageLabels[pageName(destination.pathname)]) return;
    if (destination.pathname === location.pathname) return;

    event.preventDefault();
    const label = pageLabels[pageName(destination.pathname)];
    try { sessionStorage.setItem(storageKey, label); } catch {}
    makeOverlay(label);
    setTimeout(() => location.assign(destination.href), 600);
  });
})();
