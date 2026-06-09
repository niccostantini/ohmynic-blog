<script lang="ts">
  import { base } from '$app/paths';
  import { afterNavigate } from '$app/navigation';
  import Logo from '$lib/components/Logo.svelte';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
  import FeedbackModal from '$lib/components/FeedbackModal.svelte';
  import Toast from '$lib/components/Toast.svelte';
  import { trackPageview } from '$lib/analytics';
  import type { LayoutData } from './$types';

  import { page } from '$app/state';

  let { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props();

  let feedbackOpen = $state(false);
  let mobileMenuOpen = $state(false);

  afterNavigate(() => { mobileMenuOpen = false; });

  afterNavigate(({ to }) => {
    // Articles track themselves (with articleId) from +page.svelte onMount
    // Only track non-article pages here
    if (!to?.url) return;
    const path = to.url.pathname;
    // Skip paths that look like article slugs — they have their own tracker
    // Article paths are /blog/<slug> (no sub-path, not a known section)
    const SECTIONS = ['/tag/', '/author/', '/search', '/account', '/login', '/register', '/privacy-policy'];
    const isSection = SECTIONS.some(s => path.includes(s)) || path === '/blog/' || path === '/blog';
    if (isSection) trackPageview(path);
  });

  async function logout() {
    await fetch(`${base}/api/reader-logout`, { method: 'POST' });
    window.location.href = `${base}/`;
  }
</script>

<svelte:head>
  <meta name="robots" content="index, follow" />
  <link rel="alternate" type="application/rss+xml" title="OhMyNic! — RSS Feed" href="https://ohmynic.co/blog/rss.xml" />
</svelte:head>

<div class="site">
  <header class="site-header">
    <div class="header-inner">
      <a href="{base}/" class="logo-link"><Logo /></a>
      <nav class="site-nav" aria-label="Navigazione principale">
        {#each data.navItems as item (item.id)}
          <a
            href={item.url ?? '#'}
            class:nav-active={page.url.pathname === item.url || (item.url !== '/blog' && page.url.pathname.startsWith(item.url ?? ''))}
            target={item.openInNewTab ? '_blank' : undefined}
            rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
          >{item.label}</a>
        {/each}
      </nav>
      <div class="reader-nav">
        {#if data.reader}
          <a href="{base}/account" class="reader-account">
            <span class="reader-avatar">{data.reader.displayName.charAt(0).toUpperCase()}</span>
            <span class="reader-name">{data.reader.displayName}</span>
          </a>
          <button class="btn-logout" onclick={logout}>Esci</button>
        {:else}
          <a href="{base}/login" class="nav-link">Accedi</a>
          <a href="{base}/register" class="nav-btn">Registrati</a>
        {/if}
        <ThemeToggle />
      </div>
      <button
        class="hamburger"
        aria-label={mobileMenuOpen ? 'Chiudi menu' : 'Apri menu'}
        aria-expanded={mobileMenuOpen}
        onclick={() => mobileMenuOpen = !mobileMenuOpen}
      >
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar" class:hidden-bar={mobileMenuOpen}></span>
      </button>
    </div>

    {#if mobileMenuOpen}
      <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
      <div class="mobile-menu" onclick={(e) => e.target === e.currentTarget && (mobileMenuOpen = false)}>
        <nav class="mobile-nav" aria-label="Menu mobile">
          {#each data.navItems as item (item.id)}
            <a
              href={item.url ?? '#'}
              class:nav-active={page.url.pathname === item.url || (item.url !== '/blog' && page.url.pathname.startsWith(item.url ?? ''))}
              target={item.openInNewTab ? '_blank' : undefined}
              rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
            >{item.label}</a>
          {/each}
          <div class="mobile-reader-nav">
            {#if data.reader}
              <a href="{base}/account" class="mobile-account">
                <span class="reader-avatar">{data.reader.displayName.charAt(0).toUpperCase()}</span>
                <span>{data.reader.displayName}</span>
              </a>
              <button class="btn-logout" onclick={logout}>Esci</button>
            {:else}
              <a href="{base}/login" class="mobile-auth-link">Accedi</a>
              <a href="{base}/register" class="mobile-auth-btn">Registrati</a>
            {/if}
          </div>
        </nav>
      </div>
    {/if}
  </header>

  <main class="site-main">
    {@render children()}
  </main>

  <footer class="site-footer">
    <div class="footer-inner">
      <Logo />
      <p class="footer-copy">© {new Date().getFullYear()} OhMyNic! — Tutti i diritti riservati.</p>
      <div class="footer-right">
        <button class="footer-feedback-link" onclick={() => feedbackOpen = true}>
          Segnala un problema
        </button>
        <ThemeSwitcher />
      </div>
    </div>
  </footer>
</div>

<FeedbackModal bind:open={feedbackOpen} />
<Toast />

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
  :global([data-theme='dark']) .site-header {
    background: rgba(15, 13, 26, 0.92);
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
  .site-nav a.nav-active { color: var(--color-viola); font-weight: var(--weight-semibold); }

  .reader-nav {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-left: auto;
  }
  .reader-account {
    display: flex; align-items: center; gap: var(--space-2);
    text-decoration: none; border: none;
    transition: opacity var(--transition-fast);
  }
  .reader-account:hover { opacity: 0.8; }
  .reader-avatar {
    width: 30px; height: 30px; border-radius: 50%;
    background: var(--color-lavanda); color: white;
    font-family: var(--font-serif); font-size: var(--text-sm); font-weight: 600;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .reader-name {
    font-family: var(--font-sans); font-size: var(--text-sm); font-weight: var(--weight-medium);
    color: var(--color-notte);
  }
  .btn-logout {
    font-family: var(--font-sans); font-size: var(--text-sm); color: var(--color-lilla);
    background: none; border: none; cursor: pointer; padding: 0;
    transition: color var(--transition-fast);
  }
  .btn-logout:hover { color: var(--color-notte); }
  .nav-link {
    font-family: var(--font-sans); font-size: var(--text-sm); font-weight: var(--weight-medium);
    color: var(--color-lilla); text-decoration: none; border: none;
    transition: color var(--transition-fast);
  }
  .nav-link:hover { color: var(--color-notte); }
  .nav-btn {
    font-family: var(--font-sans); font-size: var(--text-sm); font-weight: var(--weight-medium);
    color: var(--color-lavanda); background: var(--color-iris);
    padding: 5px 14px; border-radius: var(--radius-md);
    text-decoration: none; border: 0.5px solid var(--color-bordo);
    transition: background var(--transition-fast), color var(--transition-fast);
  }
  .nav-btn:hover { background: var(--color-lavanda); color: white; border-color: transparent; }

  .site-main { flex: 1; }

  .site-footer {
    margin-top: var(--space-20);
    padding: var(--space-10) var(--space-8);
    border-top: 0.5px solid var(--color-bordo);
    background: white;
  }
  :global([data-theme='dark']) .site-footer {
    background: var(--color-iris);
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

  .footer-right {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }
  .footer-feedback-link {
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    color: var(--color-lilla);
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: color var(--transition-fast);
  }
  .footer-feedback-link:hover { color: var(--color-notte); }

  /* ── Hamburger ─────────────────────────────────────────────────────────── */
  .hamburger {
    display: none;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    width: 44px;
    height: 44px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 10px;
    margin-left: auto;
    flex-shrink: 0;
  }
  .hamburger-bar {
    display: block;
    width: 20px;
    height: 2px;
    background: var(--color-notte);
    border-radius: 2px;
    transition: opacity var(--transition-fast);
  }
  .hamburger-bar.hidden-bar { opacity: 0; }

  /* ── Mobile menu ────────────────────────────────────────────────────────── */
  .mobile-menu {
    position: absolute;
    top: 60px;
    left: 0;
    right: 0;
    z-index: 20;
    background: rgba(245, 243, 251, 0.98);
    backdrop-filter: blur(8px);
    border-bottom: 0.5px solid var(--color-bordo);
  }
  :global([data-theme='dark']) .mobile-menu {
    background: rgba(15, 13, 26, 0.98);
  }
  .mobile-nav {
    padding: var(--space-4) var(--space-4) var(--space-6);
    display: flex;
    flex-direction: column;
  }
  .mobile-nav a {
    font-family: var(--font-sans);
    font-size: var(--text-base);
    font-weight: var(--weight-medium);
    color: var(--color-lilla);
    text-decoration: none;
    border: none;
    padding: var(--space-3) 0;
    border-bottom: 0.5px solid var(--color-bordo);
    min-height: 44px;
    display: flex;
    align-items: center;
    transition: color var(--transition-fast);
  }
  .mobile-nav a:hover, .mobile-nav a.nav-active { color: var(--color-notte); }
  .mobile-nav a.nav-active { font-weight: var(--weight-semibold); color: var(--color-viola); }

  .mobile-reader-nav {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding-top: var(--space-4);
    flex-wrap: wrap;
  }
  .mobile-account {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    text-decoration: none;
    border: none;
    color: var(--color-notte);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    min-height: 44px;
  }
  .mobile-auth-link {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-lilla);
    text-decoration: none;
    border: none;
    min-height: 44px;
    display: flex;
    align-items: center;
    padding: 0 var(--space-2);
    transition: color var(--transition-fast);
  }
  .mobile-auth-link:hover { color: var(--color-notte); }
  .mobile-auth-btn {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-lavanda);
    background: var(--color-iris);
    padding: 10px 18px;
    border-radius: var(--radius-md);
    text-decoration: none;
    border: 0.5px solid var(--color-bordo);
    min-height: 44px;
    display: flex;
    align-items: center;
    transition: background var(--transition-fast);
  }
  .mobile-auth-btn:hover { background: var(--color-lavanda); color: white; border-color: transparent; }

  /* ── Responsive breakpoints ─────────────────────────────────────────────── */
  @media (max-width: 1024px) {
    .site-nav { gap: var(--space-4); }
    .reader-nav { gap: var(--space-2); }
  }

  @media (max-width: 640px) {
    .header-inner { padding: 0 var(--space-4); gap: var(--space-3); }
    .logo-link { font-size: 22px; }
    .site-nav { display: none; }
    .reader-nav { display: none; }
    .hamburger { display: flex; }

    .site-footer { padding: var(--space-8) var(--space-4); margin-top: var(--space-12); }
    .footer-inner { flex-direction: column; align-items: flex-start; gap: var(--space-3); }
    .footer-right { margin-left: 0; width: 100%; }
  }
</style>
