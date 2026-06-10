<script lang="ts">
  import { themeColor, THEME_COLORS } from '$lib/stores/theme';
</script>

<div class="theme-switcher">
  <span class="switcher-label">Tema colore</span>
  <div class="circles">
    {#each THEME_COLORS as t}
      <button
        class="circle"
        class:selected={$themeColor === t.id}
        style="background: {t.dot}"
        onclick={() => themeColor.setThemeColor(t.id)}
        title={t.name}
        aria-label={t.name}
        aria-pressed={$themeColor === t.id}
      >
        {#if $themeColor === t.id}
          <span class="dot"></span>
        {/if}
      </button>
    {/each}
  </div>
</div>

<style>
  .theme-switcher {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  .switcher-label {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-lilla);
    white-space: nowrap;
  }

  .circles {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .circle {
    position: relative;
    width: 28px;
    height: 28px;
    min-height: 0;
    border-radius: 50%;
    border: 0.5px solid var(--color-bordo);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform var(--transition-fast), border-color var(--transition-fast);
    padding: 0;
    flex-shrink: 0;
  }

  .circle:hover {
    transform: scale(1.12);
    border-color: var(--color-lilla);
  }

  .circle.selected {
    border: 2px solid var(--color-notte);
    transform: scale(1.08);
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: white;
    pointer-events: none;
    flex-shrink: 0;
  }
</style>
