<script lang="ts">
  import { theme } from '$lib/stores/theme';
  import { highContrast } from '$lib/stores/highContrast';

  const LABELS: Record<string, string> = {
    light:  'Modalità chiara — clicca per scura',
    dark:   'Modalità scura — clicca per sistema',
    system: 'Segui sistema — clicca per chiara',
  };
</script>

<button
  class="theme-toggle"
  onclick={() => theme.toggleTheme()}
  title={LABELS[$theme]}
  aria-label={LABELS[$theme]}
>
  <svg class:icon-active={$theme === 'light'} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"/>
    <path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7"/>
  </svg>
  <span class="pill" class:pill-dark={$theme === 'dark'} class:pill-system={$theme === 'system'}>
    <span
      class="dot"
      class:dot-right={$theme === 'dark'}
      class:dot-mid={$theme === 'system'}
    ></span>
  </span>
  <svg class:icon-active={$theme === 'dark'} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454l0 .008"/>
  </svg>
</button>

<button
  class="hc-toggle"
  class:hc-active={$highContrast}
  onclick={() => highContrast.toggleHighContrast()}
  title={$highContrast ? 'Alto contrasto attivo — clicca per disattivare' : 'Attiva alto contrasto'}
  aria-label={$highContrast ? 'Disattiva alto contrasto' : 'Attiva alto contrasto'}
  aria-pressed={$highContrast}
>
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/>
    <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6"/>
  </svg>
</button>

<style>
  .theme-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 2px;
    color: var(--color-lilla);
    transition: color var(--transition-fast);
    flex-shrink: 0;
  }
  .theme-toggle:hover { color: var(--color-notte); }

  .theme-toggle svg {
    width: 15px;
    height: 15px;
    flex-shrink: 0;
    opacity: 0.45;
    transition: opacity var(--transition-base);
  }
  .theme-toggle svg.icon-active {
    opacity: 1;
    color: var(--color-lavanda);
  }

  .pill {
    position: relative;
    display: inline-flex;
    width: 34px;
    height: 18px;
    border-radius: var(--radius-pill);
    background: var(--color-bordo);
    transition: background var(--transition-base);
    flex-shrink: 0;
  }
  .pill.pill-dark    { background: var(--color-lavanda); }
  .pill.pill-system  { background: var(--color-bordo-soft); }

  .dot {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: white;
    transition: left var(--transition-base);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
  .dot.dot-right { left: 19px; }
  .dot.dot-mid   { left: 11px; }

  .hc-toggle {
    display: flex;
    align-items: center;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    color: var(--color-lilla);
    border-radius: var(--radius-sm);
    transition: color var(--transition-fast);
    flex-shrink: 0;
    opacity: 0.5;
  }
  .hc-toggle svg { width: 15px; height: 15px; }
  .hc-toggle:hover { color: var(--color-notte); opacity: 1; }
  .hc-toggle.hc-active {
    color: var(--color-lavanda);
    opacity: 1;
  }
</style>
