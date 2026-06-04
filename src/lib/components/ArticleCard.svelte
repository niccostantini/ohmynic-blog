<script lang="ts">
  type Tag = { id: string; name: string; slug: string };
  type Article = {
    id: string; title: string; slug: string; excerpt: string | null;
    coverImage: string | null; publishedAt: Date | string | null; createdAt: Date | string;
  };

  let { article, tags = [] }: { article: Article; tags: Tag[] } = $props();

  function formatDate(d: Date | string | null) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  }
</script>

<div class="card">
  {#if article.coverImage}
    <a href="/{article.slug}" class="card-image-link" tabindex="-1" aria-hidden="true">
      <img src={article.coverImage} alt={article.title} class="card-cover" />
    </a>
  {/if}
  <div class="card-body">
    {#if tags.length > 0}
      <div class="card-tags">
        {#each tags as tag}
          <a href="/tag/{tag.slug}" class="tag">{tag.name}</a>
        {/each}
      </div>
    {/if}
    <h2 class="card-title">
      <a href="/{article.slug}" class="card-title-link">{article.title}</a>
    </h2>
    {#if article.excerpt}
      <p class="card-excerpt">{article.excerpt}</p>
    {/if}
    <span class="card-date">{formatDate(article.publishedAt ?? article.createdAt)}</span>
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
    height: 200px;
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
    font-size: var(--text-xl);
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
    font-size: var(--text-base);
    line-height: var(--leading-relaxed);
    color: var(--color-grafite);
    margin-bottom: var(--space-4);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .card-date {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    color: var(--color-lilla);
  }
</style>
