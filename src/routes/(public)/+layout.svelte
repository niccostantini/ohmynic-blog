<script lang="ts">
  import { base } from '$app/paths';
  import { afterNavigate } from '$app/navigation';
  import { fly, fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
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
    if (!to?.url) return;
    const path = to.url.pathname;
    const SECTIONS = ['/tag/', '/author/', '/search', '/account', '/login', '/register', '/privacy', '/cookie-policy'];
    const isSection = SECTIONS.some(s => path.includes(s)) || path === '/blog/' || path === '/blog';
    if (isSection) trackPageview(path);
  });

  async function logout() {
    await fetch(`${base}/api/reader-logout`, { method: 'POST' });
    window.location.href = `${base}/`;
  }

  // ── Swipe-down to close ──────────────────────────────────────────────────
  let swipeStartY = 0;

  function onDrawerTouchStart(e: TouchEvent) {
    swipeStartY = e.touches[0].clientY;
  }

  function onDrawerTouchEnd(e: TouchEvent) {
    const delta = e.changedTouches[0].clientY - swipeStartY;
    if (delta > 60) mobileMenuOpen = false;
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
        <i class="ti ti-menu-2"></i>
      </button>
    </div>
  </header>

  <main class="site-main">
    {@render children()}
  </main>

  <footer class="site-footer">
    <div class="footer-inner">
      <Logo />
      <p class="footer-copy">© {new Date().getFullYear()} OhMyNic! — Tutti i diritti riservati.</p>
      <nav class="footer-links" aria-label="Link legali">
        <a href="{base}/privacy">Privacy policy</a>
        <a href="{base}/cookie-policy">Cookie policy</a>
      </nav>
      <div class="footer-right">
        <button class="footer-feedback-link" onclick={() => feedbackOpen = true}>
          Segnala un problema
        </button>
        <ThemeSwitcher />
      </div>
    </div>
  </footer>
</div>

{#if mobileMenuOpen}
  <!-- Backdrop -->
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div
    class="drawer-backdrop"
    transition:fade={{ duration: 200 }}
    onclick={() => mobileMenuOpen = false}
  ></div>

  <!-- Drawer -->
  <div
    class="drawer"
    transition:fly={{ y: 400, duration: 300, easing: cubicOut }}
    ontouchstart={onDrawerTouchStart}
    ontouchend={onDrawerTouchEnd}
    role="dialog"
    aria-modal="true"
    aria-label="Menu di navigazione"
  >
    <div class="drawer-handle" aria-hidden="true"></div>

    <nav class="drawer-nav" aria-label="Menu mobile">
      {#each data.navItems as item (item.id)}
        <a
          href={item.url ?? '#'}
          class:nav-active={page.url.pathname === item.url || (item.url !== '/blog' && page.url.pathname.startsWith(item.url ?? ''))}
          target={item.openInNewTab ? '_blank' : undefined}
          rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
        >{item.label}</a>
      {/each}

      {#if data.reader}
        <a href="{base}/account" class="drawer-account">
          <span class="reader-avatar sm">{data.reader.displayName.charAt(0).toUpperCase()}</span>
          <span>{data.reader.displayName}</span>
        </a>
        <button class="drawer-logout" onclick={logout}>Esci dall'account</button>
      {:else}
        <div class="drawer-auth">
          <a href="{base}/login" class="drawer-auth-link">Accedi</a>
          <a href="{base}/register" class="drawer-auth-btn">Registrati</a>
        </div>
      {/if}
    </nav>

    <div class="drawer-theme">
      <div class="drawer-theme-row">
        <span class="drawer-theme-label">Modalità</span>
        <ThemeToggle />
      </div>
      <div class="drawer-theme-row drawer-theme-color">
        <span class="drawer-theme-label">Tema colore</span>
        <ThemeSwitcher />
      </div>
    </div>
  </div>
{/if}

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
  .reader-avatar.sm { width: 26px; height: 26px; font-size: 12px; }
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

  .footer-links {
    display: flex;
    gap: var(--space-4);
    align-items: center;
  }
  .footer-links a {
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    color: var(--color-lilla);
    text-decoration: none;
    border: none;
    transition: color var(--transition-fast);
  }
  .footer-links a:hover { color: var(--color-notte); }

  /* ── Hamburger ─────────────────────────────────────────────────────────── */
  .hamburger {
    display: none;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-notte);
    font-size: 22px;
    margin-left: auto;
    flex-shrink: 0;
    border-radius: var(--radius-md);
    transition: background var(--transition-fast);
  }
  .hamburger:hover { background: var(--color-iris); }

  /* ── Drawer backdrop ───────────────────────────────────────────────────── */
  .drawer-backdrop {
    position: fixed;
    inset: 0;
    z-index: 40;
    background: rgba(0, 0, 0, 0.4);
  }

  /* ── Drawer ────────────────────────────────────────────────────────────── */
  .drawer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 50;
    background: var(--color-nebbia);
    border-top: 0.5px solid var(--color-bordo);
    border-radius: 16px 16px 0 0;
    padding: var(--space-2) var(--space-5) calc(var(--space-6) + env(safe-area-inset-bottom));
    max-height: 85vh;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .drawer-handle {
    width: 36px;
    height: 4px;
    background: var(--color-bordo);
    border-radius: 99px;
    margin: var(--space-2) auto var(--space-4);
  }

  /* ── Drawer nav links ──────────────────────────────────────────────────── */
  .drawer-nav {
    display: flex;
    flex-direction: column;
    margin-bottom: var(--space-4);
  }
  .drawer-nav a {
    font-family: var(--font-sans);
    font-size: var(--text-base);
    font-weight: var(--weight-medium);
    color: var(--color-lilla);
    text-decoration: none;
    border: none;
    border-bottom: 0.5px solid var(--color-bordo);
    padding: 14px 0;
    min-height: 44px;
    display: flex;
    align-items: center;
    transition: color var(--transition-fast);
  }
  .drawer-nav a:hover { color: var(--color-notte); }
  .drawer-nav a.nav-active { color: var(--color-viola); font-weight: var(--weight-semibold); }

  .drawer-account {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  .drawer-logout {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    color: var(--color-lilla);
    background: none;
    border: none;
    border-bottom: 0.5px solid var(--color-bordo);
    padding: 14px 0;
    min-height: 44px;
    cursor: pointer;
    text-align: left;
    width: 100%;
    transition: color var(--transition-fast);
  }
  .drawer-logout:hover { color: var(--color-notte); }

  .drawer-auth {
    display: flex;
    gap: var(--space-3);
    padding: var(--space-3) 0;
    border-bottom: 0.5px solid var(--color-bordo);
    align-items: center;
  }
  .drawer-auth-link {
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
  .drawer-auth-link:hover { color: var(--color-notte); }
  .drawer-auth-btn {
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
  .drawer-auth-btn:hover { background: var(--color-lavanda); color: white; border-color: transparent; }

  /* ── Drawer theme section ──────────────────────────────────────────────── */
  .drawer-theme {
    padding-top: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
  .drawer-theme-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
  }
  .drawer-theme-color { align-items: flex-start; }
  .drawer-theme-label {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-notte);
    flex-shrink: 0;
  }

  /* ── Responsive ─────────────────────────────────────────────────────────── */
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
    .footer-links { gap: var(--space-3); }
  }
</style>
