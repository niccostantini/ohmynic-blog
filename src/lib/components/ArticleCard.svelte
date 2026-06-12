<script lang="ts">
  import { base } from '$app/paths';
  import ArticlePlaceholder from '$lib/components/ArticlePlaceholder.svelte';

  type Tag = { id: string; name: string; slug: string };
  type Article = {
    id: string; title: string; slug: string; excerpt: string | null;
    coverImage: string | null; coverImageFocus?: string | null;
    publishedAt: Date | string | null; createdAt: Date | string;
    readingTimeMinutes?: number | null;
  };

  let { article, tags = [], getTagHref }: {
    article: Article;
    tags: Tag[];
    getTagHref?: (slug: string) => string;
  } = $props();

  function formatDate(d: Date | string | null) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  }
</script>

<div class="card">
  <a href="{base}/{article.slug}" class="card-image-link" tabindex="-1" aria-hidden="true">
    {#if article.coverImage}
      <img
        src={article.coverImage}
        alt={article.title}
        class="card-cover"
        style={article.coverImageFocus ? `object-position: ${article.coverImageFocus}` : undefined}
      />
    {:else}
      <ArticlePlaceholder slug={article.slug} tagSlug={tags[0]?.slug ?? 'default'} />
    {/if}
  </a>
  <div class="card-body">
    {#if tags.some(t => t.name)}
      <div class="card-tags">
        {#each tags.filter(t => t.name) as tag}
          <a href={getTagHref ? getTagHref(tag.slug) : `${base}/tag/${tag.slug}`} class="tag">{tag.name}</a>
        {/each}
      </div>
    {/if}
    <h2 class="card-title">
      <a href="{base}/{article.slug}" class="card-title-link">{article.title}</a>
    </h2>
    {#if article.excerpt}
      <p class="card-excerpt">{article.excerpt}</p>
    {/if}
    <div class="card-footer">
      <span class="card-date">{formatDate(article.publishedAt ?? article.createdAt)}</span>
      {#if article.readingTimeMinutes}
        <span class="card-reading-time">{article.readingTimeMinutes} min</span>
      {/if}
    </div>
  </div>
</div>

<style>
  .card {
    display: block;
    background: white;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition: box-shadow var(--transition-base), border-color var(--transition-base);
  }
  .card:hover {
    border-color: var(--color-lavanda);
    box-shadow: var(--shadow-md);
  }
  .card-image-link {
    display: block;
    border: none;
  }
  .card-cover {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    display: block;
  }
  .card-body {
    padding: var(--space-5);
  }
  .card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
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
    border-bottom: none;
    transition: background var(--transition-fast);
  }
  .tag:hover { background: var(--color-bordo); }
  .card-title {
    font-family: var(--font-serif);
    font-size: 18px;
    font-weight: var(--weight-semibold);
    line-height: var(--leading-snug);
    color: var(--color-notte);
    letter-spacing: var(--tracking-tight);
    margin-bottom: var(--space-3);
  }
  .card-title-link {
    color: var(--color-notte);
    text-decoration: none;
    border: none;
    transition: color var(--transition-fast);
  }
  .card-title-link:hover { color: var(--color-lavanda); }
  .card-excerpt {
    font-family: var(--font-sans);
    font-size: 12px;
    line-height: var(--leading-relaxed);
    color: var(--color-grafite);
    margin-bottom: var(--space-4);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }
  .card-date {
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    color: var(--color-lilla);
  }
  .card-reading-time {
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    color: var(--color-lilla);
    flex-shrink: 0;
  }
</style>
