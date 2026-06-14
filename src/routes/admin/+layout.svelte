<script lang="ts">
  import { base } from '$app/paths';
  import { page } from '$app/state';
  import { afterNavigate } from '$app/navigation';
  import type { LayoutData } from './$types';
  import type { Snippet } from 'svelte';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import Toast from '$lib/components/Toast.svelte';
  import FeedbackModal from '$lib/components/FeedbackModal.svelte';
  import '$lib/styles/admin-editor.css';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  let feedbackOpen = $state(false);
  let adminMenuOpen = $state(false);
  let dropdownEl = $state<HTMLElement | null>(null);

  afterNavigate(() => { adminMenuOpen = false; });

  $effect(() => {
    if (!adminMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownEl && !dropdownEl.contains(e.target as Node)) adminMenuOpen = false;
    }
    const id = window.setTimeout(() => document.addEventListener('click', handleClick), 10);
    return () => { window.clearTimeout(id); document.removeEventListener('click', handleClick); };
  });

  const isAdmin = data.user.role === 'admin';
  const isEditor = data.user.role === 'editor' || isAdmin;
</script>

<svelte:head>
  <meta name="robots" content="noindex, nofollow" />
  <!-- Admin: sync load — icons needed immediately throughout the CMS -->
  <link rel="stylesheet" href="{base}/fonts/tabler-icons.css">
</svelte:head>

<div class="admin-shell">
  <header class="admin-header">
    <a href="{base}/admin" class="logo-link">Oh<em>My</em>Nic!</a>

    <!-- Stessa navbar del sito pubblico -->
    <nav class="site-nav" aria-label="Navigazione principale">
      {#each data.navItems as item (item.id)}
        <a
          href={item.url ?? '#'}
          class:nav-active={page.url.pathname === item.url || (item.url !== `${base}/` && item.url !== base && page.url.pathname.startsWith(item.url ?? ''))}
          target={item.openInNewTab ? '_blank' : undefined}
          rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
        >{item.label}</a>
      {/each}
    </nav>

    <!-- Dropdown admin CMS -->
    <div class="admin-dropdown" bind:this={dropdownEl}>
      <button
        class="admin-dropdown-trigger"
        class:open={adminMenuOpen}
        onclick={() => adminMenuOpen = !adminMenuOpen}
        aria-expanded={adminMenuOpen}
        aria-haspopup="true"
      >
        <i class="ti ti-layout-dashboard"></i>
        <span>CMS</span>
        <i class="ti ti-chevron-down chevron"></i>
      </button>

      {#if adminMenuOpen}
        <div class="admin-dropdown-menu" role="menu">
          <a href="{base}/admin" class:active={page.url.pathname === `${base}/admin`} role="menuitem">
            <i class="ti ti-article"></i> Articoli
          </a>
          {#if isAdmin}
            <a href="{base}/admin/pages" class:active={page.url.pathname.startsWith(`${base}/admin/pages`)} role="menuitem">
              <i class="ti ti-files"></i> Pagine
            </a>
          {/if}

          <div class="menu-divider"></div>

          {#if isEditor}
            <a href="{base}/admin/comments" class:active={page.url.pathname.startsWith(`${base}/admin/comments`)} role="menuitem">
              <i class="ti ti-messages"></i> Commenti
            </a>
          {/if}
          {#if isAdmin}
            <a href="{base}/admin/users" class:active={page.url.pathname.startsWith(`${base}/admin/users`)} role="menuitem">
              <i class="ti ti-users"></i> Utenti
            </a>
          {/if}
          {#if isEditor}
            <a href="{base}/admin/analytics" class:active={page.url.pathname.startsWith(`${base}/admin/analytics`)} role="menuitem">
              <i class="ti ti-chart-dots-3"></i> Analytics
            </a>
          {/if}
          {#if isEditor}
            <a href="{base}/admin/polls" class:active={page.url.pathname.startsWith(`${base}/admin/polls`)} role="menuitem">
              <i class="ti ti-chart-bar"></i> Sondaggi
            </a>
          {/if}
          {#if isAdmin}
            <a href="{base}/admin/feedback" class:active={page.url.pathname.startsWith(`${base}/admin/feedback`)} role="menuitem">
              <i class="ti ti-flag-3"></i>
              Feedback
              {#if data.newFeedbackCount > 0}
                <span class="menu-badge">{data.newFeedbackCount}</span>
              {/if}
            </a>
          {/if}

          {#if isAdmin}
            <div class="menu-divider"></div>
            <a href="{base}/admin/settings" class:active={page.url.pathname.startsWith(`${base}/admin/settings`)} role="menuitem">
              <i class="ti ti-settings"></i> Impostazioni
            </a>
          {/if}
        </div>
      {/if}
    </div>

    <div class="header-right">
      <button class="btn-icon" onclick={() => feedbackOpen = true} title="Segnala un problema" aria-label="Segnala un problema">
        <i class="ti ti-bug"></i>
      </button>
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
<FeedbackModal bind:open={feedbackOpen} />

<style>
  .admin-shell {
    min-height: 100vh;
    background: var(--color-nebbia);
  }

  .admin-header {
    display: flex;
    align-items: center;
    gap: var(--space-5);
    padding: 0 var(--space-8);
    height: 56px;
    background: white;
    border-bottom: 0.5px solid var(--color-bordo);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  :global([data-theme='dark']) .admin-header {
    background: var(--color-iris);
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

  /* Navbar pubblica */
  .site-nav {
    display: flex;
    align-items: center;
    gap: var(--space-5);
    flex: 1;
  }
  .site-nav a {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-lilla);
    text-decoration: none;
    border: none;
    transition: color var(--transition-fast);
    white-space: nowrap;
  }
  .site-nav a:hover,
  .site-nav a.nav-active { color: var(--color-notte); }

  /* Dropdown CMS */
  .admin-dropdown {
    position: relative;
    flex-shrink: 0;
  }

  .admin-dropdown-trigger {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-lilla);
    background: none;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-md);
    padding: 5px 10px;
    cursor: pointer;
    transition: color var(--transition-fast), background var(--transition-fast), border-color var(--transition-fast);
    white-space: nowrap;
  }
  .admin-dropdown-trigger:hover,
  .admin-dropdown-trigger.open {
    color: var(--color-notte);
    background: var(--color-nebbia);
    border-color: var(--color-lavanda);
  }
  .admin-dropdown-trigger .chevron {
    font-size: 14px;
    transition: transform 200ms;
  }
  .admin-dropdown-trigger.open .chevron {
    transform: rotate(180deg);
  }
  .admin-dropdown-trigger i { font-size: 16px; line-height: 1; }

  .admin-dropdown-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    background: white;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-lg);
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    padding: 6px;
    min-width: 180px;
    display: flex;
    flex-direction: column;
    gap: 1px;
    z-index: 200;
  }
  :global([data-theme='dark']) .admin-dropdown-menu {
    background: var(--color-iris);
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  }

  .admin-dropdown-menu a {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: 7px 10px;
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-prugna);
    text-decoration: none;
    border: none;
    transition: background var(--transition-fast), color var(--transition-fast);
    white-space: nowrap;
  }
  .admin-dropdown-menu a i {
    font-size: 16px;
    color: var(--color-lilla);
    flex-shrink: 0;
    transition: color var(--transition-fast);
  }
  .admin-dropdown-menu a:hover {
    background: var(--color-nebbia);
    color: var(--color-notte);
  }
  .admin-dropdown-menu a:hover i { color: var(--color-viola); }
  .admin-dropdown-menu a.active {
    background: var(--color-iris);
    color: var(--color-viola);
  }
  .admin-dropdown-menu a.active i { color: var(--color-viola); }

  .menu-divider {
    height: 0.5px;
    background: var(--color-bordo);
    margin: 4px 4px;
  }

  .menu-badge {
    margin-left: auto;
    font-size: 10px;
    font-weight: var(--weight-semibold);
    background: #b91c1c;
    color: white;
    border-radius: 99px;
    padding: 1px 6px;
    line-height: 1.5;
  }

  /* Destra header */
  .header-right {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-shrink: 0;
  }

  .btn-icon {
    font-size: 18px;
    color: var(--color-lilla);
    background: none;
    border: none;
    line-height: 1;
    padding: 5px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: color var(--transition-fast);
    display: flex;
    align-items: center;
  }
  .btn-icon:hover { color: var(--color-notte); }

  .btn-ghost {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    background: transparent;
    color: var(--color-lilla);
    padding: 5px 12px;
    border-radius: var(--radius-md);
    border: 0.5px solid var(--color-bordo);
    cursor: pointer;
    transition: color var(--transition-fast), border-color var(--transition-fast);
    white-space: nowrap;
  }
  .btn-ghost:hover { color: var(--color-notte); border-color: var(--color-lavanda); }

  .admin-main {
    max-width: var(--max-width-wide);
    margin: 0 auto;
    padding: var(--space-8);
  }

  @media (max-width: 768px) {
    .admin-header { padding: 0 var(--space-4); gap: var(--space-3); overflow: hidden; }
    .site-nav { display: none; }
    .admin-main { padding: var(--space-4); }
  }
</style>
