<script lang="ts">
  import { base } from '$app/paths';
  import ArticlePlaceholder from '$lib/components/ArticlePlaceholder.svelte';
  import { buildSrcset } from '$lib/utils/image';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const MAX_IMAGE_CARDS = 3;

  const featured = $derived(data.featured ?? []);
  const articles = $derived(data.articles ?? []);

  function formatDate(d: Date | string | null) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  function tagUrl(slug: string) {
    return `${base}/search?tags=${encodeURIComponent(slug)}`;
  }

  type SidebarEntry = {
    article: {
      id: string;
      title: string;
      slug: string;
      excerpt?: string | null;
      publishedAt: Date | string | null;
      readingTimeMinutes?: number | null;
    };
    tags: Array<{ id: string; name: string; slug: string }>;
  };

  const sidebarItems: SidebarEntry[] = $derived((() => {
    const items: SidebarEntry[] = [];
    let articleOffset = 0;
    for (let slot = 1; slot <= 2; slot++) {
      if (featured[slot]) {
        items.push(featured[slot]);
      } else if (articles[articleOffset]) {
        items.push({ article: articles[articleOffset].article, tags: articles[articleOffset].tags });
        articleOffset++;
      }
    }
    return items;
  })());

  function splitTitle(title: string): [string, string] {
    const i = title.indexOf(' ');
    if (i === -1) return [title, ''];
    return [title.slice(0, i), title.slice(i)];
  }

  const visibleTags = $derived((data.tags ?? []).filter((t) => (t.count ?? 0) > 0));
</script>

<svelte:head>
  <title>OhMyNic! — Pensieri e idee</title>
  <meta name="description" content="Pensieri, idee e articoli di Nic." />
  <link rel="canonical" href="https://ohmynic.co/blog/" />
  {#if featured[0]?.article.coverImage}
    <link
      rel="preload"
      as="image"
      href={featured[0].article.coverImage}
      imagesrcset={buildSrcset(featured[0].article.coverImage) ?? undefined}
      imagesizes="(max-width: 640px) 100vw, 70vw"
      fetchpriority="high"
    />
  {/if}
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="OhMyNic!" />
  <meta property="og:title" content="OhMyNic! — Pensieri e idee" />
  <meta property="og:description" content="Pensieri, idee e articoli di Nic." />
  <meta property="og:url" content="https://ohmynic.co/blog/" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="OhMyNic! — Pensieri e idee" />
  <meta name="twitter:description" content="Pensieri, idee e articoli di Nic." />
</svelte:head>

<div class="home">

  <!-- ── Hero ─────────────────────────────────────────────────────────── -->
  {#if featured.length > 0}
    {@const hero = featured[0]}
    {@const [firstWord, restTitle] = splitTitle(hero.article.title)}

    <section class="hero">
      <a href="{base}/{hero.article.slug}" class="hero-main">
        <div class="hero-bg">
          {#if hero.article.coverImage}
            <img
              src={hero.article.coverImage}
              alt={hero.article.title}
              class="hero-image"
              srcset={buildSrcset(hero.article.coverImage) ?? undefined}
              sizes="(max-width: 640px) 100vw, 70vw"
              loading="eager"
              fetchpriority="high"
              decoding="async"
            />
          {:else}
            <div class="hero-placeholder-wrap">
              <ArticlePlaceholder slug={hero.article.slug} tagSlug={hero.tags[0]?.slug ?? 'default'} />
            </div>
          {/if}
          <div class="hero-gradient" aria-hidden="true"></div>
        </div>
        <div class="hero-content">
          <p class="hero-eyebrow">In evidenza · {formatDate(hero.article.publishedAt)}</p>
          <h2 class="hero-title"><em>{firstWord}</em>{restTitle}</h2>
          <div class="hero-meta">
            {#if hero.tags.length > 0}
              <span>{hero.tags[0].name}</span>
            {/if}
            {#if hero.article.readingTimeMinutes}
              {#if hero.tags.length > 0}<span>·</span>{/if}
              <span>{hero.article.readingTimeMinutes} min</span>
            {/if}
          </div>
        </div>
      </a>

      {#if sidebarItems.length > 0}
        <div class="hero-sidebar">
          {#each sidebarItems as item}
            <a href="{base}/{item.article.slug}" class="sidebar-item">
              {#if item.tags.length > 0}
                <span class="sidebar-tag">{item.tags[0].name}</span>
              {/if}
              <h3 class="sidebar-title">{item.article.title}</h3>
              {#if item.article.excerpt}
                <p class="sidebar-excerpt">{item.article.excerpt}</p>
              {/if}
              <div class="sidebar-meta">
                <span>{formatDate(item.article.publishedAt)}</span>
                {#if item.article.readingTimeMinutes}
                  <span>· {item.article.readingTimeMinutes} min</span>
                {/if}
              </div>
            </a>
          {/each}
        </div>
      {/if}
    </section>
  {/if}

  <!-- ── Divider ───────────────────────────────────────────────────────── -->
  <div class="divider">
    <span class="divider-label">Tutti gli articoli</span>
    <span class="divider-count">{articles.length} pubblicati</span>
  </div>

  <!-- ── Grid ─────────────────────────────────────────────────────────── -->
  {#if articles.length === 0}
    <p class="empty">Nessun articolo pubblicato ancora.</p>
  {:else}
    <div class="articles-grid">
      {#each articles as item, i}
        {#if i < MAX_IMAGE_CARDS}
          <a href="{base}/{item.article.slug}" class="grid-card">
            <div class="card-image">
              {#if item.article.coverImage}
                <img
                  src={item.article.coverImage}
                  alt={item.article.title}
                  class="card-cover"
                  srcset={buildSrcset(item.article.coverImage) ?? undefined}
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                  loading="lazy"
                  decoding="async"
                />
              {:else}
                <ArticlePlaceholder slug={item.article.slug} tagSlug={item.tags[0]?.slug ?? 'default'} />
              {/if}
            </div>
            {#if item.tags.length > 0}
              <span class="card-tag">{item.tags[0].name}</span>
            {/if}
            <h3 class="card-title">{item.article.title}</h3>
            <div class="card-meta">
              <span>{formatDate(item.article.publishedAt)}</span>
              {#if item.article.readingTimeMinutes}
                <span>· {item.article.readingTimeMinutes} min</span>
              {/if}
            </div>
          </a>
        {:else}
          <a href="{base}/{item.article.slug}" class="grid-card compact">
            {#if item.tags.length > 0}
              <span class="card-tag">{item.tags[0].name}</span>
            {/if}
            <h3 class="card-title">{item.article.title}</h3>
            <div class="card-meta">
              <span>{formatDate(item.article.publishedAt)}</span>
              {#if item.article.readingTimeMinutes}
                <span>· {item.article.readingTimeMinutes} min</span>
              {/if}
            </div>
          </a>
        {/if}
      {/each}
    </div>
  {/if}

  <!-- ── Homepage footer ──────────────────────────────────────────────── -->
  {#if visibleTags.length > 0}
    <div class="home-footer">
      <div class="tag-cloud">
        {#each visibleTags as tag}
          <a href={tagUrl(tag.slug)} class="tag-chip">{tag.name}</a>
        {/each}
      </div>
      <a href="{base}/search" class="all-link">Tutti gli articoli →</a>
    </div>
  {/if}

</div>

<style>
  /* ── Layout ───────────────────────────────────────────────────────── */
  .home {
    max-width: var(--max-width-wide);
    margin: 0 auto;
    padding: var(--space-8) var(--space-8);
  }

  /* ── Hero ─────────────────────────────────────────────────────────── */
  .hero {
    display: grid;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-lg);
    overflow: hidden;
    margin-bottom: var(--space-6);
    grid-template-columns: 1.8fr 1fr;
    min-height: 450px;
  }

  .hero-main {
    position: relative;
    display: block;
    text-decoration: none;
    border: none;
    background: var(--color-notte);
    overflow: hidden;
    min-height: 300px;
  }

  .hero-bg {
    position: absolute;
    inset: 0;
  }

  .hero-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: brightness(0.42);
    display: block;
  }

  .hero-placeholder-wrap {
    position: absolute;
    inset: 0;
    filter: brightness(0.55);
    overflow: hidden;
  }

  .hero-placeholder-wrap :global(.article-placeholder) {
    width: 100% !important;
    height: 100% !important;
    aspect-ratio: unset !important;
  }

  /* Force dark appearance in hero regardless of theme */
  :global([data-theme='light']) .hero-placeholder-wrap :global(.ph-l1) { opacity: var(--l1-op, 0.12) !important; }
  :global([data-theme='light']) .hero-placeholder-wrap :global(.ph-l2) { opacity: var(--l2-op, 0.08) !important; }
  :global([data-theme='light']) .hero-placeholder-wrap :global(.ph-l3) { opacity: var(--l3-op, 0.05) !important; }
  :global([data-theme='light']) .hero-placeholder-wrap :global(.ph-diag) { opacity: 0.17 !important; }

  .hero-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.88) 0%, transparent 60%);
  }

  .hero-content {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 14px;
    z-index: 1;
  }

  .hero-eyebrow {
    font-family: var(--font-sans);
    font-size: 10px;
    font-weight: var(--weight-semibold);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.6);
    margin: 0 0 6px;
  }

  .hero-title {
    font-family: var(--font-serif);
    font-size: var(--text-2xl);
    font-weight: 700;
    color: #ffffff;
    line-height: 1.2;
    letter-spacing: var(--tracking-tight);
    margin: 0 0 8px;
  }

  .hero-title em {
    font-style: italic;
    color: #c9a8ff;
  }

  .hero-meta {
    display: flex;
    align-items: center;
    gap: 5px;
    font-family: var(--font-sans);
    font-size: 11px;
    color: rgba(255, 255, 255, 0.55);
  }

  /* ── Sidebar ──────────────────────────────────────────────────────── */
  .hero-sidebar {
    border-left: 0.5px solid var(--color-bordo);
    display: flex;
    flex-direction: column;
    background: var(--color-nebbia);
  }

  .sidebar-item {
    flex: 1;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    text-decoration: none;
    border: none;
    color: inherit;
    transition: background var(--transition-fast);
    overflow: hidden;
  }

  .sidebar-item + .sidebar-item {
    border-top: 0.5px solid var(--color-bordo);
  }

  .sidebar-item:hover {
    background: var(--color-iris);
  }

  .sidebar-tag {
    font-family: var(--font-sans);
    font-size: 10px;
    font-weight: var(--weight-semibold);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-viola);
  }

  .sidebar-title {
    font-family: var(--font-serif);
    font-size: var(--text-xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    line-height: var(--leading-snug);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .sidebar-excerpt {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    color: var(--color-grafite);
    line-height: var(--leading-relaxed);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    flex: 1;
  }

  .sidebar-meta {
    font-family: var(--font-sans);
    font-size: 10px;
    color: var(--color-lilla);
  }

  /* ── Divider ──────────────────────────────────────────────────────── */
  .divider {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    background: var(--color-iris);
    border-top: 0.5px solid var(--color-bordo);
    border-bottom: 0.5px solid var(--color-bordo);
    margin-bottom: var(--space-6);
  }

  .divider-label {
    font-family: var(--font-sans);
    font-size: 10px;
    font-weight: var(--weight-semibold);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-notte);
  }

  .divider-count {
    font-family: var(--font-sans);
    font-size: 10px;
    color: var(--color-lilla);
  }

  /* ── Grid ─────────────────────────────────────────────────────────── */
  .articles-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-5);
    margin-bottom: var(--space-8);
  }

  @media (max-width: 768px) {
    .articles-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 640px) {
    .articles-grid { grid-template-columns: 1fr; }
  }

  .grid-card {
    display: block;
    text-decoration: none;
    border: none;
    color: inherit;
  }

  /* Image cards */
  .grid-card:not(.compact) {
    background: white;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition: border-color var(--transition-base), box-shadow var(--transition-base);
  }
  :global([data-theme='dark']) .grid-card:not(.compact) {
    background: var(--color-iris);
  }
  .grid-card:not(.compact):hover {
    border-color: var(--color-lavanda);
    box-shadow: var(--shadow-md);
  }

  .card-image {
    aspect-ratio: 16 / 9;
    overflow: hidden;
  }
  .card-cover {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .grid-card:not(.compact) .card-tag { margin: var(--space-3) var(--space-4) 0; display: block; }
  .grid-card:not(.compact) .card-title { margin: var(--space-2) var(--space-4); }
  .grid-card:not(.compact) .card-meta { margin: 0 var(--space-4) var(--space-4); }

  /* Compact cards */
  .grid-card.compact {
    padding: var(--space-3) 0;
    border-top: 0.5px solid var(--color-bordo);
  }
  .grid-card.compact:hover .card-title {
    color: var(--color-lavanda);
  }
  .grid-card.compact .card-tag { display: block; margin-bottom: var(--space-1); }

  /* Shared card typography */
  .card-tag {
    font-family: var(--font-sans);
    font-size: 10px;
    font-weight: var(--weight-semibold);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-viola);
  }

  .card-title {
    font-family: var(--font-serif);
    font-size: 13px;
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    line-height: var(--leading-snug);
    transition: color var(--transition-fast);
  }
  .grid-card:not(.compact):hover .card-title {
    color: var(--color-lavanda);
  }

  .card-meta {
    font-family: var(--font-sans);
    font-size: 11px;
    color: var(--color-lilla);
    margin-top: var(--space-1);
  }

  /* ── Homepage footer ──────────────────────────────────────────────── */
  .home-footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-4);
    padding: var(--space-6) 0;
    border-top: 0.5px solid var(--color-bordo);
    margin-top: var(--space-4);
  }

  .tag-cloud {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    flex: 1;
  }

  .tag-chip {
    display: inline-block;
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    color: var(--color-viola);
    background: var(--color-iris);
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-sm);
    padding: 3px 9px;
    text-decoration: none;
    border-bottom: 0.5px solid var(--color-bordo);
    transition: background var(--transition-fast), border-color var(--transition-fast);
  }

  .tag-chip:hover {
    background: var(--color-bordo);
    border-color: var(--color-lavanda);
  }

  .all-link {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-viola);
    text-decoration: none;
    border: none;
    white-space: nowrap;
    align-self: center;
    transition: color var(--transition-fast);
  }
  .all-link:hover { color: var(--color-lavanda); }

  .empty {
    color: var(--color-lilla);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
  }

  /* ── Mobile ───────────────────────────────────────────────────────── */
  @media (max-width: 640px) {
    .home { padding: var(--space-4) var(--space-4); }

    .hero {
      grid-template-columns: 1fr;
      min-height: unset;
    }

    .hero-main {
      aspect-ratio: 16 / 9;
      min-height: unset;
    }

    .hero-sidebar {
      border-left: none;
      border-top: 0.5px solid var(--color-bordo);
      flex-direction: row;
    }

    .sidebar-item + .sidebar-item {
      border-top: none;
      border-left: 0.5px solid var(--color-bordo);
    }

    .home-footer {
      flex-direction: column;
      gap: var(--space-3);
    }
  }
</style>
