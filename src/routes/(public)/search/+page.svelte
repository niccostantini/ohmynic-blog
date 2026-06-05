<script lang="ts">
  import { base } from '$app/paths';
  import ArticleCard from '$lib/components/ArticleCard.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let searchInput = $state(data.query);

  const totalPages = $derived(Math.ceil(data.total / data.perPage));
  const visibleTags = $derived(data.allTags.filter((t) => t.count > 0));

  function buildUrl(overrides: { tags?: string[]; page?: number }) {
    const p = new URLSearchParams({ q: data.query });
    const tags = overrides.tags ?? data.activeTags;
    if (tags.length > 0) p.set('tags', tags.join(','));
    const page = overrides.page ?? 1;
    if (page > 1) p.set('page', String(page));
    return `${base}/search?${p}`;
  }

  function tagUrl(slug: string) {
    const current = new Set(data.activeTags);
    if (current.has(slug)) current.delete(slug); else current.add(slug);
    return buildUrl({ tags: [...current] });
  }

  function pageUrl(p: number) {
    return buildUrl({ page: p });
  }
</script>

<svelte:head>
  <title>{data.query ? `Ricerca: ${data.query}` : data.activeTags.length > 0 ? `Tag: ${data.activeTags.join(', ')}` : 'Ricerca'} — OhMyNic!</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="page-wrap">

  <!-- header: back + search bar -->
  <div class="search-header">
    <a href="{base}/" class="back-link">← Tutti gli articoli</a>
    <form method="GET" action="{base}/search" class="search-form">
      <div class="search-input-wrap">
        <input
          type="search"
          name="q"
          bind:value={searchInput}
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
  </div>

  <!-- tag chips -->
  {#if visibleTags.length > 0}
    <div class="tag-chips">
      {#each visibleTags as tag}
        <a
          href={tagUrl(tag.slug)}
          class="chip"
          class:active={data.activeTags.includes(tag.slug)}
          aria-pressed={data.activeTags.includes(tag.slug)}
        >
          {tag.name}
          {#if data.activeTags.includes(tag.slug)}
            <span class="chip-remove" aria-hidden="true">×</span>
          {/if}
        </a>
      {/each}
      {#if data.activeTags.length > 0}
        <a href={buildUrl({ tags: [] })} class="chip chip-clear">
          Azzera filtri ×
        </a>
      {/if}
    </div>
  {/if}

  {#if data.results.length === 0}
    <div class="no-results">
      <p class="no-results-msg">
        {#if data.query}
          Nessun articolo trovato per <strong>"{data.query}"</strong>{data.activeTags.length > 0 ? ` con i tag selezionati` : ''}.
        {:else}
          Nessun articolo trovato con i tag selezionati.
        {/if}
      </p>
      {#if data.activeTags.length > 0}
        <a href={buildUrl({ tags: [] })} class="btn-ghost">Rimuovi filtri tag</a>
      {:else}
        <a href="{base}/" class="btn-ghost">← Torna alla homepage</a>
      {/if}
    </div>
  {:else}
    <!-- risultati header -->
    <div class="results-header">
      <span class="results-label">
        {#if data.query}Risultati per: <strong>{data.query}</strong>{:else}Tutti gli articoli{/if}
        {#each data.activeTags as slug}
          <span class="active-tag-badge">
            #{slug}
            <a href={buildUrl({ tags: data.activeTags.filter(t => t !== slug) })} class="remove-tag" aria-label="Rimuovi tag">×</a>
          </span>
        {/each}
      </span>
      <span class="results-count">{data.total} articolo{data.total !== 1 ? 'i' : ''}</span>
    </div>

    <!-- griglia risultati -->
    <div class="results-grid">
      {#each data.results as item}
        <ArticleCard article={item.article} tags={item.tags} getTagHref={tagUrl} />
      {/each}
    </div>

    <!-- paginazione -->
    {#if totalPages > 1}
      <nav class="pagination" aria-label="Paginazione risultati">
        {#if data.page > 1}
          <a href={pageUrl(data.page - 1)} class="page-btn">← Precedente</a>
        {:else}
          <span class="page-btn disabled">← Precedente</span>
        {/if}

        <div class="page-numbers">
          {#each Array.from({ length: totalPages }, (_, i) => i + 1) as p}
            {#if p === 1 || p === totalPages || Math.abs(p - data.page) <= 1}
              <a
                href={pageUrl(p)}
                class="page-num"
                class:current={p === data.page}
              >{p}</a>
            {:else if Math.abs(p - data.page) === 2}
              <span class="ellipsis">…</span>
            {/if}
          {/each}
        </div>

        {#if data.page < totalPages}
          <a href={pageUrl(data.page + 1)} class="page-btn">Successiva →</a>
        {:else}
          <span class="page-btn disabled">Successiva →</span>
        {/if}
      </nav>
    {/if}
  {/if}
</div>

<style>
  .page-wrap {
    max-width: var(--max-width-wide);
    margin: 0 auto;
    padding: var(--space-12) var(--space-8);
  }

  /* ── header ── */
  .search-header {
    display: flex;
    align-items: center;
    gap: var(--space-6);
    margin-bottom: var(--space-8);
    flex-wrap: wrap;
  }

  .back-link {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    color: var(--color-lilla);
    text-decoration: none;
    white-space: nowrap;
    transition: color var(--transition-fast);
  }
  .back-link:hover { color: var(--color-notte); }

  .search-form { flex: 1; max-width: 560px; }

  .search-input-wrap {
    display: flex;
    align-items: center;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-md);
    background: white;
    overflow: hidden;
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

  /* ── tag chips ── */
  .tag-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-bottom: var(--space-8);
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
    color: var(--color-viola);
    background: var(--color-iris);
    border: 0.5px solid transparent;
    border-radius: var(--radius-pill);
    padding: 4px 12px;
    text-decoration: none;
    transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
  }
  .chip:hover { background: var(--color-bordo); }
  .chip.active {
    background: var(--color-lavanda);
    color: white;
    border-color: var(--color-viola);
  }
  .chip-clear {
    color: var(--color-lilla);
    background: transparent;
    border-color: var(--color-bordo);
    margin-left: var(--space-2);
  }
  .chip-clear:hover { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
  .chip-remove {
    font-size: 14px;
    line-height: 1;
    margin-left: 2px;
    opacity: 0.8;
  }

  /* ── risultati header ── */
  .results-header {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    margin-bottom: var(--space-8);
    flex-wrap: wrap;
  }

  .results-label {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    font-family: var(--font-sans);
    font-size: var(--text-base);
    color: var(--color-notte);
    flex-wrap: wrap;
  }

  .active-tag-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: var(--color-lavanda);
    color: white;
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    padding: 2px 10px;
    border-radius: var(--radius-pill);
  }

  .remove-tag {
    color: white;
    text-decoration: none;
    font-size: 14px;
    line-height: 1;
    opacity: 0.8;
    transition: opacity var(--transition-fast);
  }
  .remove-tag:hover { opacity: 1; }

  .results-count {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    color: var(--color-lilla);
    margin-left: auto;
  }

  /* ── griglia ── */
  .results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--space-6);
    margin-bottom: var(--space-10);
  }

  /* ── paginazione ── */
  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    padding-top: var(--space-6);
    border-top: 0.5px solid var(--color-bordo);
  }

  .page-btn {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-notte);
    background: white;
    padding: 7px 16px;
    border-radius: var(--radius-md);
    border: 0.5px solid var(--color-bordo);
    text-decoration: none;
    transition: border-color var(--transition-fast), background var(--transition-fast);
  }
  .page-btn:not(.disabled):hover { border-color: var(--color-lavanda); background: var(--color-iris); }
  .page-btn.disabled { color: var(--color-lilla); cursor: default; }

  .page-numbers {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }

  .page-num {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    color: var(--color-notte);
    text-decoration: none;
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    border: 0.5px solid transparent;
    transition: background var(--transition-fast), border-color var(--transition-fast);
  }
  .page-num:hover { background: var(--color-iris); border-color: var(--color-bordo); }
  .page-num.current {
    background: var(--color-lavanda);
    color: white;
    border-color: var(--color-lavanda);
  }

  .ellipsis {
    font-size: var(--text-sm);
    color: var(--color-lilla);
    padding: 0 var(--space-1);
  }

  /* ── no results ── */
  .no-results {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-6);
    padding: var(--space-12) 0;
  }

  .no-results-msg {
    font-family: var(--font-sans);
    font-size: var(--text-lg);
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
    text-decoration: none;
    transition: border-color var(--transition-fast), background var(--transition-fast);
  }
  .btn-ghost:hover { border-color: var(--color-lavanda); background: var(--color-iris); }

  @media (max-width: 640px) {
    .page-wrap { padding: var(--space-8) var(--space-4); }
    .search-form { width: 100%; }
    .results-count { margin-left: 0; }
    .page-numbers { display: none; }
  }
</style>
