<script lang="ts">
  import { theme } from '$lib/stores/theme';

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
  <i class="ti ti-sun" class:icon-active={$theme === 'light'}></i>
  <span class="pill" class:pill-dark={$theme === 'dark'} class:pill-system={$theme === 'system'}>
    <span
      class="dot"
      class:dot-right={$theme === 'dark'}
      class:dot-mid={$theme === 'system'}
    ></span>
  </span>
  <i class="ti ti-moon" class:icon-active={$theme === 'dark'}></i>
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

  .theme-toggle i {
    font-size: 15px;
    line-height: 1;
    opacity: 0.45;
    transition: opacity var(--transition-base);
  }
  .theme-toggle i.icon-active {
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
</style>
