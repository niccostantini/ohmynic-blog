<script lang="ts">
  import { base } from '$app/paths';
  import { fly } from 'svelte/transition';

  const DISMISSED_KEY = 'ohmynic-cookie-notice';
  const OPTOUT_KEY    = 'ohmynic-analytics-optout';

  let visible          = $state(false);
  let analyticsEnabled = $state(true);

  $effect(() => {
    visible          = localStorage.getItem(DISMISSED_KEY) !== '1';
    analyticsEnabled = localStorage.getItem(OPTOUT_KEY) !== '1';
  });

  function toggleAnalytics() {
    analyticsEnabled = !analyticsEnabled;
    if (analyticsEnabled) {
      localStorage.removeItem(OPTOUT_KEY);
    } else {
      localStorage.setItem(OPTOUT_KEY, '1');
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1');
    visible = false;
  }
</script>

{#if visible}
  <div
    class="cookie-banner"
    role="region"
    aria-label="Informativa cookie"
    transition:fly={{ y: 80, duration: 260 }}
  >
    <p class="banner-text">
      Usiamo analytics interni — nessun tracker di terze parti.
      <a href="{base}/cookie-policy">Dettagli</a>
    </p>

    <div class="banner-actions">
      <button
        class="analytics-toggle"
        class:off={!analyticsEnabled}
        onclick={toggleAnalytics}
        aria-pressed={analyticsEnabled}
        title={analyticsEnabled ? 'Disattiva analytics' : 'Attiva analytics'}
      >
        <span class="toggle-track">
          <span class="toggle-thumb"></span>
        </span>
        <span class="toggle-label">Analytics {analyticsEnabled ? 'on' : 'off'}</span>
      </button>

      <button class="dismiss-btn" onclick={dismiss} aria-label="Chiudi">
        Ho capito
      </button>
    </div>
  </div>
{/if}

<style>
  .cookie-banner {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 15;
    background: var(--color-notte);
    color: white;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.18);
  }

  .banner-text {
    flex: 1;
    min-width: 180px;
    font-family: var(--font-sans);
    font-size: 0.8rem;
    line-height: 1.4;
    color: rgba(255, 255, 255, 0.85);
    margin: 0;
  }

  .banner-text a {
    color: var(--color-lavanda);
    text-decoration: underline;
    text-underline-offset: 2px;
    white-space: nowrap;
  }
  .banner-text a:hover { color: white; }

  .banner-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }

  /* ── Toggle ─────────────────────────────────────────────────────────────── */
  .analytics-toggle {
    display: flex;
    align-items: center;
    gap: 7px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 0;
    color: rgba(255, 255, 255, 0.7);
    font-family: var(--font-sans);
    font-size: 0.75rem;
    transition: color 0.15s;
  }
  .analytics-toggle:hover { color: white; }

  .toggle-track {
    width: 30px;
    height: 17px;
    border-radius: 99px;
    background: var(--color-viola);
    position: relative;
    flex-shrink: 0;
    transition: background 0.2s;
  }
  .analytics-toggle.off .toggle-track {
    background: rgba(255, 255, 255, 0.25);
  }

  .toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: white;
    transition: transform 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  }
  .analytics-toggle:not(.off) .toggle-thumb {
    transform: translateX(13px);
  }

  .toggle-label {
    white-space: nowrap;
  }

  /* ── Dismiss ─────────────────────────────────────────────────────────────── */
  .dismiss-btn {
    background: rgba(255, 255, 255, 0.12);
    border: 0.5px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    color: white;
    font-family: var(--font-sans);
    font-size: 0.75rem;
    font-weight: 500;
    padding: 5px 12px;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s;
    flex-shrink: 0;
  }
  .dismiss-btn:hover { background: rgba(255, 255, 255, 0.22); }

  @media (max-width: 480px) {
    .cookie-banner { padding: 10px 12px; gap: 8px; }
    .banner-text { font-size: 0.75rem; }
    .toggle-label { display: none; }
  }
</style>
