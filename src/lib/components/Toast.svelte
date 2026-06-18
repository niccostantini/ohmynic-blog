<script lang="ts">
  import { toasts, dismissToast } from '$lib/stores/toast';

  const VARIANTS = {
    success: {
      paths: '<path d="M5 12l5 5l10 -10"/>',
      bg: '#eaf3de', border: '#c0dd97', color: '#3b6d11'
    },
    error: {
      paths: '<path d="M18 6l-12 12"/><path d="M6 6l12 12"/>',
      bg: '#faeeda', border: '#fac775', color: '#633806'
    },
    info: {
      paths: '<path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M12 9h.01"/><path d="M11 12h1v4h1"/>',
      bg: '#ece7fa', border: '#c9b8f0', color: '#3b2f5e'
    },
  };
</script>

<div class="toast-stack" aria-live="polite" aria-atomic="false">
  {#each $toasts as toast (toast.id)}
    {@const v = VARIANTS[toast.type]}
    <div
      class="toast"
      style="--bg:{v.bg};--border:{v.border};--color:{v.color}"
      role="alert"
    >
      <svg class="toast-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        {@html v.paths}
      </svg>
      <span class="toast-msg">{toast.message}</span>
      <button class="toast-dismiss" onclick={() => dismissToast(toast.id)} aria-label="Chiudi">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M18 6l-12 12"/><path d="M6 6l12 12"/>
        </svg>
      </button>
    </div>
  {/each}
</div>

<style>
  .toast-stack {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
  }

  .toast {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 280px;
    padding: 12px 14px;
    background: var(--bg);
    border: 0.5px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md, 0 4px 16px rgba(30,22,48,0.12));
    color: var(--color);
    pointer-events: all;
    animation: toast-in 200ms ease both;
  }

  .toast-icon {
    flex-shrink: 0;
  }

  .toast-msg {
    flex: 1;
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 500;
    line-height: 1.4;
  }

  .toast-dismiss {
    background: none;
    border: none;
    color: inherit;
    opacity: 0.6;
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    transition: opacity 100ms;
  }
  .toast-dismiss:hover { opacity: 1; }

  @keyframes toast-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
</style>
