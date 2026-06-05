<script lang="ts">
  import { base } from '$app/paths';
  import ArticleCard from '$lib/components/ArticleCard.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let searchInput = $state(data.query);
</script>

<svelte:head>
  <title>Ricerca: {data.query} — OhMyNic!</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="page-wrap">
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

  {#if data.results.length === 0}
    <div class="no-results">
      <p class="no-results-msg">
        Nessun articolo trovato per <strong>"{data.query}"</strong>.
      </p>
      <a href="{base}/" class="btn-ghost">← Torna alla homepage</a>
    </div>
  {:else}
    <div class="results-header">
      <span class="results-label">
        Risultati per: <strong>{data.query}</strong>
      </span>
      <span class="results-count">{data.results.length} articolo{data.results.length !== 1 ? 'i' : ''}</span>
    </div>

    <div class="results-grid">
      {#each data.results as item}
        <ArticleCard article={item.article} tags={item.tags} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .page-wrap {
    max-width: var(--max-width-wide);
    margin: 0 auto;
    padding: var(--space-12) var(--space-8);
  }

  .search-header {
    display: flex;
    align-items: center;
    gap: var(--space-6);
    margin-bottom: var(--space-10);
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

  .results-header {
    display: flex;
    align-items: baseline;
    gap: var(--space-4);
    margin-bottom: var(--space-8);
    flex-wrap: wrap;
  }

  .results-label {
    font-family: var(--font-sans);
    font-size: var(--text-lg);
    color: var(--color-notte);
  }

  .results-count {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    color: var(--color-lilla);
  }

  .results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--space-6);
  }

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
    .search-header { gap: var(--space-4); }
    .search-form { width: 100%; }
  }
</style>
