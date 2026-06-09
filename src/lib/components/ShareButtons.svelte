<script lang="ts">
  let { url, title }: { url: string; title: string } = $props();

  let copied = $state(false);

  const twitterUrl = $derived(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
  );
  const linkedinUrl = $derived(
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
  );
  const emailUrl = $derived(
    `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`
  );

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }
</script>

<div class="share">
  <span class="share-label">Condividi</span>
  <div class="share-buttons">
    <a href={twitterUrl} target="_blank" rel="noopener" class="share-btn" title="Condividi su X/Twitter">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
      Twitter
    </a>
    <a href={linkedinUrl} target="_blank" rel="noopener" class="share-btn" title="Condividi su LinkedIn">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
      LinkedIn
    </a>
    <a href={emailUrl} class="share-btn" title="Condividi via email">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,12 2,6"/>
      </svg>
      Email
    </a>
    <button type="button" class="share-btn" onclick={copyLink} title="Copia link">
      {#if copied}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Copiato!
      {:else}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        Copia link
      {/if}
    </button>
  </div>
</div>

<style>
  .share {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    flex-wrap: wrap;
  }
  .share-label {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-lilla);
    letter-spacing: var(--tracking-wide);
  }
  .share-buttons {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }
  .share-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-prugna);
    background: white;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-md);
    padding: 6px 12px;
    cursor: pointer;
    text-decoration: none;
    border-bottom: none;
    transition: border-color var(--transition-fast), background var(--transition-fast), color var(--transition-fast);
  }
  .share-btn:hover {
    border-color: var(--color-lavanda);
    color: var(--color-viola);
    background: var(--color-iris);
  }

  @media (max-width: 640px) {
    .share { flex-direction: column; align-items: flex-start; gap: var(--space-3); }
    .share-buttons { display: grid; grid-template-columns: 1fr 1fr; width: 100%; }
    .share-btn { justify-content: center; padding: 10px; min-height: 44px; }
  }
</style>
