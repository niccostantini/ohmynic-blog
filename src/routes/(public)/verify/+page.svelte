<script lang="ts">
  import { base } from '$app/paths';
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Verifica email — OhMyNic!</title>
</svelte:head>

<div class="verify-wrap">
  <div class="verify-card">
    <div class="logo">Oh<em>My</em>Nic!</div>

    {#if data.success}
      <div class="icon success-icon">✓</div>
      <h1>Email verificata!</h1>
      <p>Il tuo account è attivo. Puoi ora accedere al blog.</p>
      <a href="{base}/login" class="btn-primary">Accedi</a>
    {:else}
      <div class="icon error-icon">✕</div>
      <h1>Link non valido</h1>
      <p>{data.message}</p>
      <a href="{base}/register" class="btn-secondary">Registrati di nuovo</a>
    {/if}
  </div>
</div>

<style>
  .verify-wrap { min-height: calc(100vh - 60px); display: flex; align-items: center; justify-content: center; padding: var(--space-8) var(--space-4); }
  .verify-card { background: white; border: 0.5px solid var(--color-bordo); border-radius: var(--radius-xl); padding: var(--space-12) var(--space-8); width: 100%; max-width: 420px; box-shadow: var(--shadow-md); text-align: center; }
  .logo { font-family: var(--font-serif); font-weight: 600; font-size: var(--text-2xl); color: var(--color-notte); letter-spacing: var(--tracking-tight); margin-bottom: var(--space-6); }
  .logo em { font-style: italic; color: var(--color-lavanda); }
  .icon { font-size: 2.5rem; font-weight: 700; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-5); font-family: var(--font-sans); }
  .success-icon { background: #d1fae5; color: #065f46; }
  .error-icon { background: #fef2f2; color: #b91c1c; }
  h1 { font-family: var(--font-sans); font-size: var(--text-xl); font-weight: var(--weight-semibold); color: var(--color-notte); margin-bottom: var(--space-3); }
  p { font-family: var(--font-sans); font-size: var(--text-sm); color: var(--color-lilla); margin-bottom: var(--space-6); }
  .btn-primary { display: inline-block; padding: 10px 24px; background: var(--color-lavanda); color: white; border-radius: var(--radius-md); font-family: var(--font-sans); font-size: var(--text-sm); font-weight: var(--weight-medium); text-decoration: none; transition: background var(--transition-fast); }
  .btn-primary:hover { background: var(--color-viola); }
  .btn-secondary { display: inline-block; padding: 10px 24px; background: var(--color-iris); color: var(--color-viola); border-radius: var(--radius-md); font-family: var(--font-sans); font-size: var(--text-sm); font-weight: var(--weight-medium); text-decoration: none; transition: background var(--transition-fast); }
  .btn-secondary:hover { background: var(--color-bordo); }
</style>
