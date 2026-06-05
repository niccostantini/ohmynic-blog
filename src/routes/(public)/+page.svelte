<script lang="ts">
  import ArticleCard from '$lib/components/ArticleCard.svelte';
  import TagList from '$lib/components/TagList.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const totalPages = $derived(Math.ceil(data.total / 10));
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
      <h1>Articoli</h1>
      <p class="page-sub">Pensieri e idee messi in ordine.</p>
    </header>

    {#if data.articles.length === 0}
      <p class="empty">Nessun articolo pubblicato ancora.</p>
    {:else}
      <div class="articles-grid">
        {#each data.articles as item}
          <ArticleCard article={item.article} tags={item.tags} />
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
  .page-sub {
    font-family: var(--font-sans);
    font-size: var(--text-lg);
    color: var(--color-lilla);
  }
  .empty { color: var(--color-lilla); }
  .articles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: var(--space-6);
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

  @media (max-width: 768px) {
    .page-wrap { grid-template-columns: 1fr; }
    .sidebar { position: static; }
  }
</style>
