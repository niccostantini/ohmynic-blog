import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createHighContrastStore() {
  const { subscribe, set } = writable<boolean>(false);

  function initHighContrast() {
    if (!browser) return;
    const saved = localStorage.getItem('ohmynic-theme-hc') === 'on';
    set(saved);
    // data-theme-hc already set by inline script in app.html
  }

  function toggleHighContrast() {
    if (!browser) return;
    const current = localStorage.getItem('ohmynic-theme-hc') === 'on';
    const next = !current;
    localStorage.setItem('ohmynic-theme-hc', next ? 'on' : 'off');
    set(next);
    if (next) {
      document.documentElement.setAttribute('data-theme-hc', 'on');
    } else {
      document.documentElement.removeAttribute('data-theme-hc');
    }
  }

  return { subscribe, initHighContrast, toggleHighContrast };
}

export const highContrast = createHighContrastStore();
