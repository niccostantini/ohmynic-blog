<script lang="ts">
  import { base } from '$app/paths';
  import ArticleCard from '$lib/components/ArticleCard.svelte';
  import CommentForm from '$lib/components/CommentForm.svelte';
  import CommentList from '$lib/components/CommentList.svelte';
  import ShareButtons from '$lib/components/ShareButtons.svelte';
  import TagList from '$lib/components/TagList.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

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

<svelte:head>
  <title>{data.article.title} — OhMyNic!</title>
  <meta name="description" content={description} />
  <link rel="canonical" href="https://ohmynic.co/blog/{data.article.slug}" />

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

<article class="article-wrap">
  <div class="article-header">
    {#if data.tags.length > 0}
      <div class="article-tags">
        {#each data.tags as tag}
          <a href="{base}/tag/{tag.slug}" class="tag">{tag.name}</a>
        {/each}
      </div>
    {/if}

    <h1 class="article-title">{data.article.title}</h1>

    <div class="article-meta">
      <time datetime={String(data.article.publishedAt)}>
        {formatDate(data.article.publishedAt)}
      </time>
    </div>
  </div>

  {#if data.article.coverImage}
    <img src={data.article.coverImage} alt={data.article.title} class="article-cover" />
  {/if}

  <div class="prose">
    {@html data.article.content}
  </div>

  <footer class="article-footer">
    <ShareButtons url={pageUrl} title={data.article.title} />
    {#if data.tags.length > 0}
      <div class="footer-tags">
        <TagList tags={data.tags} />
      </div>
    {/if}
  </footer>
</article>

{#if data.related.length > 0}
  <section class="related-wrap">
    <h2 class="related-title">Potrebbe interessarti</h2>
    <div class="related-grid">
      {#each data.related as item}
        <ArticleCard article={item.article} tags={item.tags} />
      {/each}
    </div>
  </section>
{/if}

<div class="comments-wrap">
  <CommentList comments={data.comments} />
  <CommentForm articleId={data.article.id} />
</div>

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
  }

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
  :global(.prose p) { margin-bottom: var(--space-5); }
  :global(.prose h2) {
    font-family: var(--font-serif);
    font-size: var(--text-2xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    letter-spacing: var(--tracking-tight);
    margin: var(--space-10) 0 var(--space-4);
  }
  :global(.prose h3) {
    font-family: var(--font-serif);
    font-size: var(--text-xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    margin: var(--space-8) 0 var(--space-3);
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

  /* ── toggle (BlockNote toggleListItem → <li><details><summary><p>…) ── */
  /* rimuovi bullet dall'<li> che wrappa il toggle */
  :global(.prose li:has(> details)) {
    list-style: none;
    padding-left: 0;
  }
  :global(.prose ul:has(> li > details)) {
    padding-left: 0;
  }
  /* summary: flex per affiancare icona e testo sulla stessa riga */
  :global(.prose details summary) {
    display: flex;
    align-items: center;
    gap: 0.5em;
    cursor: pointer;
    padding: var(--space-1) 0;
    color: var(--color-notte);
    font-weight: var(--weight-medium);
    user-select: none;
  }
  /* nascondi il marker di default (▶ browser) */
  :global(.prose details summary::-webkit-details-marker) { display: none; }
  :global(.prose details summary::marker) { content: none; }
  /* icona personalizzata: ▶ che ruota a ▼ quando aperto */
  :global(.prose details summary::before) {
    content: '▶';
    font-size: 0.65em;
    flex-shrink: 0;
    color: var(--color-viola);
    transition: transform 0.15s ease;
  }
  :global(.prose details[open] summary::before) {
    transform: rotate(90deg);
  }
  /* <p> dentro <summary> non deve essere block */
  :global(.prose details summary p) {
    display: inline;
    margin: 0;
  }
  /* contenuto interno del toggle */
  :global(.prose details > :not(summary)) {
    padding-left: var(--space-5);
    margin-top: var(--space-2);
  }

  .article-footer {
    padding-top: var(--space-8);
    border-top: 0.5px solid var(--color-bordo);
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

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

  .comments-wrap {
    max-width: var(--max-width-prose);
    margin: 0 auto;
    padding: var(--space-10) var(--space-8) var(--space-16);
  }

  @media (max-width: 860px) {
    .related-grid { grid-template-columns: 1fr 1fr; }
  }

  @media (max-width: 640px) {
    .article-wrap, .comments-wrap { padding: var(--space-8) var(--space-4); }
    .article-title { font-size: var(--text-3xl); }
    .related-wrap { padding: var(--space-8) var(--space-4); }
    .related-grid { grid-template-columns: 1fr; }
  }
</style>
