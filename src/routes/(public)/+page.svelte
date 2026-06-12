<script lang="ts">
  import { base } from '$app/paths';
  import ArticleCard from '$lib/components/ArticleCard.svelte';
  import FeaturedCard from '$lib/components/FeaturedCard.svelte';
  import TagList from '$lib/components/TagList.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const totalPages = $derived(Math.ceil(data.total / 10));
  const featured = $derived(data.featured ?? []);

  function tagUrl(slug: string) {
    return `${base}/search?tags=${encodeURIComponent(slug)}`;
  }
</script>

<svelte:head>
  <title>OhMyNic! — Pensieri e idee</title>
  <meta name="description" content="Pensieri, idee e articoli di Nic." />
  <link rel="canonical" href="https://ohmynic.co/blog/" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="OhMyNic!" />
  <meta property="og:title" content="OhMyNic! — Pensieri e idee" />
  <meta property="og:description" content="Pensieri, idee e articoli di Nic." />
  <meta property="og:url" content="https://ohmynic.co/blog/" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="OhMyNic! — Pensieri e idee" />
  <meta name="twitter:description" content="Pensieri, idee e articoli di Nic." />
</svelte:head>

<div class="page-wrap">
  <div class="content-col">
    <header class="page-header">
      <h1>Pensieri e idee messi in ordine.</h1>
    </header>

    {#if featured.length > 0}
      <section class="featured-section" class:layout-1={featured.length === 1} class:layout-2={featured.length === 2} class:layout-3={featured.length === 3}>
        <h2 class="featured-label">In evidenza</h2>
        <div class="featured-grid">
          {#each featured as item, i}
            <FeaturedCard
              article={item.article}
              tags={item.tags}
              variant={i === 0 ? 'main' : 'side'}
              priority={i === 0}
            />
          {/each}
        </div>
      </section>
      <hr class="featured-separator" />
    {/if}

    <form method="GET" action="{base}/search" class="search-form">
      <div class="search-input-wrap">
        <input
          type="search"
          name="q"
          placeholder="Cerca tra gli articoli..."
          class="search-input"
          autocomplete="off"
        />
        <button type="submit" class="search-btn" aria-label="Cerca">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
      </div>
    </form>

    {#if data.articles.length === 0}
      <p class="empty">Nessun articolo pubblicato ancora.</p>
    {:else}
      <div class="articles-grid">
        {#each data.articles as item}
          <ArticleCard article={item.article} tags={item.tags} getTagHref={tagUrl} />
        {/each}
      </div>

      {#if totalPages > 1}
        <nav class="pagination">
          {#if data.page > 1}
            <a href="?page={data.page - 1}" class="btn-ghost">← Precedente</a>
          {/if}
          <span class="page-info">Pagina {data.page} di {totalPages}</span>
          {#if data.page < totalPages}
            <a href="?page={data.page + 1}" class="btn-ghost">Successiva →</a>
          {/if}
        </nav>
      {/if}
    {/if}
  </div>

  <aside class="sidebar">
    <TagList tags={data.tags} />
  </aside>
</div>

<style>
  .page-wrap {
    max-width: var(--max-width-wide);
    margin: 0 auto;
    padding: var(--space-12) var(--space-8);
    display: grid;
    grid-template-columns: 1fr 220px;
    gap: var(--space-12);
    align-items: start;
  }
  @media (max-width: 1024px) {
    .page-wrap { grid-template-columns: 1fr; gap: var(--space-8); }
    .sidebar { display: none; }
  }
  /* ── Featured section ──────────────────────────────────────────────────── */
  .featured-section { margin-bottom: var(--space-8); }

  .featured-label {
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    letter-spacing: var(--tracking-wider);
    text-transform: uppercase;
    color: var(--color-lilla);
    margin-bottom: var(--space-4);
  }

  .featured-grid {
    display: grid;
    gap: var(--space-4);
  }
  .layout-1 .featured-grid { grid-template-columns: 1fr; }
  .layout-2 .featured-grid { grid-template-columns: 3fr 2fr; }
  .layout-3 .featured-grid { grid-template-columns: 1fr 1fr; grid-template-rows: auto; }
  /* grid-row span must use :global because .featured-main lives inside FeaturedCard */
  .layout-3 :global(.featured-main) { grid-row: span 2; }

  @media (max-width: 640px) {
    .layout-2 .featured-grid,
    .layout-3 .featured-grid { grid-template-columns: 1fr; }
    .layout-3 :global(.featured-main) { grid-row: span 1; }
  }

  .featured-separator {
    border: none;
    border-top: 0.5px solid var(--color-bordo);
    margin: 0 0 var(--space-8);
  }

  .page-header { margin-bottom: var(--space-10); }
  h1 {
    font-family: var(--font-serif);
    font-size: var(--text-4xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    letter-spacing: var(--tracking-tight);
    line-height: var(--leading-tight);
    margin-bottom: var(--space-3);
  }
  .empty { color: var(--color-lilla); }

  .search-form {
    margin-bottom: var(--space-8);
  }

  .search-input-wrap {
    display: flex;
    align-items: center;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-md);
    background: white;
    overflow: hidden;
    max-width: 480px;
    transition: border-color var(--transition-fast);
  }
  .search-input-wrap:focus-within { border-color: var(--color-lavanda); }

  .search-input {
    flex: 1;
    padding: 10px var(--space-4);
    border: none;
    outline: none;
    font-family: var(--font-sans);
    font-size: var(--text-base);
    color: var(--color-notte);
    background: transparent;
  }
  .search-input::placeholder { color: var(--color-lilla); }

  .search-btn {
    padding: 10px var(--space-3);
    background: none;
    border: none;
    color: var(--color-lilla);
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: color var(--transition-fast);
  }
  .search-btn:hover { color: var(--color-viola); }
  .articles-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-6);
  }
  @media (max-width: 1024px) {
    .articles-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 640px) {
    .articles-grid { grid-template-columns: 1fr; }
  }
  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-4);
    margin-top: var(--space-10);
  }
  .page-info {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    color: var(--color-lilla);
  }
  .btn-ghost {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    background: transparent;
    color: var(--color-notte);
    padding: 8px 20px;
    border-radius: var(--radius-md);
    border: 0.5px solid var(--color-bordo);
    cursor: pointer;
    letter-spacing: var(--tracking-wide);
    text-decoration: none;
    transition: border-color var(--transition-fast), background var(--transition-fast);
  }
  .btn-ghost:hover { border-color: var(--color-lavanda); background: var(--color-iris); }
  .sidebar { position: sticky; top: 80px; }

  @media (max-width: 640px) {
    .page-wrap { padding: var(--space-8) var(--space-4); }
    h1 { font-size: var(--text-3xl); }
  }
</style>
