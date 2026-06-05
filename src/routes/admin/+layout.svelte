<script lang="ts">
  import { base } from '$app/paths';
  import type { LayoutData } from './$types';
  import type { Snippet } from 'svelte';

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
      <a href="{base}/admin/comments">Commenti</a>
      <a href="https://ohmynic.co/blog/" target="_blank">Sito →</a>
    </nav>
    <form method="POST" action="{base}/api/logout">
      <button type="submit" class="btn-ghost">Esci</button>
    </form>
  </header>

  <main class="admin-main">
    {@render children()}
  </main>
</div>

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
