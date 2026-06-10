<script lang="ts">
  import { base } from '$app/paths';
  import type { ActionData } from './$types';
  let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
  <title>Registrati — OhMyNic!</title>
</svelte:head>

<div class="auth-wrap">
  <div class="auth-card">
    <div class="auth-logo">Oh<em>My</em>Nic!</div>
    <h1>Crea un account</h1>

    {#if form?.sent}
      <div class="success">
        Controlla la tua email per confermare l'account.<br>
        <small>Potrebbe volerci qualche minuto.</small>
      </div>
    {:else}
      {#if form?.error}
        <p class="error">{form.error}</p>
      {/if}

      <form method="POST">
        <div class="field">
          <label for="displayName">Nome</label>
          <input id="displayName" name="displayName" type="text" required placeholder="Il tuo nome" autocomplete="name" />
        </div>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" name="email" type="email" required placeholder="la@tua.email" autocomplete="email" />
        </div>
        <div class="field">
          <label for="password">Password <span class="hint">min. 12 caratteri</span></label>
          <input id="password" name="password" type="password" required minlength="12" autocomplete="new-password" />
        </div>
        <div class="field">
          <label for="confirm">Conferma password</label>
          <input id="confirm" name="confirm" type="password" required minlength="12" autocomplete="new-password" />
        </div>
        <label class="checkbox-field">
          <input type="checkbox" name="privacy" required />
          <span>Ho letto e accetto la <a href="{base}/privacy" target="_blank">privacy policy</a> e la <a href="{base}/cookie-policy" target="_blank">cookie policy</a></span>
        </label>
        <button type="submit" class="btn-primary">Crea account</button>
      </form>

      <p class="auth-link">Hai già un account? <a href="{base}/login">Accedi</a></p>
    {/if}
  </div>
</div>

<style>
  .auth-wrap { min-height: calc(100vh - 60px); display: flex; align-items: center; justify-content: center; padding: var(--space-8) var(--space-4); }
  .auth-card { background: white; border: 0.5px solid var(--color-bordo); border-radius: var(--radius-xl); padding: var(--space-10) var(--space-8); width: 100%; max-width: 420px; box-shadow: var(--shadow-md); }
  .auth-logo { font-family: var(--font-serif); font-weight: 600; font-size: var(--text-2xl); color: var(--color-notte); letter-spacing: var(--tracking-tight); margin-bottom: var(--space-2); text-align: center; }
  .auth-logo em { font-style: italic; color: var(--color-lavanda); }
  h1 { font-family: var(--font-sans); font-size: var(--text-xl); font-weight: var(--weight-semibold); color: var(--color-notte); margin-bottom: var(--space-6); text-align: center; }
  .field { display: flex; flex-direction: column; gap: var(--space-1); margin-bottom: var(--space-4); }
  label { font-size: var(--text-sm); font-weight: var(--weight-medium); color: var(--color-prugna); }
  .hint { font-weight: normal; color: var(--color-lilla); font-size: var(--text-xs); }
  input[type="text"], input[type="email"], input[type="password"] {
    padding: 10px var(--space-3); border: 0.5px solid var(--color-bordo); border-radius: var(--radius-md);
    font-family: var(--font-sans); font-size: var(--text-base); color: var(--color-notte);
    background: var(--color-nebbia); transition: border-color var(--transition-fast); outline: none; width: 100%;
  }
  input:focus { border-color: var(--color-lavanda); background: white; }
  .checkbox-field { display: flex; align-items: flex-start; gap: var(--space-2); font-size: var(--text-sm); color: var(--color-prugna); margin-bottom: var(--space-5); cursor: pointer; }
  .checkbox-field input { width: auto; flex-shrink: 0; margin-top: 2px; }
  .checkbox-field a { color: var(--color-viola); }
  .btn-primary { width: 100%; padding: 11px; background: var(--color-lavanda); color: white; border: none; border-radius: var(--radius-md); font-family: var(--font-sans); font-size: var(--text-sm); font-weight: var(--weight-medium); cursor: pointer; transition: background var(--transition-fast); }
  .btn-primary:hover { background: var(--color-viola); }
  .error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); font-size: var(--text-sm); margin-bottom: var(--space-4); }
  .success { background: #d1fae5; color: #065f46; border-radius: var(--radius-md); padding: var(--space-4); font-size: var(--text-sm); line-height: 1.6; }
  .auth-link { text-align: center; font-size: var(--text-sm); color: var(--color-lilla); margin-top: var(--space-5); }
  .auth-link a { color: var(--color-viola); font-weight: var(--weight-medium); }
</style>
