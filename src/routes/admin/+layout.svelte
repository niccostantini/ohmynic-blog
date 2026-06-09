<script lang="ts">
  import { base } from '$app/paths';
  import type { LayoutData } from './$types';
  import type { Snippet } from 'svelte';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import Toast from '$lib/components/Toast.svelte';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<svelte:head>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="admin-shell">
  <header class="admin-header">
    <a href="{base}/admin" class="logo-link">Oh<em>My</em>Nic!</a>
    <nav class="admin-nav">
      <a href="{base}/admin">Articoli</a>
      {#if data.user.role === 'admin' || data.user.role === 'editor'}
        <a href="{base}/admin/comments">Commenti</a>
      {/if}
      {#if data.user.role === 'admin'}
        <a href="{base}/admin/users">Utenti</a>
      {/if}
      {#if data.user.role === 'admin' || data.user.role === 'editor'}
        <a href="{base}/admin/analytics">Analytics</a>
      {/if}
      <a href="https://ohmynic.co/blog/" target="_blank">Sito →</a>
    </nav>
    <a href="{base}/admin/settings" class="btn-settings" title="Impostazioni" aria-label="Impostazioni">
      <i class="ti ti-settings"></i>
    </a>
    <div class="header-right">
      <ThemeToggle />
      <form method="POST" action="{base}/api/logout">
        <button type="submit" class="btn-ghost">Esci</button>
      </form>
    </div>
  </header>

  <main class="admin-main">
    {@render children()}
  </main>
</div>

<Toast />

<style>
  .admin-shell {
    min-height: 100vh;
    background: var(--color-nebbia);
  }

  .admin-header {
    display: flex;
    align-items: center;
    gap: var(--space-6);
    padding: 0 var(--space-8);
    height: 56px;
    background: white;
    border-bottom: 0.5px solid var(--color-bordo);
    position: sticky;
    top: 0;
    z-index: 10;
  }
  :global([data-theme='dark']) .admin-header {
    background: var(--color-iris);
  }

  .btn-settings {
    font-size: 18px;
    color: var(--color-lilla);
    text-decoration: none;
    border: none;
    line-height: 1;
    padding: 4px;
    border-radius: var(--radius-sm);
    transition: color var(--transition-fast);
    display: flex;
    align-items: center;
  }
  .btn-settings:hover { color: var(--color-notte); }

  .header-right {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-left: auto;
  }

  .logo-link {
    font-family: var(--font-serif);
    font-weight: 600;
    font-size: var(--text-xl);
    color: var(--color-notte);
    letter-spacing: var(--tracking-tight);
    text-decoration: none;
    border: none;
    flex-shrink: 0;
  }

  .logo-link em {
    font-style: italic;
    color: var(--color-lavanda);
  }

  .admin-nav {
    display: flex;
    gap: var(--space-5);
    flex: 1;
  }

  .admin-nav a {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-lilla);
    text-decoration: none;
    border: none;
    transition: color var(--transition-fast);
  }

  .admin-nav a:hover {
    color: var(--color-notte);
  }

  .admin-main {
    max-width: var(--max-width-wide);
    margin: 0 auto;
    padding: var(--space-8);
  }
</style>
