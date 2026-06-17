<script lang="ts">
  import { base } from '$app/paths';
  import { buildSrcset } from '$lib/utils/image';

  type Article = {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    coverImage: string | null;
    coverImageFocus?: string | null;
  };

  let {
    cardType,
    url,
    position,
    showImage = true,
    article,
    extTitle,
    extDescription,
    extImage,
    extSiteName,
  }: {
    cardType: string;
    url: string;
    position: string;
    showImage?: boolean;
    article?: Article | null;
    extTitle?: string;
    extDescription?: string;
    extImage?: string;
    extSiteName?: string;
  } = $props();
</script>

{#if cardType === 'internal' && article}
  <div class="ace-wrap ace-{position}">
    <a href="{base}/{article.slug}" class="ace ace--internal">
      {#if showImage && article.coverImage}
        <img
          src={article.coverImage}
          alt={article.title}
          class="ace-image"
          style={article.coverImageFocus ? `object-position: ${article.coverImageFocus}` : undefined}
          srcset={buildSrcset(article.coverImage) ?? undefined}
          sizes="(max-width: 640px) 100vw, 460px"
          loading="lazy"
          decoding="async"
        />
      {/if}
      <div class="ace-body">
        <div class="ace-label">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M13 7l5 5-5 5M6 12h12"/>
          </svg>
          Articolo correlato
        </div>
        <h3 class="ace-title">{article.title}</h3>
        {#if article.excerpt}
          <p class="ace-excerpt">{article.excerpt}</p>
        {/if}
      </div>
    </a>
  </div>
{:else if cardType === 'external' && url}
  <div class="ace-wrap ace-{position}">
    <a href={url} target="_blank" rel="noopener noreferrer" class="ace ace--external">
      {#if showImage && extImage}
        <img src={extImage} alt={extTitle || ''} class="ace-image" loading="lazy" decoding="async" />
      {/if}
      <div class="ace-body">
        {#if extSiteName}
          <div class="ace-sitename">{extSiteName}</div>
        {/if}
        <div class="ace-label ace-label--external">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-6m-7 1l9-9m-5 0h5v5"/>
          </svg>
          Link esterno
        </div>
        <h3 class="ace-title">{extTitle || url}</h3>
        {#if extDescription}
          <p class="ace-excerpt">{extDescription}</p>
        {/if}
      </div>
    </a>
  </div>
{/if}

<style>
  .ace-wrap {
    margin: 1.5rem 0;
    clear: both;
  }
  .ace-wrap.ace-left  { float: left;  width: 42%; margin: 0.25rem 1.5rem 1rem 0; clear: left; }
  .ace-wrap.ace-right { float: right; width: 42%; margin: 0.25rem 0 1rem 1.5rem; clear: right; }
  .ace-wrap.ace-center { width: 70%; margin-left: auto; margin-right: auto; }
  .ace-wrap.ace-full   { width: 100%; }

  .ace {
    display: block;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-lg);
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    transition: box-shadow var(--transition-base), border-color var(--transition-base);
    background: white;
  }
  .ace:hover {
    border-color: var(--color-lavanda);
    box-shadow: var(--shadow-md);
  }

  .ace-image {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    display: block;
    background: var(--color-iris);
    margin: 0;         /* override .prose img margin */
    border-radius: 0;  /* card border-radius handles corners via overflow:hidden */
  }

  .ace-body {
    padding: var(--space-4) var(--space-5);
  }

  .ace-label {
    display: inline-flex;
    align-items: center;
    gap: 0.3em;
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    letter-spacing: var(--tracking-wider);
    text-transform: uppercase;
    color: var(--color-viola);
    margin-bottom: var(--space-2);
  }
  .ace-label--external {
    color: var(--color-lilla);
  }

  .ace-sitename {
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    color: var(--color-lilla);
    letter-spacing: var(--tracking-wider);
    text-transform: uppercase;
    margin-bottom: var(--space-1);
  }

  .ace-title {
    font-family: var(--font-serif);
    font-size: 17px;
    font-weight: var(--weight-semibold);
    line-height: var(--leading-snug);
    color: var(--color-notte);
    letter-spacing: var(--tracking-tight);
    margin-bottom: var(--space-2);
    margin-top: 0;
  }

  .ace-excerpt {
    font-family: var(--font-sans);
    font-size: 12px;
    line-height: var(--leading-relaxed);
    color: var(--color-grafite);
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  @media (max-width: 640px) {
    .ace-wrap.ace-left,
    .ace-wrap.ace-right {
      float: none;
      width: 100%;
      margin: 1.5rem 0;
    }
    .ace-wrap.ace-center { width: 100%; }
  }

  /* ── Dark mode ─────────────────────────────────────────────────────────────── */
  :global([data-theme='dark']) .ace {
    background: var(--color-notte, #1a1330);
    border-color: #2e2050;
  }
  :global([data-theme='dark']) .ace:hover {
    border-color: var(--color-lavanda);
  }
  :global([data-theme='dark']) .ace-title {
    color: #f0ecff;
  }
  :global([data-theme='dark']) .ace-excerpt {
    color: #9e93c0;
  }
</style>
