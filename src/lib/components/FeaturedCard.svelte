<script lang="ts">
  import { base } from '$app/paths';
  import ArticlePlaceholder from '$lib/components/ArticlePlaceholder.svelte';
  import { buildSrcset } from '$lib/utils/image';

  type Tag = { id: string; name: string; slug: string };
  type Article = {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    coverImage: string | null;
    coverImageFocus?: string | null;
    publishedAt: Date | string | null;
    type: string;
  };

  let {
    article,
    tags = [],
    variant = 'main',
    href,
    priority = false,
  }: {
    article: Article;
    tags?: Tag[];
    variant?: 'main' | 'side';
    href?: string;
    priority?: boolean;
  } = $props();

  function formatDate(d: Date | string | null) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  }
</script>

<a
  href={href ?? `${base}/${article.slug}`}
  class="featured-card"
  class:featured-main={variant === 'main'}
  class:featured-side={variant === 'side'}
>
  <div class="featured-cover-wrap">
    {#if article.coverImage}
      <img
        src={article.coverImage}
        alt={article.title}
        class="featured-cover"
        style={article.coverImageFocus ? `object-position: ${article.coverImageFocus}` : undefined}
        srcset={buildSrcset(article.coverImage) ?? undefined}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
        draggable="false"
        loading={priority ? 'eager' : 'lazy'}
        fetchpriority={priority ? 'high' : undefined}
        decoding="async"
      />
    {:else}
      <ArticlePlaceholder slug={article.slug} tagSlug={tags[0]?.slug ?? 'default'} />
    {/if}
  </div>
  <div class="featured-body">
    <div class="featured-meta-top">
      <span class="featured-badge"><i class="ti ti-star"></i> In evidenza</span>
      {#if article.type === 'page'}
        <span class="type-badge">Pagina</span>
      {:else if tags.some(t => t.name)}
        <div class="featured-tags">
          {#each tags.filter(t => t.name).slice(0, 2) as tag}
            <span class="featured-tag">{tag.name}</span>
          {/each}
        </div>
      {/if}
    </div>
    <h3 class="featured-title">{article.title}</h3>
    {#if article.excerpt}
      <p class="featured-excerpt">{article.excerpt}</p>
    {/if}
    {#if article.type !== 'page' && article.publishedAt}
      <span class="featured-date">{formatDate(article.publishedAt)}</span>
    {/if}
  </div>
</a>

<style>
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

  .featured-cover-wrap { flex-shrink: 0; overflow: hidden; }
  .featured-main .featured-cover { height: 220px; aspect-ratio: 16 / 9; }
  .featured-side .featured-cover { height: 140px; aspect-ratio: 16 / 9; }
  .featured-cover {
    width: 100%;
    object-fit: cover;
    display: block;
  }
  /* Placeholder: stessa altezza dell'immagine di copertina */
  .featured-main .featured-cover-wrap :global(.card-placeholder) { height: 220px; }
  .featured-side .featured-cover-wrap :global(.card-placeholder) { height: 140px; }

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

  .featured-tags { display: flex; gap: var(--space-1); }
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

  @media (max-width: 640px) {
    .featured-main .featured-cover,
    .featured-side .featured-cover { height: 180px; }
    .featured-main .featured-cover-wrap :global(.card-placeholder),
    .featured-side .featured-cover-wrap :global(.card-placeholder) { height: 180px; }
    .featured-main .featured-title,
    .featured-side .featured-title { font-size: var(--text-xl); }
    .featured-side .featured-excerpt { -webkit-line-clamp: 3; line-clamp: 3; }
  }
</style>
