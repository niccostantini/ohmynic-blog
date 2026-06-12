<script lang="ts">
  import type { ActionData } from './$types';
  let { form }: { form: ActionData } = $props();
</script>

<svelte:head><title>Cambia password — OhMyNic!</title></svelte:head>

<div class="wrap">
  <div class="card">
    <h1 class="title">Cambia password</h1>
    <p class="subtitle">Devi impostare una nuova password prima di continuare.</p>

    {#if form?.error}
      <div class="alert">{form.error}</div>
    {/if}

    <form method="POST" class="form">
      <label class="field">
        <span>Nuova password</span>
        <input type="password" name="password" required minlength="8" autocomplete="new-password" />
      </label>
      <label class="field">
        <span>Conferma password</span>
        <input type="password" name="confirm" required minlength="8" autocomplete="new-password" />
      </label>
      <button type="submit" class="btn-primary">Imposta password</button>
    </form>
  </div>
</div>

<style>
  .wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: calc(100vh - 56px);
    padding: var(--space-8);
  }
  .card {
    background: white;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-lg);
    padding: var(--space-8);
    width: 100%;
    max-width: 400px;
    box-shadow: var(--shadow-md);
  }
  .title {
    font-family: var(--font-serif);
    font-size: var(--text-2xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    margin-bottom: var(--space-2);
  }
  .subtitle {
    font-size: var(--text-sm);
    color: var(--color-lilla);
    margin-bottom: var(--space-6);
  }
  .alert {
    background: #fde8e8;
    color: #7f1d1d;
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    margin-bottom: var(--space-4);
  }
  .form { display: flex; flex-direction: column; gap: var(--space-4); }
  .field { display: flex; flex-direction: column; gap: var(--space-1); }
  .field span {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-notte);
  }
  .field input {
    padding: var(--space-2) var(--space-3);
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-family: inherit;
    color: var(--color-notte);
    outline: none;
    transition: border-color var(--transition-fast);
  }
  .field input:focus { border-color: var(--color-lavanda); }
  .btn-primary {
    padding: var(--space-3);
    background: var(--color-lavanda);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    cursor: pointer;
    font-family: inherit;
    transition: background var(--transition-fast);
    margin-top: var(--space-2);
  }
  .btn-primary:hover { background: var(--color-viola); }
</style>
