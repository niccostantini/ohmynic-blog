<script lang="ts">
  import { base } from '$app/paths';
  import { getCountryName } from '$lib/i18n/countries';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const p = $derived(data.profile);

  function formatDate(d: Date | string) {
    return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  function ensureHttps(url: string | null | undefined): string | null {
    if (!url) return null;
    return url.startsWith('http') ? url : `https://${url}`;
  }

  const location = $derived(
    [p.city, getCountryName(p.country)].filter(Boolean).join(', ') || null
  );

  const linkedinUrl = $derived(
    p.linkedin
      ? (p.linkedin.startsWith('http') ? p.linkedin : `https://linkedin.com/in/${p.linkedin}`)
      : null
  );
</script>

<svelte:head>
  <title>{p.displayName} — OhMyNic!</title>
  <meta name="robots" content="noindex" />
  <link rel="stylesheet" href="{base}/fonts/tabler-icons.css" media="print" onload={(e) => { (e.target as HTMLLinkElement).media = 'all'; }}>
</svelte:head>

<div class="page-wrap">
  <a href="{base}/" class="back-link">← Torna alla home</a>

  <header class="reader-header">
    <div class="reader-avatar">{p.displayName.charAt(0).toUpperCase()}</div>
    <div class="reader-info">
      <h1 class="reader-name">{p.displayName}</h1>

      {#if location}
        <p class="reader-location">
          <i class="ti ti-map-pin"></i> {location}
        </p>
      {/if}

      <div class="reader-social">
        {#if p.website}
          <a href={ensureHttps(p.website)} target="_blank" rel="noopener noreferrer" class="social-link" title="Sito web">
            <i class="ti ti-world"></i> {p.website.replace(/^https?:\/\//, '')}
          </a>
        {/if}
        {#if p.twitter}
          <a href="https://twitter.com/{p.twitter}" target="_blank" rel="noopener noreferrer" class="social-link" title="Twitter/X">
            <i class="ti ti-brand-twitter"></i> @{p.twitter}
          </a>
        {/if}
        {#if linkedinUrl}
          <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" class="social-link" title="LinkedIn">
            <i class="ti ti-brand-linkedin"></i> LinkedIn
          </a>
        {/if}
        {#if p.instagram}
          <a href="https://instagram.com/{p.instagram}" target="_blank" rel="noopener noreferrer" class="social-link" title="Instagram">
            <i class="ti ti-brand-instagram"></i> @{p.instagram}
          </a>
        {/if}
      </div>

      <p class="reader-since">Lettore dal {formatDate(p.createdAt)}</p>
    </div>
  </header>

  {#if p.comments.length > 0}
    <section class="comments-section">
      <h2 class="section-title">Commenti di {p.displayName}</h2>
      <ul class="comment-list">
        {#each p.comments as comment}
          <li class="comment-item">
            <div class="comment-meta">
              <a href="{base}/{comment.articleSlug}" class="comment-article">{comment.articleTitle}</a>
              <time class="comment-date">{formatDate(comment.createdAt)}</time>
            </div>
            <p class="comment-content">{comment.content}</p>
          </li>
        {/each}
      </ul>
    </section>
  {/if}
</div>

<style>
  .page-wrap {
    max-width: 680px;
    margin: 0 auto;
    padding: var(--space-12) var(--space-8);
  }

  .back-link {
    display: inline-block;
    font-size: var(--text-sm);
    color: var(--color-lilla);
    text-decoration: none;
    margin-bottom: var(--space-8);
    transition: color var(--transition-fast);
  }
  .back-link:hover { color: var(--color-notte); }

  /* ── Header ── */
  .reader-header {
    display: flex;
    align-items: flex-start;
    gap: var(--space-5);
    margin-bottom: var(--space-10);
    padding-bottom: var(--space-8);
    border-bottom: 0.5px solid var(--color-bordo);
  }
  .reader-avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: var(--color-lavanda);
    color: white;
    font-family: var(--font-serif);
    font-size: var(--text-2xl);
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .reader-info { flex: 1; }
  .reader-name {
    font-family: var(--font-serif);
    font-size: var(--text-2xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    letter-spacing: var(--tracking-tight);
    margin-bottom: var(--space-2);
  }
  .reader-location {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    color: var(--color-lilla);
    margin-bottom: var(--space-2);
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .reader-social {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    margin-bottom: var(--space-3);
  }
  .social-link {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    color: var(--color-lilla);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: color var(--transition-fast);
  }
  .social-link:hover { color: var(--color-viola); }
  .reader-since {
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    color: var(--color-bordo);
    margin-top: var(--space-2);
  }

  /* ── Comments ── */
  .comments-section { }
  .section-title {
    font-family: var(--font-serif);
    font-size: var(--text-xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    margin-bottom: var(--space-5);
  }
  .comment-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: var(--space-4); }
  .comment-item {
    padding: var(--space-4);
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-lg);
    background: white;
  }
  .comment-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-2);
    gap: var(--space-3);
    flex-wrap: wrap;
  }
  .comment-article {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-viola);
    text-decoration: none;
  }
  .comment-article:hover { color: var(--color-lavanda); }
  .comment-date {
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    color: var(--color-lilla);
    white-space: nowrap;
  }
  .comment-content {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    color: var(--color-prugna);
    line-height: var(--leading-relaxed);
    margin: 0;
    white-space: pre-wrap;
  }

  @media (max-width: 640px) {
    .page-wrap { padding: var(--space-8) var(--space-4); }
    .reader-header { flex-direction: column; align-items: center; text-align: center; }
    .reader-location, .reader-social { justify-content: center; }
  }
</style>
