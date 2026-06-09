<script lang="ts">
  import { base } from '$app/paths';
  import ArticleCard from '$lib/components/ArticleCard.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const totalPages = $derived(Math.ceil(data.total / 10));
  const displayName = $derived(data.author.displayName ?? data.author.username);
</script>

<svelte:head>
  <title>Articoli di {displayName} — OhMyNic!</title>
  <meta name="description" content={data.author.bio ?? `Tutti gli articoli di ${displayName}.`} />
  <link rel="canonical" href="https://ohmynic.co/blog/author/{data.author.username}" />
  <meta property="og:type" content="profile" />
  <meta property="og:site_name" content="OhMyNic!" />
  <meta property="og:title" content="Articoli di {displayName} — OhMyNic!" />
  <meta property="og:url" content="https://ohmynic.co/blog/author/{data.author.username}" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="Articoli di {displayName} — OhMyNic!" />
</svelte:head>

<div class="page-wrap">
  <div class="content-col">
    <header class="page-header">
      <a href="{base}/" class="back-link">← Tutti gli articoli</a>
      <div class="author-profile">
        {#if data.author.avatarUrl}
          <img src={data.author.avatarUrl} alt={displayName} class="author-avatar" />
        {:else}
          <div class="author-avatar-placeholder">{displayName[0]?.toUpperCase()}</div>
        {/if}
        <div class="author-info">
          <h1 class="author-name">{displayName}</h1>
          {#if data.author.bio}
            <p class="author-bio">{data.author.bio}</p>
          {/if}
          <p class="author-count">{data.total} articolo{data.total !== 1 ? 'i' : ''}</p>
        </div>
      </div>
    </header>

    {#if data.articles.length === 0}
      <p class="empty">Nessun articolo pubblicato.</p>
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
</div>

<style>
  .page-wrap {
    max-width: var(--max-width-wide);
    margin: 0 auto;
    padding: var(--space-12) var(--space-8);
  }
  .content-col { max-width: 780px; }
  .back-link {
    display: inline-block;
    font-size: var(--text-sm);
    color: var(--color-lilla);
    text-decoration: none;
    border: none;
    margin-bottom: var(--space-6);
    transition: color var(--transition-fast);
  }
  .back-link:hover { color: var(--color-notte); }

  .author-profile {
    display: flex;
    align-items: flex-start;
    gap: var(--space-5);
    margin-bottom: var(--space-8);
  }
  .author-avatar {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    border: 2px solid var(--color-bordo);
  }
  .author-avatar-placeholder {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: var(--color-iris);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-serif);
    font-size: var(--text-2xl);
    font-weight: var(--weight-semibold);
    color: var(--color-viola);
    flex-shrink: 0;
  }
  .author-info { flex: 1; }
  .author-name {
    font-family: var(--font-serif);
    font-size: var(--text-2xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    letter-spacing: var(--tracking-tight);
    margin-bottom: var(--space-2);
  }
  .author-bio {
    font-size: var(--text-base);
    color: var(--color-grafite);
    line-height: var(--leading-relaxed);
    margin-bottom: var(--space-2);
  }
  .author-count { font-size: var(--text-sm); color: var(--color-lilla); }

  .articles-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-6);
  }
  .empty { color: var(--color-lilla); font-size: var(--text-base); padding: var(--space-8) 0; }

  .pagination {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    justify-content: center;
    margin-top: var(--space-10);
  }
  .page-info { font-size: var(--text-sm); color: var(--color-lilla); }
  .btn-ghost {
    display: inline-block;
    padding: var(--space-2) var(--space-4);
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    color: var(--color-lilla);
    text-decoration: none;
    transition: border-color var(--transition-fast), color var(--transition-fast);
  }
  .btn-ghost:hover { border-color: var(--color-lavanda); color: var(--color-notte); }

  @media (max-width: 640px) {
    .page-wrap { padding: var(--space-8) var(--space-4); }
    .articles-grid { grid-template-columns: 1fr; }
    .author-profile { flex-direction: column; align-items: center; text-align: center; }
  }
</style>
