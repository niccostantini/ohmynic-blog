<script lang="ts">
  import { base } from '$app/paths';
  import { addToast } from '$lib/stores/toast';

  let { open = $bindable(false) }: { open?: boolean } = $props();

  let type = $state<'bug' | 'suggestion' | 'other'>('bug');
  let title = $state('');
  let description = $state('');
  let submitting = $state(false);
  let error = $state('');

  function reset() {
    type = 'bug';
    title = '';
    description = '';
    error = '';
    submitting = false;
  }

  function close() {
    open = false;
    reset();
  }

  function handleBackdrop(e: MouseEvent) {
    if (e.target === e.currentTarget) close();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
  }

  async function submit() {
    error = '';
    if (!title.trim()) { error = 'Il titolo è obbligatorio.'; return; }
    if (title.length > 100) { error = 'Titolo troppo lungo (max 100 caratteri).'; return; }
    if (description.trim().length < 20) { error = 'Descrizione troppo breve (min 20 caratteri).'; return; }

    submitting = true;
    try {
      const res = await fetch(`${base}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title: title.trim(),
          description: description.trim(),
          url: typeof window !== 'undefined' ? window.location.href : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        error = (data as any).message ?? 'Errore durante l\'invio.';
        return;
      }

      addToast('Grazie per il feedback!', 'success');
      close();
    } catch {
      error = 'Errore di rete. Riprova.';
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="backdrop" onclick={handleBackdrop} role="dialog" aria-modal="true" aria-label="Segnala un problema">
    <div class="modal">
      <div class="modal-head">
        <h2>Segnala un problema</h2>
        <button class="btn-close" onclick={close} aria-label="Chiudi">✕</button>
      </div>

      <div class="modal-body">
        <!-- Tipo -->
        <fieldset class="type-group">
          <legend class="field-label">Tipo</legend>
          <div class="radio-row">
            {#each [['bug','🐛 Bug'],['suggestion','💡 Suggerimento'],['other','💬 Altro']] as [val, label]}
              <label class="radio-pill" class:selected={type === val}>
                <input type="radio" name="type" value={val} bind:group={type} />
                {label}
              </label>
            {/each}
          </div>
        </fieldset>

        <!-- Titolo -->
        <label class="field">
          <span class="field-label">Breve descrizione <span class="required">*</span></span>
          <input
            type="text"
            bind:value={title}
            maxlength="100"
            placeholder="Es. Il pulsante salva non funziona"
          />
          <span class="char-count" class:warn={title.length > 85}>{title.length}/100</span>
        </label>

        <!-- Descrizione -->
        <label class="field">
          <span class="field-label">Descrizione dettagliata <span class="required">*</span></span>
          <textarea
            bind:value={description}
            rows="5"
            placeholder="Descrivi il problema o il suggerimento in dettaglio (min 20 caratteri)..."
          ></textarea>
        </label>

        {#if error}
          <p class="error-msg">{error}</p>
        {/if}
      </div>

      <div class="modal-foot">
        <button class="btn-ghost" onclick={close} disabled={submitting}>Annulla</button>
        <button class="btn-primary" onclick={submit} disabled={submitting}>
          {submitting ? 'Invio…' : 'Invia'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(30, 22, 48, 0.45);
    z-index: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-4);
  }

  .modal {
    background: white;
    border-radius: var(--radius-lg);
    width: 100%;
    max-width: 460px;
    box-shadow: 0 8px 40px rgba(30, 22, 48, 0.18);
    overflow: hidden;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }

  .modal-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-5);
    border-bottom: 0.5px solid var(--color-bordo);
    flex-shrink: 0;
  }
  .modal-head h2 {
    font-family: var(--font-serif);
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    margin: 0;
  }
  .btn-close {
    background: none;
    border: none;
    font-size: var(--text-sm);
    color: var(--color-lilla);
    cursor: pointer;
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    transition: color var(--transition-fast);
  }
  .btn-close:hover { color: var(--color-notte); }

  .modal-body {
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    overflow-y: auto;
    flex: 1;
  }

  .modal-foot {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-5);
    border-top: 0.5px solid var(--color-bordo);
    flex-shrink: 0;
  }

  /* Type radio pills */
  .type-group { border: none; padding: 0; margin: 0; }
  .radio-row { display: flex; gap: var(--space-2); flex-wrap: wrap; margin-top: var(--space-2); }
  .radio-pill {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: 6px 14px;
    border: 0.5px solid var(--color-bordo);
    border-radius: 99px;
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    color: var(--color-lilla);
    cursor: pointer;
    background: white;
    transition: border-color var(--transition-fast), color var(--transition-fast), background var(--transition-fast);
  }
  .radio-pill input { display: none; }
  .radio-pill.selected {
    border-color: var(--color-lavanda);
    background: var(--color-iris);
    color: var(--color-viola);
    font-weight: var(--weight-medium);
  }

  /* Fields */
  .field { display: flex; flex-direction: column; gap: var(--space-1); position: relative; }
  .field-label {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-notte);
  }
  .required { color: #b91c1c; }
  .field input, .field textarea {
    padding: var(--space-2) var(--space-3);
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-family: inherit;
    color: var(--color-notte);
    outline: none;
    transition: border-color var(--transition-fast);
    width: 100%;
    box-sizing: border-box;
    resize: vertical;
  }
  .field input:focus, .field textarea:focus { border-color: var(--color-lavanda); }
  .char-count {
    font-size: var(--text-xs);
    color: var(--color-lilla);
    text-align: right;
    margin-top: 2px;
  }
  .char-count.warn { color: #b45309; }

  .error-msg {
    font-size: var(--text-sm);
    color: #b91c1c;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-3);
    margin: 0;
  }

  /* Buttons */
  .btn-ghost {
    padding: var(--space-2) var(--space-4);
    background: transparent;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-family: inherit;
    color: var(--color-lilla);
    cursor: pointer;
    transition: border-color var(--transition-fast), color var(--transition-fast);
  }
  .btn-ghost:hover:not(:disabled) { border-color: var(--color-lavanda); color: var(--color-notte); }
  .btn-ghost:disabled { opacity: 0.5; cursor: default; }

  .btn-primary {
    padding: var(--space-2) var(--space-5);
    background: var(--color-lavanda);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-family: inherit;
    font-weight: var(--weight-medium);
    cursor: pointer;
    transition: background var(--transition-fast);
  }
  .btn-primary:hover:not(:disabled) { background: var(--color-viola); }
  .btn-primary:disabled { opacity: 0.6; cursor: default; }
</style>
