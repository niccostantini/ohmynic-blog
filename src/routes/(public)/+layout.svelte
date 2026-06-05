<script lang="ts">
  import { base } from '$app/paths';
  import Logo from '$lib/components/Logo.svelte';

  let { children }: { children: import('svelte').Snippet } = $props();
</script>

<svelte:head>
  <meta name="robots" content="index, follow" />
  <link rel="alternate" type="application/rss+xml" title="OhMyNic! — RSS Feed" href="https://ohmynic.co/blog/rss.xml" />
</svelte:head>

<div class="site">
  <header class="site-header">
    <div class="header-inner">
      <a href="{base}/" class="logo-link"><Logo /></a>
      <nav class="site-nav">
        <a href="{base}/">Articoli</a>
      </nav>
    </div>
  </header>

  <main class="site-main">
    {@render children()}
  </main>

  <footer class="site-footer">
    <div class="footer-inner">
      <Logo />
      <p class="footer-copy">© {new Date().getFullYear()} OhMyNic! — Tutti i diritti riservati.</p>
    </div>
  </footer>
</div>

<style>
  .site { display: flex; flex-direction: column; min-height: 100vh; }

  .site-header {
    position: sticky;
    top: 0;
    z-index: 10;
    background: rgba(245, 243, 251, 0.92);
    backdrop-filter: blur(8px);
    border-bottom: 0.5px solid var(--color-bordo);
  }
  .header-inner {
    max-width: var(--max-width-wide);
    margin: 0 auto;
    padding: 0 var(--space-8);
    height: 60px;
    display: flex;
    align-items: center;
    gap: var(--space-8);
  }
  .logo-link {
    text-decoration: none;
    border: none;
    font-size: var(--text-2xl);
  }
  .site-nav {
    display: flex;
    gap: var(--space-6);
    flex: 1;
  }
  .site-nav a {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-lilla);
    text-decoration: none;
    border: none;
    transition: color var(--transition-fast);
  }
  .site-nav a:hover { color: var(--color-notte); }

  .site-main { flex: 1; }

  .site-footer {
    margin-top: var(--space-20);
    padding: var(--space-10) var(--space-8);
    border-top: 0.5px solid var(--color-bordo);
    background: white;
  }
  .footer-inner {
    max-width: var(--max-width-wide);
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--space-4);
    font-size: var(--text-xl);
  }
  .footer-copy {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    color: var(--color-lilla);
  }
</style>
