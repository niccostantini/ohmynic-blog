<script lang="ts">
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
  import { THEME_COLORS } from '$lib/stores/theme';
  import { themeColor } from '$lib/stores/theme';
</script>

<div class="settings-page">
  <h1>Impostazioni</h1>

  <section class="settings-section">
    <h2>Aspetto</h2>
    <p class="section-desc">
      Le preferenze visive sono salvate nel browser — ogni redattore può avere il suo tema.
    </p>

    <div class="setting-row">
      <div class="setting-info">
        <span class="setting-label">Modalità</span>
        <span class="setting-hint">Chiara, scura o segui il sistema operativo</span>
      </div>
      <ThemeToggle />
    </div>

    <div class="setting-row setting-row-color">
      <div class="setting-info">
        <span class="setting-label">Tema colore</span>
        <span class="setting-hint">
          Attivo: <strong>{THEME_COLORS.find(t => t.id === $themeColor)?.name ?? 'Ametista'}</strong>
        </span>
      </div>
      <ThemeSwitcher />
    </div>
  </section>
</div>

<style>
  .settings-page {
    max-width: 640px;
  }

  h1 {
    font-family: var(--font-serif);
    font-size: var(--text-2xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    margin-bottom: var(--space-8);
  }

  .settings-section {
    background: white;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    margin-bottom: var(--space-6);
  }

  :global([data-theme='dark']) .settings-section {
    background: var(--color-iris);
  }

  h2 {
    font-family: var(--font-sans);
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    margin-bottom: var(--space-2);
  }

  .section-desc {
    font-size: var(--text-sm);
    color: var(--color-lilla);
    margin-bottom: var(--space-6);
  }

  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-6);
    padding: var(--space-4) 0;
    border-top: 0.5px solid var(--color-bordo);
  }

  .setting-row-color {
    align-items: flex-start;
    padding-top: var(--space-5);
  }

  .setting-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex-shrink: 0;
  }

  .setting-label {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-notte);
  }

  .setting-hint {
    font-size: var(--text-xs);
    color: var(--color-lilla);
  }

  .setting-hint strong {
    color: var(--color-viola);
    font-weight: var(--weight-medium);
  }
</style>
