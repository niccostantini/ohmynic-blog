<script lang="ts">
  import { base } from '$app/paths';
  import ArticleCard from '$lib/components/ArticleCard.svelte';
  import TagList from '$lib/components/TagList.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const totalPages = $derived(Math.ceil(data.total / 10));
  const featured = $derived(data.featured ?? []);

  function tagUrl(slug: string) {
    return `${base}/search?tags=${encodeURIComponent(slug)}`;
  }

  function formatDate(d: Date | string | null) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
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
            <a href="{base}/{item.article.slug}" class="featured-card" class:featured-main={i === 0} class:featured-side={i > 0}>
              {#if item.article.coverImage}
                <div class="featured-cover-wrap">
                  <img src={item.article.coverImage} alt={item.article.title} class="featured-cover" />
                </div>
              {/if}
              <div class="featured-body">
                <div class="featured-meta-top">
                  <span class="featured-badge"><i class="ti ti-star"></i> In evidenza</span>
                  {#if item.article.type === 'page'}
                    <span class="type-badge">Pagina</span>
                  {:else if item.tags.length > 0}
                    <div class="featured-tags">
                      {#each item.tags.slice(0, 2) as tag}
                        <span class="featured-tag">{tag.name}</span>
                      {/each}
                    </div>
                  {/if}
                </div>
                <h3 class="featured-title">{item.article.title}</h3>
                {#if item.article.excerpt}
                  <p class="featured-excerpt">{item.article.excerpt}</p>
                {/if}
                {#if item.article.type !== 'page' && item.article.publishedAt}
                  <span class="featured-date">{formatDate(item.article.publishedAt)}</span>
                {/if}
              </div>
            </a>
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
  .layout-3 .featured-main { grid-row: span 2; }

  @media (max-width: 640px) {
    .layout-2 .featured-grid,
    .layout-3 .featured-grid { grid-template-columns: 1fr; }
    .layout-3 .featured-main { grid-row: span 1; }
  }

  .featured-card {
    display: flex;
    flex-direction: column;
    background: white;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-lg);
    overflow: hidden;
    text-decoration: none;
    transition: border-color var(--transition-base), box-shadow var(--transition-base);
  }
  .featured-card:hover {
    border-color: var(--color-lavanda);
    box-shadow: var(--shadow-md);
  }

  .featured-cover-wrap { flex-shrink: 0; }
  .featured-main .featured-cover { height: 220px; }
  .featured-side .featured-cover { height: 140px; }
  .featured-cover {
    width: 100%;
    object-fit: cover;
    display: block;
  }

  .featured-body {
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .featured-meta-top {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;
    margin-bottom: var(--space-3);
  }

  .featured-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: var(--weight-semibold);
    color: var(--color-viola);
    background: var(--color-iris);
    border: 0.5px solid var(--color-bordo);
    border-radius: 99px;
    padding: 2px 9px;
  }

  .type-badge {
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: var(--weight-medium);
    color: var(--color-lilla);
    background: var(--color-nebbia);
    border: 0.5px solid var(--color-bordo);
    border-radius: 99px;
    padding: 2px 9px;
  }

  .featured-tags {
    display: flex;
    gap: var(--space-1);
  }
  .featured-tag {
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: var(--weight-medium);
    color: var(--color-viola);
    background: var(--color-iris);
    border-radius: var(--radius-sm);
    padding: 2px 7px;
  }

  .featured-title {
    font-family: var(--font-serif);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    letter-spacing: var(--tracking-tight);
    line-height: var(--leading-snug);
    margin-bottom: var(--space-2);
  }
  .featured-main .featured-title { font-size: var(--text-2xl); }
  .featured-side .featured-title { font-size: var(--text-lg); }

  .featured-excerpt {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    color: var(--color-grafite);
    line-height: var(--leading-relaxed);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: var(--space-3);
    flex: 1;
  }
  .featured-side .featured-excerpt { -webkit-line-clamp: 2; line-clamp: 2; }

  .featured-date {
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    color: var(--color-lilla);
    margin-top: auto;
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
  .page-sub {
    font-family: var(--font-sans);
    font-size: var(--text-lg);
    color: var(--color-lilla);
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
