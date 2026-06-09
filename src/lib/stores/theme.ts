import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark' | 'system';
export type ThemeColor = 'amethyst' | 'winter-garden' | 'lacca' | 'deep' | 'ash' | 'powder';

export const THEME_COLORS: { id: ThemeColor; name: string; dot: string }[] = [
  { id: 'amethyst',      name: 'Ametista',          dot: '#9b6ff0' },
  { id: 'winter-garden', name: "Giardino d'inverno", dot: '#4a9e5c' },
  { id: 'lacca',         name: 'Lacca',              dot: '#c4622a' },
  { id: 'deep',          name: 'Profondo',           dot: '#2874a8' },
  { id: 'ash',           name: 'Cenere',             dot: '#555550' },
  { id: 'powder',        name: 'Cipria',             dot: '#b84464' },
];

// ── Theme (light / dark / system) ─────────────────────────────────────────

function createThemeStore() {
  const { subscribe, set } = writable<Theme>('system');

  function applyTheme(t: Theme) {
    if (!browser) return;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = t === 'dark' || (t === 'system' && prefersDark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }

  function initTheme() {
    if (!browser) return;
    const saved = (localStorage.getItem('ohmynic-theme') as Theme | null) ?? 'system';
    set(saved);
    // data-theme already set by inline script — just wire up system listener
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', () => {
      const current = (localStorage.getItem('ohmynic-theme') as Theme | null) ?? 'system';
      if (current === 'system') applyTheme('system');
    });
  }

  function toggleTheme() {
    if (!browser) return;
    const current = (localStorage.getItem('ohmynic-theme') as Theme | null) ?? 'system';
    const next: Theme = current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
    localStorage.setItem('ohmynic-theme', next);
    set(next);
    applyTheme(next);
  }

  return { subscribe, initTheme, toggleTheme };
}

export const theme = createThemeStore();

// ── Theme color ────────────────────────────────────────────────────────────

function createThemeColorStore() {
  const { subscribe, set } = writable<ThemeColor>('amethyst');

  function initThemeColor() {
    if (!browser) return;
    const saved = (localStorage.getItem('ohmynic-theme-color') as ThemeColor | null) ?? 'amethyst';
    set(saved);
    // data-theme-color already set by inline script — just sync the store
  }

  function setThemeColor(id: ThemeColor) {
    if (!browser) return;
    localStorage.setItem('ohmynic-theme-color', id);
    set(id);
    document.documentElement.setAttribute('data-theme-color', id);
  }

  return { subscribe, initThemeColor, setThemeColor };
}

export const themeColor = createThemeColorStore();
