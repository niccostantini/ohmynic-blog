<script lang="ts">
  import { base } from '$app/paths';

  type Comment = {
    id: string;
    authorName: string | null;
    content: string;
    replyText?: string | null;
    createdAt: Date | string;
    readerId?: string | null;
    readerCountry?: string | null;
    readerCity?: string | null;
    readerWebsite?: string | null;
    readerTwitter?: string | null;
    readerLinkedin?: string | null;
    readerInstagram?: string | null;
  };
  let { comments }: { comments: Comment[] } = $props();

  function location(c: Comment): string | null {
    const parts = [c.readerCity, c.readerCountry].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  }

  function ensureHttps(url: string | null | undefined): string | null {
    if (!url) return null;
    return url.startsWith('http') ? url : `https://${url}`;
  }

  function formatDate(d: Date | string) {
    return new Date(d).toLocaleDateString('it-IT', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  }
</script>

{#if comments.length > 0}
  <div class="comment-list">
    <h3>{comments.length} commento{comments.length !== 1 ? 'i' : ''}</h3>
    {#each comments as comment}
      <div class="thread">
        <!-- commento utente -->
        <div class="bubble user-bubble">
          <div class="bubble-meta">
            {#if comment.authorName}
              {#if comment.readerId}
                <a href="{base}/lettore/{comment.readerId}" class="author author-link">{comment.authorName}</a>
              {:else}
                <span class="author">{comment.authorName}</span>
              {/if}
            {/if}
            <span class="date">{formatDate(comment.createdAt)}</span>
          </div>
          {#if location(comment) || comment.readerWebsite || comment.readerTwitter || comment.readerLinkedin || comment.readerInstagram}
            <div class="reader-profile">
              {#if location(comment)}
                <span class="reader-location">{location(comment)}</span>
              {/if}
              <div class="reader-social">
                {#if comment.readerWebsite}
                  <a href={ensureHttps(comment.readerWebsite)} target="_blank" rel="noopener noreferrer" class="social-link" title="Sito web">
                    <i class="ti ti-world"></i>
                  </a>
                {/if}
                {#if comment.readerTwitter}
                  <a href="https://twitter.com/{comment.readerTwitter}" target="_blank" rel="noopener noreferrer" class="social-link" title="Twitter/X">
                    <i class="ti ti-brand-twitter"></i>
                  </a>
                {/if}
                {#if comment.readerLinkedin}
                  {@const liUrl = comment.readerLinkedin.startsWith('http') ? comment.readerLinkedin : `https://linkedin.com/in/${comment.readerLinkedin}`}
                  <a href={liUrl} target="_blank" rel="noopener noreferrer" class="social-link" title="LinkedIn">
                    <i class="ti ti-brand-linkedin"></i>
                  </a>
                {/if}
                {#if comment.readerInstagram}
                  <a href="https://instagram.com/{comment.readerInstagram}" target="_blank" rel="noopener noreferrer" class="social-link" title="Instagram">
                    <i class="ti ti-brand-instagram"></i>
                  </a>
                {/if}
              </div>
            </div>
          {/if}
          <p class="bubble-text">{comment.content}</p>
        </div>

        <!-- risposta admin -->
        {#if comment.replyText}
          <div class="bubble reply-bubble">
            <div class="bubble-meta">
              <span class="author reply-author">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2a5 5 0 1 1 0 10A5 5 0 0 1 12 2zm0 12c5.33 0 8 2.67 8 4v2H4v-2c0-1.33 2.67-4 8-4z"/>
                </svg>
                Nic
              </span>
            </div>
            <p class="bubble-text">{comment.replyText}</p>
          </div>
        {/if}
      </div>
    {/each}
  </div>
{/if}

<style>
  .comment-list { margin-bottom: var(--space-10); }

  h3 {
    font-family: var(--font-serif);
    font-size: var(--text-xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    margin-bottom: var(--space-6);
  }

  .thread {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin-bottom: var(--space-5);
  }

  .bubble {
    padding: var(--space-4) var(--space-5);
    border-radius: var(--radius-lg);
    max-width: 88%;
  }

  /* commento utente — sinistra */
  .user-bubble {
    align-self: flex-start;
    background: white;
    border: 0.5px solid var(--color-bordo);
    border-bottom-left-radius: var(--radius-sm);
  }

  /* risposta admin — destra, accent */
  .reply-bubble {
    align-self: flex-end;
    background: var(--color-iris);
    border: 0.5px solid var(--color-bordo);
    border-bottom-right-radius: var(--radius-sm);
  }

  .bubble-meta {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-2);
  }

  .author {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
  }
  .author-link {
    text-decoration: none;
    transition: color var(--transition-fast);
  }
  .author-link:hover { color: var(--color-viola); }

  .reply-author {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--color-viola);
  }

  .date {
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    color: var(--color-lilla);
    margin-left: auto;
  }

  .bubble-text {
    font-family: var(--font-sans);
    font-size: var(--text-base);
    line-height: var(--leading-relaxed);
    color: var(--color-prugna);
    white-space: pre-wrap;
    margin: 0;
  }

  .reader-profile {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: var(--space-2);
    flex-wrap: wrap;
  }
  .reader-location {
    font-family: var(--font-sans);
    font-size: 11px;
    color: var(--color-lilla);
  }
  .reader-social {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .social-link {
    font-size: 14px;
    color: var(--color-lilla);
    text-decoration: none;
    line-height: 1;
    transition: color var(--transition-fast);
  }
  .social-link:hover { color: var(--color-viola); }

  @media (max-width: 640px) {
    .bubble { max-width: 95%; }
  }
</style>
