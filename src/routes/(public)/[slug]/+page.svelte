<script lang="ts">
  import { base } from '$app/paths';
  import { onMount } from 'svelte';
  import ArticleCard from '$lib/components/ArticleCard.svelte';
  import CommentForm from '$lib/components/CommentForm.svelte';
  import CommentList from '$lib/components/CommentList.svelte';
  import ShareButtons from '$lib/components/ShareButtons.svelte';
  import TagList from '$lib/components/TagList.svelte';
  import { trackPageview, initCompletionTracking } from '$lib/analytics';
  import ReadingProgress from '$lib/components/ReadingProgress.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let proseEl = $state<HTMLElement | null>(null);

  onMount(() => {
    // Pageview con articleId
    trackPageview(window.location.pathname, data.article.id);
    // Completion tracking
    if (proseEl) return initCompletionTracking(data.article.id, proseEl);
  });

  let bookmarked = $state(data.bookmarked ?? false);
  let bookmarkLoading = $state(false);

  async function toggleBookmark() {
    if (!data.reader) {
      window.location.href = `${base}/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    bookmarkLoading = true;
    try {
      const res = await fetch(`${base}/api/bookmarks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: data.article.id }),
      });
      if (res.ok) {
        const result = await res.json();
        bookmarked = result.bookmarked;
      }
    } finally {
      bookmarkLoading = false;
    }
  }

  const pageUrl = $derived(
    typeof window !== 'undefined' ? window.location.href : `https://ohmynic.co/blog/${data.article.slug}`
  );

  const description = $derived(
    data.article.excerpt?.trim() ||
    data.article.content.replace(/<[^>]*>/g, '').slice(0, 160)
  );

  const jsonLd = $derived(JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: data.article.title,
    description,
    url: `https://ohmynic.co/blog/${data.article.slug}`,
    datePublished: data.article.publishedAt ? new Date(data.article.publishedAt).toISOString() : undefined,
    author: { '@type': 'Person', name: 'Nic' },
  }));

  function formatDate(d: Date | string | null) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  }
</script>

<ReadingProgress />

<svelte:head>
  <title>{data.article.title} — OhMyNic!</title>
  <meta name="description" content={description} />
  {#if data.isPreview}
    <meta name="robots" content="noindex" />
  {:else}
    <link rel="canonical" href="https://ohmynic.co/blog/{data.article.slug}" />
  {/if}

  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="OhMyNic!" />
  <meta property="og:title" content={data.article.title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content="https://ohmynic.co/blog/{data.article.slug}" />
  <meta property="og:image" content={data.article.coverImage ?? `https://ohmynic.co/blog/api/og/${data.article.slug}`} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  {#if data.article.publishedAt}
    <meta property="article:published_time" content={new Date(data.article.publishedAt).toISOString()} />
  {/if}

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={data.article.title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={data.article.coverImage ?? `https://ohmynic.co/blog/api/og/${data.article.slug}`} />

  <!-- JSON-LD -->
  {@html `<script type="application/ld+json">${jsonLd}</script>`}
</svelte:head>

<article class="article-wrap" class:is-page={data.article.type === 'page'}>
  <div class="article-header">
    {#if data.article.type !== 'page' && data.tags.length > 0}
      <div class="article-tags">
        {#each data.tags as tag}
          <a href="{base}/tag/{tag.slug}" class="tag">{tag.name}</a>
        {/each}
      </div>
    {/if}

    <h1 class="article-title">{data.article.title}</h1>

    {#if data.article.type !== 'page'}
      <div class="article-meta">
        {#if data.author}
          <a href="{base}/author/{data.author.username}" class="byline">
            {#if data.author.avatarUrl}
              <img src={data.author.avatarUrl} alt={data.author.displayName ?? data.author.username} class="byline-avatar" />
            {/if}
            <span class="byline-name">{data.author.displayName ?? data.author.username}</span>
          </a>
          <span class="meta-sep">·</span>
        {/if}
        <time datetime={String(data.article.publishedAt)}>
          {formatDate(data.article.publishedAt)}
        </time>
        {#if data.article.readingTimeMinutes}
          <span class="meta-sep">·</span>
          <span class="read-time">{data.article.readingTimeMinutes} min</span>
        {/if}
      </div>
    {/if}
  </div>

  {#if data.article.coverImage && data.article.showCoverInArticle !== false}
    <img src={data.article.coverImage} alt={data.article.title} class="article-cover" />
  {/if}

  <div class="prose" bind:this={proseEl}>
    {@html data.article.content}
  </div>

  {#if data.article.type !== 'page'}
    <footer class="article-footer">
      <div class="footer-actions">
        <ShareButtons url={pageUrl} title={data.article.title} />
        <button
          class="bookmark-btn"
          class:bookmarked
          onclick={toggleBookmark}
          disabled={bookmarkLoading}
          title={bookmarked ? 'Rimuovi dai salvati' : 'Salva articolo'}
        >
          {#if bookmarked}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3a2 2 0 0 0-2 2v16l9-4 9 4V5a2 2 0 0 0-2-2H5z"/></svg>
            Salvato
          {:else}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 3a2 2 0 0 0-2 2v16l9-4 9 4V5a2 2 0 0 0-2-2H5z"/></svg>
            Salva
          {/if}
        </button>
      </div>
      {#if data.tags.length > 0}
        <div class="footer-tags">
          <TagList tags={data.tags} />
        </div>
      {/if}
    </footer>
  {/if}
</article>

{#if data.article.type !== 'page' && data.related.length > 0}
  <section class="related-wrap">
    <h2 class="related-title">Potrebbe interessarti</h2>
    <div class="related-grid">
      {#each data.related as item}
        <ArticleCard article={item.article} tags={item.tags} />
      {/each}
    </div>
  </section>
{/if}

{#if data.article.type !== 'page' || data.article.showComments}
  <div class="comments-wrap">
    <CommentList comments={data.comments} />
    <CommentForm articleId={data.article.id} reader={data.reader ?? null} />
  </div>
{/if}

<style>
  .article-wrap {
    max-width: var(--max-width-prose);
    margin: 0 auto;
    padding: var(--space-12) var(--space-8);
  }

  .article-header { margin-bottom: var(--space-8); }

  .article-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-bottom: var(--space-5);
  }
  .tag {
    display: inline-block;
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    letter-spacing: var(--tracking-wider);
    text-transform: uppercase;
    color: var(--color-viola);
    background: var(--color-iris);
    border-radius: var(--radius-sm);
    padding: 2px 8px;
    text-decoration: none;
    border-bottom: none;
    transition: background var(--transition-fast);
  }
  .tag:hover { background: var(--color-bordo); }

  .article-title {
    font-family: var(--font-serif);
    font-size: var(--text-4xl);
    font-weight: var(--weight-semibold);
    line-height: var(--leading-tight);
    color: var(--color-notte);
    letter-spacing: var(--tracking-tight);
    margin-bottom: var(--space-4);
  }

  .article-meta {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    color: var(--color-lilla);
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;
  }
  .byline {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--color-lilla);
    text-decoration: none;
    border: none;
    transition: color var(--transition-fast);
  }
  .byline:hover { color: var(--color-viola); }
  .byline-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }
  .byline-name { font-weight: var(--weight-medium); }
  .meta-sep { opacity: 0.5; }

  .article-cover {
    width: 100%;
    max-height: 480px;
    object-fit: cover;
    border-radius: var(--radius-lg);
    margin-bottom: var(--space-10);
  }

  /* Prose — contenuto HTML da TipTap */
  .prose {
    font-family: var(--font-sans);
    font-size: var(--text-base);
    line-height: var(--leading-relaxed);
    color: var(--color-prugna);
    margin-bottom: var(--space-12);
  }
  :global(.prose p) { margin-bottom: var(--space-2); }
  :global(.prose h2) {
    font-family: var(--font-serif);
    font-size: var(--text-2xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    letter-spacing: var(--tracking-tight);
    margin: var(--space-16) 0 var(--space-10);
  }
  :global(.prose h3) {
    font-family: var(--font-serif);
    font-size: var(--text-xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    margin: var(--space-12) 0 var(--space-5);
  }
  :global(.prose blockquote) {
    border-left: 3px solid var(--color-lavanda);
    padding-left: var(--space-5);
    margin: var(--space-6) 0;
    color: var(--color-grafite);
    font-style: italic;
    font-size: var(--text-lg);
  }
  :global(.prose a) {
    color: var(--color-viola);
    border-bottom: 1px solid var(--color-bordo);
    transition: color var(--transition-fast), border-color var(--transition-fast);
  }
  :global(.prose a:hover) {
    color: var(--color-lavanda);
    border-bottom-color: var(--color-lavanda);
  }
  :global(.prose code) {
    background: var(--color-iris);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    font-size: 0.9em;
  }
  :global(.prose pre) {
    background: var(--color-notte);
    color: var(--color-nebbia);
    padding: var(--space-5);
    border-radius: var(--radius-md);
    overflow-x: auto;
    margin: var(--space-6) 0;
  }
  :global(.prose pre code) { background: transparent; padding: 0; color: inherit; }
  :global(.prose ul, .prose ol) { padding-left: var(--space-6); margin: var(--space-4) 0; }
  :global(.prose li) { margin-bottom: var(--space-2); }
  :global(.prose img) {
    max-width: 100%;
    border-radius: var(--radius-md);
    margin: var(--space-6) 0;
  }
  :global(.prose hr) {
    border: none;
    border-top: 0.5px solid var(--color-bordo);
    margin: var(--space-10) 0;
  }

  /* ── Footnotes ─────────────────────────────────────────────────────────── */
  :global(.prose sup.footnote a) {
    color: #7c55d4;
    text-decoration: none;
    font-size: 0.75em;
    vertical-align: super;
    font-family: var(--font-sans);
    font-weight: 500;
    padding: 0 1px;
  }
  :global(.prose sup.footnote a:hover) {
    color: #9b6ff0;
  }
  :global(.prose .footnote-divider) {
    border: none;
    border-top: 0.5px solid #d8d0f0;
    margin: 3rem 0 1.5rem;
  }
  :global(.prose .footnote-heading) {
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #8e82b0;
    margin: 0 0 1rem;
  }
  :global(.prose .footnotes) {
    list-style: none;
    padding: 0;
    margin: 0;
    counter-reset: footnote-counter;
  }
  :global(.prose .footnotes li) {
    font-size: 13px;
    line-height: 1.6;
    color: #6b5f8a;
    padding: 4px 0 4px 1.5rem;
    position: relative;
    margin-bottom: 4px;
  }
  :global(.prose .footnotes li::before) {
    content: "[" counter(footnote-counter) "]";
    counter-increment: footnote-counter;
    position: absolute;
    left: 0;
    color: #7c55d4;
    font-size: 12px;
    font-weight: 500;
  }
  :global(.prose .footnote-backref) {
    color: #9b6ff0;
    text-decoration: none;
    margin-left: 6px;
    font-size: 12px;
    border-bottom: none !important;
  }
  :global(.prose .footnote-backref:hover) {
    color: #7c55d4;
    border-bottom: none !important;
  }

  .article-footer {
    padding-top: var(--space-8);
    border-top: 0.5px solid var(--color-bordo);
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }
  .footer-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    flex-wrap: wrap;
  }
  .bookmark-btn {
    display: inline-flex; align-items: center; gap: var(--space-2);
    font-family: var(--font-sans); font-size: var(--text-sm); font-weight: var(--weight-medium);
    color: var(--color-lilla); background: none;
    border: 0.5px solid var(--color-bordo); border-radius: var(--radius-md);
    padding: 7px 14px; cursor: pointer; transition: color var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast);
  }
  .bookmark-btn:hover:not(:disabled) { color: var(--color-viola); border-color: var(--color-lavanda); }
  .bookmark-btn.bookmarked { color: var(--color-viola); border-color: var(--color-lavanda); background: var(--color-iris); }
  .bookmark-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .footer-tags { margin-top: var(--space-2); }

  .related-wrap {
    max-width: var(--max-width-wide);
    margin: 0 auto;
    padding: var(--space-12) var(--space-8);
    border-top: 0.5px solid var(--color-bordo);
  }

  .related-title {
    font-family: var(--font-serif);
    font-size: var(--text-xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    margin-bottom: var(--space-6);
  }

  .related-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-6);
  }
  @media (max-width: 1024px) {
    .related-grid { grid-template-columns: repeat(2, 1fr); }
    .related-wrap { padding: var(--space-10) var(--space-6); }
  }

  @media (max-width: 640px) {
    :global(.prose h2) { font-size: 20px; margin: var(--space-10) 0 var(--space-6); }
    :global(.prose h3) { font-size: var(--text-base); margin: var(--space-8) 0 var(--space-4); }
  }

  .comments-wrap {
    max-width: var(--max-width-prose);
    margin: 0 auto;
    padding: var(--space-10) var(--space-8) var(--space-16);
  }

  @media (max-width: 860px) {
    .related-grid { grid-template-columns: 1fr 1fr; }
  }

  @media (max-width: 640px) {
    .article-wrap, .comments-wrap { padding: var(--space-6) var(--space-4); }
    .article-title { font-size: 28px; }
    .related-wrap { padding: var(--space-8) var(--space-4); }
    .related-grid { grid-template-columns: 1fr; }
    /* Byline stack verticale */
    .article-meta { flex-direction: column; align-items: flex-start; gap: var(--space-1); }
    .meta-sep { display: none; }
    .byline { gap: var(--space-2); }
  }
</style>
