<script lang="ts">
  import { toasts, dismissToast } from '$lib/stores/toast';

  const VARIANTS = {
    success: { icon: 'ti-check',        bg: '#eaf3de', border: '#c0dd97', color: '#3b6d11' },
    error:   { icon: 'ti-x',            bg: '#faeeda', border: '#fac775', color: '#633806' },
    info:    { icon: 'ti-info-circle',  bg: '#ece7fa', border: '#c9b8f0', color: '#3b2f5e' },
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
      <i class="ti {v.icon} toast-icon"></i>
      <span class="toast-msg">{toast.message}</span>
      <button class="toast-dismiss" onclick={() => dismissToast(toast.id)} aria-label="Chiudi">
        <i class="ti ti-x"></i>
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
    font-size: 16px;
    flex-shrink: 0;
    line-height: 1;
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
    font-size: 12px;
    line-height: 1;
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
