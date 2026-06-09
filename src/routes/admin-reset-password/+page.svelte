<script lang="ts">
  import type { ActionData, PageData } from './$types';
  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>Reimposta password — Admin OhMyNic!</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="login-wrap">
  <div class="login-card">
    <div class="login-logo">Oh<em>My</em>Nic!</div>
    <h1>Pannello di amministrazione</h1>

    {#if !data.valid}
      <p class="error">
        Il link non è valido o è scaduto. Richiedi un nuovo reset della password.
      </p>
      <p class="back-link"><a href="/blog/admin-forgot-password">Richiedi nuovo link</a></p>
    {:else}
      <p class="subhead">Scegli una nuova password</p>

      {#if form?.error}
        <p class="error">{form.error}</p>
      {/if}

      <form method="POST">
        <input type="hidden" name="token" value={data.token} />
        <div class="field">
          <label for="password">Nuova password</label>
          <input id="password" name="password" type="password" required
            autocomplete="new-password" minlength="12"
            placeholder="Almeno 12 caratteri" />
        </div>
        <div class="field">
          <label for="passwordConfirm">Conferma password</label>
          <input id="passwordConfirm" name="passwordConfirm" type="password" required
            autocomplete="new-password" minlength="12" />
        </div>
        <button type="submit" class="btn-primary">Salva nuova password</button>
      </form>
    {/if}
  </div>
</div>

<style>
  .login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--color-nebbia); padding: var(--space-4); }
  .login-card { background: white; border: 0.5px solid var(--color-bordo); border-radius: var(--radius-xl); padding: var(--space-10) var(--space-8); width: 100%; max-width: 400px; box-shadow: var(--shadow-md); }
  .login-logo { font-family: var(--font-serif); font-weight: 600; font-size: var(--text-2xl); color: var(--color-notte); letter-spacing: var(--tracking-tight); margin-bottom: var(--space-2); text-align: center; }
  .login-logo em { font-style: italic; color: var(--color-lavanda); }
  h1 { font-family: var(--font-sans); font-size: var(--text-sm); font-weight: var(--weight-medium); color: var(--color-lilla); margin-bottom: var(--space-4); text-align: center; }
  .subhead { font-size: var(--text-base); font-weight: var(--weight-semibold); color: var(--color-notte); text-align: center; margin-bottom: var(--space-6); }
  .field { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-4); }
  label { font-size: var(--text-sm); font-weight: var(--weight-medium); color: var(--color-prugna); }
  input { padding: 10px var(--space-3); border: 0.5px solid var(--color-bordo); border-radius: var(--radius-md); font-family: var(--font-sans); font-size: var(--text-base); color: var(--color-notte); background: var(--color-nebbia); transition: border-color var(--transition-fast); outline: none; width: 100%; }
  input:focus { border-color: var(--color-lavanda); background: white; }
  .error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); font-size: var(--text-sm); margin-bottom: var(--space-4); }
  .btn-primary { width: 100%; padding: 11px; margin-top: var(--space-2); background: var(--color-lavanda); color: white; border: none; border-radius: var(--radius-md); font-family: var(--font-sans); font-size: var(--text-sm); font-weight: var(--weight-medium); cursor: pointer; transition: background var(--transition-fast); }
  .btn-primary:hover { background: var(--color-viola); }
  .back-link { text-align: center; font-size: var(--text-sm); color: var(--color-lilla); margin-top: var(--space-5); }
  .back-link a { color: var(--color-viola); font-weight: var(--weight-medium); }
</style>
