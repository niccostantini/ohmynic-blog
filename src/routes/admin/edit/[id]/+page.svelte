<script lang="ts">
  import { enhance } from '$app/forms';
  import { base } from '$app/paths';
  import { invalidate } from '$app/navigation';
  import Editor from '$lib/components/Editor.svelte';
  import { TRANSITION_CHECKLISTS } from '$lib/workflow/checklists';
  import { addToast } from '$lib/stores/toast';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  // ── Content editing ────────────────────────────────────────────────────────
  let title = $state(data.article.title);
  let content = $state(data.article.content);
  let excerpt = $state(data.article.excerpt ?? '');
  let coverImage = $state(data.article.coverImage ?? '');
  let showCoverInArticle = $state(data.article.showCoverInArticle ?? true);
  let tagInput = $state('');
  let selectedTags = $state<string[]>(data.articleTags.map((t) => t.name));

  let suggestions = $derived(
    tagInput.length > 0
      ? data.tags.filter(
          (t) =>
            t.name.toLowerCase().includes(tagInput.toLowerCase()) &&
            !selectedTags.includes(t.name)
        )
      : []
  );

  function addTag(name: string) {
    const trimmed = name.trim();
    if (trimmed && !selectedTags.includes(trimmed)) selectedTags = [...selectedTags, trimmed];
    tagInput = '';
  }
  function removeTag(name: string) {
    selectedTags = selectedTags.filter((t) => t !== name);
  }
  function handleTagKeydown(e: KeyboardEvent) {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput);
    }
  }

  // ── Reading time estimate ─────────────────────────────────────────────────
  const readingTimeEst = $derived(
    Math.max(1, Math.round(
      content.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length / 200
    ))
  );

  // ── Status ─────────────────────────────────────────────────────────────────
  const role = data.user.role;
  const canPublish = data.user.canPublish ?? false;
  const status = $derived(data.article.status);

  // What transitions are available to this user for the current status?
  const canSubmitForReview = $derived(
    status === 'draft' &&
    (role === 'admin' || role === 'editor' ||
     (role === 'contributor' && data.article.authorId === data.user.id))
  );
  const canApprove = $derived(
    status === 'review' && (role === 'editor' || role === 'admin')
  );
  const canPublishArticle = $derived(
    status === 'approved' &&
    (role === 'admin' || (role === 'editor' && canPublish))
  );
  const canReturnToDraft = $derived(
    (status === 'review' || status === 'approved') &&
    (role === 'editor' || role === 'admin')
  );
  const canUnpublish = $derived(
    status === 'published' &&
    (role === 'admin' || (role === 'editor' && canPublish))
  );

  // Contributor can't edit non-draft
  const isReadOnly = $derived(role === 'contributor' && status !== 'draft');

  // ── Status label helpers ───────────────────────────────────────────────────
  const STATUS_META: Record<string, { label: string; cls: string }> = {
    draft:     { label: 'Bozza',        cls: 'draft' },
    review:    { label: 'In revisione', cls: 'review' },
    approved:  { label: 'Approvato',    cls: 'approved' },
    published: { label: 'Pubblicato',   cls: 'published' },
  };

  // ── Transition dialog ──────────────────────────────────────────────────────
  let showTransitionDialog = $state(false);
  let dialogToStatus = $state('');
  let dialogNote = $state('');
  let dialogChecklist = $state<boolean[]>([]);
  let dialogPublishTitle = $state('');
  let dialogPublishExcerpt = $state('');
  let dialogPublishDatetime = $state('');

  const dialogConfig = $derived(
    dialogToStatus === 'draft' ? null : (TRANSITION_CHECKLISTS[`${status}→${dialogToStatus}`] ?? null)
  );
  const dialogAllChecked = $derived(!dialogConfig || dialogChecklist.every(Boolean));
  const dialogExcerptLen = $derived(dialogPublishExcerpt.length);
  const dialogCanSubmit = $derived(
    dialogAllChecked &&
    (dialogConfig ? true : !!dialogNote.trim()) &&
    (dialogToStatus === 'published'
      ? !!dialogPublishTitle.trim() && dialogExcerptLen > 0 && dialogExcerptLen <= 160
      : true)
  );
  const dialogIsScheduled = $derived(
    dialogToStatus === 'published' &&
    !!dialogPublishDatetime &&
    new Date(dialogPublishDatetime) > new Date()
  );

  function formatDatetimeLocal(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function openTransitionDialog(toStatus: string) {
    dialogToStatus = toStatus;
    dialogNote = '';
    const config = toStatus === 'draft' ? null : TRANSITION_CHECKLISTS[`${status}→${toStatus}`];
    dialogChecklist = config ? config.items.map(() => false) : [];
    if (toStatus === 'published') {
      dialogPublishTitle = data.article.title;
      dialogPublishExcerpt = data.article.excerpt ?? '';
      dialogPublishDatetime = formatDatetimeLocal(new Date());
    }
    showTransitionDialog = true;
  }
  function closeTransitionDialog() {
    showTransitionDialog = false;
  }

  // ── History collapse ───────────────────────────────────────────────────────
  let historyOpen = $state(false);

  function formatDate(d: Date | string | null) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('it-IT', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  const STATUS_LABELS: Record<string, string> = {
    draft: 'Bozza', review: 'In revisione', approved: 'Approvato', published: 'Pubblicato',
  };

  const STATUS_EMOJI: Record<string, string> = {
    draft: '📝', review: '🔄', approved: '✅', published: '🌐',
  };

  // ── Editorial comments ─────────────────────────────────────────────────────
  const userId = data.user.id;
  const canCreateComments = role === 'editor' || role === 'admin';

  type CommentFilter = 'all' | 'block' | 'free' | 'orphan';
  let commentFilter = $state<CommentFilter>('all');

  let showCommentForm = $state(false);
  let newCommentContent = $state('');
  let newCommentBlockId = $state<string | null>(null);
  let newCommentBlockSnapshot = $state<string | null>(null);
  let newCommentBlockType = $state<string | null>(null);
  let commentSubmitting = $state(false);
  let commentError = $state('');

  let replyingToId = $state<string | null>(null);
  let replyContent = $state('');
  let replySubmitting = $state(false);

  let highlightedCommentId = $state<string | null>(null);
  let getBlockMapFn: (() => Record<string, string>) | null = null;
  let getBlocksJsonFn: (() => string) | null = null;
  let getContentFn: (() => string) | null = null;

  const blockComments = $derived(
    Object.fromEntries(
      (data.editorialComments ?? [])
        .filter((c) => c.blockId && !c.blockOrphaned && !c.resolvedAt)
        .map((c) => [
          c.blockId!,
          { count: 1 + (c.replies?.length ?? 0), preview: c.content.slice(0, 40) },
        ])
    )
  );

  function openFreeCommentForm() {
    newCommentBlockId = null;
    newCommentBlockSnapshot = null;
    newCommentBlockType = null;
    newCommentContent = '';
    commentError = '';
    showCommentForm = true;
  }

  function openBlockCommentForm(blockId: string, blockType: string, snapshot: string) {
    newCommentBlockId = blockId;
    newCommentBlockSnapshot = snapshot;
    newCommentBlockType = blockType;
    newCommentContent = '';
    commentError = '';
    showCommentForm = true;
    // Scroll to panel
    document.getElementById('editorial-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleBlockIndicatorClick(blockId: string) {
    const comment = (data.editorialComments ?? []).find((c) => c.blockId === blockId);
    if (comment) {
      highlightedCommentId = comment.id;
      const el = document.getElementById(`ec-${comment.id}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => { highlightedCommentId = null; }, 2000);
    }
  }

  async function submitComment() {
    if (!newCommentContent.trim() || commentSubmitting) return;
    commentSubmitting = true;
    commentError = '';
    try {
      const res = await fetch(`${base}/api/articles/${data.article.id}/editorial-comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newCommentContent.trim(),
          blockId: newCommentBlockId,
          blockSnapshot: newCommentBlockSnapshot,
          blockType: newCommentBlockType,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        commentError = (err as any).message ?? 'Errore durante il salvataggio.';
        return;
      }
      newCommentContent = '';
      showCommentForm = false;
      await invalidate('app:editorial-comments');
    } catch {
      commentError = 'Errore di rete.';
    } finally {
      commentSubmitting = false;
    }
  }

  async function submitReply(parentId: string) {
    if (!replyContent.trim() || replySubmitting) return;
    replySubmitting = true;
    try {
      const res = await fetch(`${base}/api/editorial-comments/${parentId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent.trim() }),
      });
      if (res.ok) {
        replyContent = '';
        replyingToId = null;
        await invalidate('app:editorial-comments');
      }
    } finally {
      replySubmitting = false;
    }
  }

  async function resolveComment(id: string) {
    await fetch(`${base}/api/editorial-comments/${id}/resolve`, { method: 'PATCH' });
    await invalidate('app:editorial-comments');
  }

  async function deleteComment(id: string) {
    if (!confirm('Eliminare questo commento?')) return;
    await fetch(`${base}/api/editorial-comments/${id}`, { method: 'DELETE' });
    await invalidate('app:editorial-comments');
  }

  const filteredComments = $derived(
    (data.editorialComments ?? []).filter((c) => {
      if (commentFilter === 'block') return c.blockId !== null;
      if (commentFilter === 'free') return c.blockId === null && !c.workflowEvent;
      if (commentFilter === 'orphan') return c.blockOrphaned;
      return true;
    })
  );

  const openCommentsCount = $derived(
    (data.editorialComments ?? []).filter((c) => !c.resolvedAt && !c.parentId).length
  );

  const WORKFLOW_BADGE: Record<string, { label: string; bg: string; color: string }> = {
    sent_to_review: { label: 'Inviato in revisione', bg: '#ece7fa', color: '#3b2f5e' },
    approved:       { label: 'Approvato',            bg: '#e6f1fb', color: '#0c447c' },
    rejected:       { label: 'Rimandato in bozza',   bg: '#faeeda', color: '#854f0b' },
    published:      { label: 'Pubblicato',            bg: '#eaf3de', color: '#3b6d11' },
  };

  const WORKFLOW_BORDER: Record<string, string> = {
    sent_to_review: '#7c55d4',
    approved:       '#0c447c',
    rejected:       '#854f0b',
    published:      '#3b6d11',
  };

  // ── Toast notifications ────────────────────────────────────────────────────
  $effect(() => {
    if (form?.saved)       addToast('Modifiche salvate', 'success');
    if (form?.error)       addToast(form.error as string, 'error');
    if (form?.statusError) addToast(form.statusError as string, 'error');
    if (form?.published)   addToast('Articolo pubblicato', 'success');
  });
</script>

<svelte:head><title>Modifica — {data.article.title} — OhMyNic!</title></svelte:head>

<div class="editor-page">

  <!-- ── Header ──────────────────────────────────────────────────────────── -->
  <div class="editor-header">
    <div class="editor-header-left">
      <h1>Modifica articolo</h1>
      <span class="badge badge-{(STATUS_META[data.article.status] ?? STATUS_META['draft']).cls}">
        {(STATUS_META[data.article.status] ?? STATUS_META['draft']).label}
      </span>
    </div>
    <div class="header-actions">
      {#if data.article.previewToken}
        <a
          href="{base}/{data.article.slug}?preview={data.article.previewToken}"
          target="_blank"
          class="btn-ghost btn-preview"
          title="Anteprima articolo"
        >
          <i class="ti ti-eye"></i> Anteprima
        </a>
      {/if}
      {#if data.article.status === 'published' && (!data.article.publishedAt || new Date(data.article.publishedAt) <= new Date())}
        <a href="{base}/{data.article.slug}" target="_blank" class="btn-ghost">Vedi pubblicato →</a>
      {:else if data.article.status === 'published'}
        <span class="badge badge-scheduled">Programmato</span>
      {/if}
    </div>
  </div>

  <!-- ── Status label for contributor in review/approved ──────────────── -->
  {#if role === 'contributor' && status === 'review'}
    <div class="status-info-banner review">
      ⏳ L'articolo è in attesa di revisione da parte degli editor.
    </div>
  {:else if role === 'contributor' && status === 'approved'}
    <div class="status-info-banner approved">
      ✓ L'articolo è stato approvato ed è in attesa di pubblicazione.
    </div>
  {/if}

  <!-- ── Content form ─────────────────────────────────────────────────── -->
  <form id="save-form" method="POST" action="?/save" use:enhance={({ formData }) => {
    // Always use the editor's current HTML — bypasses any race condition with the hidden input
    const html = getContentFn?.();
    if (html) formData.set('content', html);
    const map = getBlockMapFn?.() ?? {};
    formData.set('blockSnapshots', JSON.stringify(map));
    const bj = getBlocksJsonFn?.() ?? '[]';
    formData.set('blocksJson', bj);
    return async ({ update }) => { await update({ reset: false }); };
  }}>
    <input type="hidden" name="content" value={content} />
    <input type="hidden" name="tags" value={selectedTags.join(',')} />
    <input type="hidden" name="blockSnapshots" value="" />

    <div class="field">
      <input
        name="title"
        type="text"
        placeholder="Titolo dell'articolo"
        class="title-input"
        bind:value={title}
        required
        disabled={isReadOnly}
      />
      <span class="reading-time-hint">{readingTimeEst} min di lettura</span>
    </div>

    <div class="field">
      <Editor
        bind:content
        readonly={isReadOnly}
        {blockComments}
        onAddBlockComment={openBlockCommentForm}
        onBlockIndicatorClick={handleBlockIndicatorClick}
        onReadyGetBlockMapFn={(fn) => { getBlockMapFn = fn; }}
        onReadyGetBlocksJsonFn={(fn) => { getBlocksJsonFn = fn; }}
        onReadyGetContentFn={(fn) => { getContentFn = fn; }}
        blocksJson={data.article.blocksJson}
      />
    </div>

    <div class="meta-fields">
      <div class="field">
        <label>Estratto (opzionale)</label>
        <textarea name="excerpt" rows="3" bind:value={excerpt} disabled={isReadOnly}></textarea>
      </div>
      <div class="field">
        <label>Immagine copertina (URL)</label>
        <input name="coverImage" type="url" bind:value={coverImage} disabled={isReadOnly} />
        {#if coverImage}
          <label class="cover-toggle">
            <input
              type="checkbox"
              name="showCoverInArticle"
              bind:checked={showCoverInArticle}
              disabled={isReadOnly}
            />
            Mostra nell'articolo
          </label>
        {/if}
      </div>
      <div class="field">
        <label>Tag</label>
        <div class="tag-input-wrap">
          {#each selectedTags as tag}
            <span class="tag-pill">
              {tag}
              {#if !isReadOnly}
                <button type="button" onclick={() => removeTag(tag)}>×</button>
              {/if}
            </span>
          {/each}
          {#if !isReadOnly}
            <input
              type="text"
              placeholder="Aggiungi tag..."
              bind:value={tagInput}
              onkeydown={handleTagKeydown}
            />
          {/if}
        </div>
        {#if suggestions.length > 0}
          <ul class="suggestions">
            {#each suggestions as s}
              <li><button type="button" onclick={() => addTag(s.name)}>{s.name}</button></li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>
  </form>

  <!-- ── Action bar (outside save form to avoid cross-form interference) ── -->
  <div class="form-actions">
    <div class="actions-left">
      <!-- Status transition buttons -->
      {#if canSubmitForReview}
        <button type="button" class="btn-transition btn-review" onclick={() => openTransitionDialog('review')}>
          Invia in revisione →
        </button>
      {/if}

      {#if canApprove}
        <button type="button" class="btn-transition btn-approved" onclick={() => openTransitionDialog('approved')}>
          Approva
        </button>
      {/if}

      {#if canPublishArticle}
        <button type="button" class="btn-transition btn-publish" onclick={() => openTransitionDialog('published')}>
          Pubblica
        </button>
      {/if}

      {#if canReturnToDraft}
        <button type="button" class="btn-transition btn-return" onclick={() => openTransitionDialog('draft')}>
          Rimanda in bozza
        </button>
      {/if}

      {#if canUnpublish}
        <button type="button" class="btn-transition btn-return" onclick={() => openTransitionDialog('draft')}>
          Unpubblica
        </button>
      {/if}
    </div>

    <div class="actions-right">
      {#if !isReadOnly}
        <button type="submit" form="save-form" class="btn-ghost">Salva</button>
      {/if}
    </div>
  </div>

  <!-- ── Editorial comments panel ──────────────────────────────────────────── -->
  <div class="editorial-panel" id="editorial-panel">
    <div class="panel-header">
      <div class="panel-title">
        Commenti di redazione
        {#if openCommentsCount > 0}
          <span class="open-badge">{openCommentsCount}</span>
        {/if}
      </div>
      {#if canCreateComments}
        <button type="button" class="btn-ghost btn-sm" onclick={openFreeCommentForm}>
          + Aggiungi commento
        </button>
      {/if}
    </div>

    <div class="comment-filters">
      {#each [['all', 'Tutti'], ['block', 'Con riferimento'], ['free', 'Liberi'], ['orphan', 'Orfani']] as [val, label] (val)}
        <button
          type="button"
          class="filter-tab"
          class:active={commentFilter === val}
          onclick={() => (commentFilter = val as CommentFilter)}
        >{label}</button>
      {/each}
    </div>

    {#if showCommentForm && canCreateComments}
      <div class="comment-form-box">
        {#if newCommentBlockSnapshot}
          <p class="block-ref-preview">«{newCommentBlockSnapshot.slice(0, 80)}{newCommentBlockSnapshot.length > 80 ? '…' : ''}»</p>
        {/if}
        <textarea
          rows="3"
          placeholder="Scrivi un commento..."
          bind:value={newCommentContent}
          class="comment-textarea"
        ></textarea>
        {#if commentError}<p class="error-sm">{commentError}</p>{/if}
        <div class="form-footer">
          <button type="button" class="btn-ghost btn-sm" onclick={() => (showCommentForm = false)}>Annulla</button>
          <button
            type="button"
            class="btn-submit-comment"
            disabled={!newCommentContent.trim() || commentSubmitting}
            onclick={submitComment}
          >{commentSubmitting ? '…' : 'Invia'}</button>
        </div>
      </div>
    {/if}

    {#if filteredComments.length === 0}
      <p class="empty-comments">Nessun commento.</p>
    {:else}
      <div class="comment-list">
        {#each filteredComments as comment (comment.id)}
          {@const wfBadge = comment.workflowEvent ? WORKFLOW_BADGE[comment.workflowEvent] : null}
          {@const wfBorder = comment.workflowEvent ? WORKFLOW_BORDER[comment.workflowEvent] : null}
          <div
            id="ec-{comment.id}"
            class="comment-card"
            class:comment-workflow={!!comment.workflowEvent}
            class:comment-resolved={!!comment.resolvedAt}
            class:comment-highlight={highlightedCommentId === comment.id}
            style={wfBorder ? `border-left-color: ${wfBorder}` : ''}
          >
            {#if comment.blockId && comment.blockSnapshot}
              <div
                class="block-citation"
                class:orphaned={comment.blockOrphaned}
                class:changed={comment.blockContentChanged && !comment.blockOrphaned}
              >
                {#if comment.blockOrphaned}
                  <span class="orphan-icon" title="Il blocco è stato eliminato">🗑</span>
                {/if}
                «{comment.blockSnapshot.slice(0, 80)}{comment.blockSnapshot.length > 80 ? '…' : ''}»
                {#if comment.blockContentChanged && !comment.blockOrphaned}
                  <span class="changed-chip" title="Il contenuto del blocco è stato modificato dopo questo commento">✏ Modificato</span>
                {/if}
              </div>
            {/if}

            {#if wfBadge}
              <span class="workflow-badge" style="background:{wfBadge.bg};color:{wfBadge.color}">{wfBadge.label}</span>
            {/if}

            <p class="comment-content">{comment.content}</p>

            <div class="comment-meta">
              <span class="comment-author">{comment.authorDisplayName ?? comment.authorUsername}</span>
              <span class="comment-date">{formatDate(comment.createdAt)}</span>
              {#if comment.resolvedAt}
                <span class="resolved-badge">✓ Risolto</span>
              {/if}
            </div>

            {#if canCreateComments && !comment.resolvedAt && !comment.workflowEvent}
              <div class="comment-actions">
                {#if !(comment.replies?.length)}
                  <button type="button" class="action-link" onclick={() => { replyingToId = comment.id; replyContent = ''; }}>Rispondi</button>
                {/if}
                {#if role === 'editor' || role === 'admin'}
                  <button type="button" class="action-link" onclick={() => resolveComment(comment.id)}>Risolvi</button>
                {/if}
                {#if role === 'admin' || comment.authorId === userId}
                  <button type="button" class="action-link danger" onclick={() => deleteComment(comment.id)}>Elimina</button>
                {/if}
              </div>
            {/if}

            {#if comment.replies && comment.replies.length > 0}
              <div class="reply-list">
                {#each comment.replies as reply (reply.id)}
                  <div class="reply-card">
                    <p class="comment-content">{reply.content}</p>
                    <div class="comment-meta">
                      <span class="comment-author">{reply.authorDisplayName ?? reply.authorUsername}</span>
                      <span class="comment-date">{formatDate(reply.createdAt)}</span>
                    </div>
                    {#if canCreateComments && (role === 'admin' || reply.authorId === userId)}
                      <div class="comment-actions">
                        <button type="button" class="action-link danger" onclick={() => deleteComment(reply.id)}>Elimina</button>
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}

            {#if replyingToId === comment.id && canCreateComments}
              <div class="reply-form">
                <textarea
                  rows="2"
                  placeholder="Scrivi una risposta..."
                  bind:value={replyContent}
                  class="comment-textarea small"
                ></textarea>
                <div class="form-footer">
                  <button type="button" class="btn-ghost btn-sm" onclick={() => (replyingToId = null)}>Annulla</button>
                  <button
                    type="button"
                    class="btn-submit-comment"
                    disabled={!replyContent.trim() || replySubmitting}
                    onclick={() => submitReply(comment.id)}
                  >{replySubmitting ? '…' : 'Rispondi'}</button>
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- ── Delete ──────────────────────────────────────────────────────────── -->
  {#if role !== 'contributor'}
    <form method="POST" action="?/delete" use:enhance class="delete-form">
      <button
        type="submit"
        class="btn-danger"
        onclick={(e) => { if (!confirm('Eliminare definitivamente questo articolo?')) e.preventDefault(); }}
      >Elimina articolo</button>
    </form>
  {/if}

  <!-- ── Status history ──────────────────────────────────────────────────── -->
  <div class="history-section">
    <button
      type="button"
      class="history-toggle"
      onclick={() => historyOpen = !historyOpen}
    >
      {historyOpen ? '▾' : '▸'} Storico ({data.statusLog.length})
    </button>

    {#if historyOpen}
      <div class="history-list">
        {#if data.statusLog.length === 0}
          <p class="history-empty">Nessuna modifica di stato registrata.</p>
        {:else}
          {#each data.statusLog as entry}
            <div class="history-entry">
              <div class="history-meta">
                <span class="history-transition">
                  {STATUS_EMOJI[entry.fromStatus ?? ''] ?? ''} {entry.fromStatus ? (STATUS_LABELS[entry.fromStatus] ?? entry.fromStatus) : '(creazione)'}
                  → {STATUS_EMOJI[entry.toStatus] ?? ''} {STATUS_LABELS[entry.toStatus] ?? entry.toStatus}
                </span>
                <span class="history-user">{entry.changedByDisplayName ?? entry.changedByUsername ?? '—'}</span>
                <span class="history-date">{formatDate(entry.createdAt)}</span>
              </div>
              {#if entry.checklistSnapshot && Array.isArray(entry.checklistSnapshot) && (entry.checklistSnapshot as any[]).length > 0}
                <div class="history-checklist">
                  <span class="history-checklist-label">Checklist compilata:</span>
                  <ul>
                    {#each entry.checklistSnapshot as item (item.label)}
                      <li>✓ {(item as any).label}</li>
                    {/each}
                  </ul>
                </div>
              {/if}
            </div>
          {/each}
        {/if}
      </div>
    {/if}
  </div>

</div>

<!-- ── Unified transition dialog ───────────────────────────────────────────── -->
{#if showTransitionDialog}
  <div class="modal-backdrop" role="dialog" aria-modal="true">
    <div class="modal" class:modal-wide={dialogToStatus === 'published'}>
      <div class="modal-head">
        <h2>
          {#if dialogToStatus === 'draft'}
            {status === 'published' ? 'Unpubblica' : 'Rimanda in bozza'}
          {:else}
            {dialogConfig?.title ?? ''}
          {/if}
        </h2>
        <button class="btn-icon" onclick={closeTransitionDialog} aria-label="Chiudi">✕</button>
      </div>
      <form
        method="POST"
        action="?/changeStatus"
        use:enhance={({ formData }) => {
          // Convert datetime-local (no timezone) to ISO UTC string so the server
          // stores the user's intended local time, not a UTC-shifted equivalent.
          const rawDatetime = formData.get('publishedAt');
          if (typeof rawDatetime === 'string' && rawDatetime) {
            formData.set('publishedAt', new Date(rawDatetime).toISOString());
          }
          closeTransitionDialog();
        }}
        class="modal-body"
      >
        <input type="hidden" name="toStatus" value={dialogToStatus} />

        {#if dialogToStatus === 'published'}
          <div class="publish-meta-section">
            <label class="modal-field">
              <span>Titolo *</span>
              <input
                type="text"
                name="publishTitle"
                bind:value={dialogPublishTitle}
                placeholder="Titolo dell'articolo"
                required
              />
            </label>
            <label class="modal-field">
              <span>Excerpt *</span>
              <textarea
                name="publishExcerpt"
                rows="3"
                maxlength="200"
                placeholder="Breve descrizione dell'articolo (max 160 caratteri)"
                bind:value={dialogPublishExcerpt}
              ></textarea>
              <span class="excerpt-counter"
                class:excerpt-warning={dialogExcerptLen >= 140 && dialogExcerptLen <= 160}
                class:excerpt-error={dialogExcerptLen > 160}
              >{dialogExcerptLen}/160</span>
            </label>
            <label class="modal-field">
              <span>Data di pubblicazione</span>
              <input
                type="datetime-local"
                name="publishedAt"
                bind:value={dialogPublishDatetime}
              />
            </label>
          </div>
          <hr class="modal-divider" />
        {/if}

        {#if dialogConfig}
          <div class="checklist-section">
            <p class="checklist-label">Spunta tutte le voci per procedere:</p>
            {#each dialogConfig.items as item, i}
              <label class="checklist-item">
                <input type="checkbox" bind:checked={dialogChecklist[i]} />
                <span>{item}</span>
              </label>
            {/each}
          </div>
          <input
            type="hidden"
            name="checklistSnapshot"
            value={JSON.stringify(dialogConfig.items.map((label, i) => ({ label, checked: dialogChecklist[i] ?? false })))}
          />
          <label class="modal-field">
            <span>Note aggiuntive (opzionali)</span>
            <textarea name="note" rows="3" placeholder={dialogConfig.notePlaceholder} bind:value={dialogNote}></textarea>
          </label>
        {:else}
          <p class="modal-desc">
            Aggiungi una nota per l'autore che spiega cosa deve essere modificato.
          </p>
          <label class="modal-field">
            <span>Nota per l'autore *</span>
            <textarea
              name="note"
              rows="4"
              required
              placeholder="Es: Il titolo non è sufficientemente chiaro. Aggiungere più dettagli nella sezione introduttiva..."
              bind:value={dialogNote}
            ></textarea>
          </label>
        {/if}

        <div class="modal-footer">
          <button type="button" class="btn-ghost" onclick={closeTransitionDialog}>Annulla</button>
          <button type="submit" class="btn-transition-submit" disabled={!dialogCanSubmit}>
            {#if dialogToStatus === 'draft'}
              {status === 'published' ? 'Unpubblica' : 'Rimanda in bozza'}
            {:else if dialogIsScheduled}
              Programma pubblicazione
            {:else}
              {dialogConfig?.confirmLabel ?? 'Conferma'}
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .editor-page { max-width: 860px; margin: 0 auto; }

  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-5);
    gap: var(--space-4);
  }
  .editor-header-left {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }
  .header-actions { display: flex; gap: var(--space-3); }

  h1 {
    font-family: var(--font-serif);
    font-size: var(--text-2xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
  }

  /* ── Status badges ────────────────────────────────────────────────────── */
  .badge {
    display: inline-block;
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    padding: 3px 10px;
    border-radius: var(--radius-pill);
    white-space: nowrap;
  }
  .badge-draft    { background: #f1efe8; color: #6b5f8a; }
  .badge-review   { background: #faeeda; color: #854f0b; }
  .badge-approved { background: #e6f1fb; color: #0c447c; }
  .badge-published  { background: #eaf3de; color: #3b6d11; }
  .badge-scheduled  { background: #fef9c3; color: #854d0e; }

  /* ── Status info banners ──────────────────────────────────────────────── */
  .status-info-banner {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    margin-bottom: var(--space-5);
  }
  .status-info-banner.review   { background: #faeeda; color: #854f0b; }
  .status-info-banner.approved { background: #e6f1fb; color: #0c447c; }

  .error {
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    font-size: var(--text-sm);
    margin-bottom: var(--space-4);
  }
  .success {
    background: #ecfdf5;
    color: #065f46;
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    font-size: var(--text-sm);
    margin-bottom: var(--space-4);
  }

  .field { margin-bottom: var(--space-5); }

  .title-input {
    width: 100%;
    font-family: var(--font-serif);
    font-size: var(--text-3xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    border: none;
    border-bottom: 0.5px solid var(--color-bordo);
    background: transparent;
    padding: var(--space-2) 0;
    outline: none;
    letter-spacing: var(--tracking-tight);
  }
  .title-input::placeholder { color: var(--color-lilla); }
  .title-input:disabled { opacity: 0.7; cursor: not-allowed; }

  label {
    display: block;
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-prugna);
    margin-bottom: var(--space-2);
  }

  textarea, input[type="url"], input[type="text"]:not(.title-input) {
    width: 100%;
    padding: 10px var(--space-3);
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-md);
    font-family: var(--font-sans);
    font-size: var(--text-base);
    color: var(--color-notte);
    background: white;
    outline: none;
    resize: vertical;
    transition: border-color var(--transition-fast);
  }
  textarea:focus, input[type="url"]:focus { border-color: var(--color-lavanda); }
  textarea:disabled, input:disabled { background: var(--color-nebbia); opacity: 0.7; cursor: not-allowed; }

  .tag-input-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    align-items: center;
    padding: var(--space-2) var(--space-3);
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-md);
    background: white;
    min-height: 44px;
  }
  .tag-input-wrap input { border: none; padding: 2px 4px; outline: none; font-size: var(--text-sm); min-width: 120px; flex: 1; }
  .tag-pill {
    display: inline-flex; align-items: center; gap: 4px;
    background: var(--color-iris); color: var(--color-viola);
    font-size: var(--text-xs); font-weight: var(--weight-medium);
    padding: 2px 8px; border-radius: var(--radius-pill);
  }
  .tag-pill button { background: none; border: none; cursor: pointer; color: var(--color-viola); font-size: 14px; line-height: 1; padding: 0; }

  .suggestions {
    list-style: none; margin-top: var(--space-1);
    border: 0.5px solid var(--color-bordo); border-radius: var(--radius-md);
    background: white; overflow: hidden; box-shadow: var(--shadow-sm);
  }
  .suggestions li button {
    display: block; width: 100%; text-align: left;
    padding: var(--space-2) var(--space-3); font-size: var(--text-sm);
    color: var(--color-notte); background: none; border: none; cursor: pointer;
    transition: background var(--transition-fast);
  }
  .suggestions li button:hover { background: var(--color-iris); }

  .meta-fields {
    background: white;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    margin-bottom: var(--space-6);
  }

  /* ── Action bar ───────────────────────────────────────────────────────── */
  .form-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-3);
    padding-top: var(--space-4);
    border-top: 0.5px solid var(--color-bordo);
    flex-wrap: wrap;
  }
  .actions-left { display: flex; gap: var(--space-2); flex-wrap: wrap; }
  .actions-right { display: flex; gap: var(--space-3); }

  /* Status transition buttons */
  .btn-transition {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    padding: 8px 16px;
    border-radius: var(--radius-md);
    border: none;
    cursor: pointer;
    transition: opacity var(--transition-fast), filter var(--transition-fast);
  }
  .btn-transition:hover { filter: brightness(0.92); }

  .btn-review   { background: #faeeda; color: #854f0b; }
  .btn-approved { background: #e6f1fb; color: #0c447c; }
  .btn-publish  { background: #eaf3de; color: #3b6d11; }
  .btn-return   { background: #f1efe8; color: #6b5f8a; }

  .btn-ghost {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    background: transparent;
    color: var(--color-lilla);
    padding: 8px 16px;
    border-radius: var(--radius-md);
    border: 0.5px solid var(--color-bordo);
    cursor: pointer;
    transition: border-color var(--transition-fast), color var(--transition-fast);
  }
  .btn-ghost:hover { border-color: var(--color-lavanda); color: var(--color-notte); }
  .btn-preview { display: inline-flex; align-items: center; gap: var(--space-1); }

  .reading-time-hint {
    display: block;
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    color: var(--color-lilla);
    margin-top: var(--space-1);
  }

  .cover-toggle {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    margin-top: var(--space-2);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    color: var(--color-grafite);
    cursor: pointer;
    font-weight: normal;
  }
  .cover-toggle input[type="checkbox"] { cursor: pointer; }

  .delete-form { margin-top: var(--space-4); }
  .btn-danger {
    font-family: var(--font-sans); font-size: var(--text-sm); font-weight: var(--weight-medium);
    background: transparent; color: #b91c1c;
    padding: 8px 16px; border-radius: var(--radius-md); border: 0.5px solid #fecaca;
    cursor: pointer; transition: background var(--transition-fast);
  }
  .btn-danger:hover { background: #fef2f2; }

  /* ── History ──────────────────────────────────────────────────────────── */
  .history-section {
    margin-top: var(--space-10);
    border-top: 0.5px solid var(--color-bordo);
    padding-top: var(--space-5);
  }
  .history-toggle {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-lilla);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: color var(--transition-fast);
  }
  .history-toggle:hover { color: var(--color-notte); }

  .history-list {
    margin-top: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  .history-empty { font-size: var(--text-sm); color: var(--color-lilla); }
  .history-entry {
    padding: var(--space-3) var(--space-4);
    background: var(--color-nebbia);
    border-radius: var(--radius-md);
    border-left: 3px solid var(--color-bordo);
  }
  .history-meta {
    display: flex;
    gap: var(--space-4);
    flex-wrap: wrap;
    align-items: center;
    font-size: var(--text-sm);
  }
  .history-date { color: var(--color-lilla); font-size: var(--text-xs); }
  .history-user { color: var(--color-notte); font-weight: var(--weight-medium); }
  .history-transition {
    font-size: var(--text-xs);
    background: white;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-sm);
    padding: 1px 6px;
    color: var(--color-prugna);
  }
  .history-note {
    font-size: var(--text-sm);
    color: var(--color-prugna);
    font-style: italic;
    margin: var(--space-2) 0 0;
  }

  /* ── Return-to-draft modal ────────────────────────────────────────────── */
  .modal-backdrop {
    position: fixed; inset: 0;
    background: rgba(30, 22, 48, 0.45);
    z-index: 100;
    display: flex; align-items: center; justify-content: center;
    padding: var(--space-4);
  }
  .modal {
    background: white;
    border-radius: var(--radius-lg);
    width: 100%; max-width: 460px;
    box-shadow: 0 8px 40px rgba(30, 22, 48, 0.18);
    overflow: hidden;
  }
  .modal.modal-wide { max-width: 560px; }
  .modal-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: var(--space-4) var(--space-5);
    border-bottom: 0.5px solid var(--color-bordo);
  }
  .modal-head h2 {
    font-family: var(--font-serif); font-size: var(--text-lg);
    font-weight: var(--weight-semibold); color: var(--color-notte);
  }
  .modal-body {
    padding: var(--space-5);
    display: flex; flex-direction: column; gap: var(--space-4);
  }
  .modal-desc { font-size: var(--text-sm); color: var(--color-lilla); }
  .modal-field { display: flex; flex-direction: column; gap: var(--space-2); }
  .modal-field span { font-size: var(--text-sm); font-weight: var(--weight-medium); color: var(--color-notte); }
  .modal-field textarea {
    width: 100%; padding: 10px var(--space-3);
    border: 0.5px solid var(--color-bordo); border-radius: var(--radius-md);
    font-family: var(--font-sans); font-size: var(--text-base);
    color: var(--color-notte); outline: none; resize: vertical;
    transition: border-color var(--transition-fast);
  }
  .modal-field textarea:focus { border-color: var(--color-lavanda); }
  .modal-footer { display: flex; justify-content: flex-end; gap: var(--space-3); padding-top: var(--space-2); }
  .btn-return-submit {
    font-family: var(--font-sans); font-size: var(--text-sm); font-weight: var(--weight-medium);
    background: #6b5f8a; color: white;
    padding: 8px 18px; border-radius: var(--radius-md); border: none;
    cursor: pointer; transition: background var(--transition-fast);
  }
  .btn-return-submit:hover:not(:disabled) { background: var(--color-viola); }
  .btn-return-submit:disabled { opacity: 0.5; cursor: not-allowed; }

  .checklist-section {
    margin-bottom: var(--space-4);
  }
  .checklist-label {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-prugna);
    margin-bottom: var(--space-3);
  }
  .checklist-item {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
    padding: var(--space-2) 0;
    font-size: var(--text-sm);
    color: var(--color-prugna);
    cursor: pointer;
    line-height: 1.4;
  }
  .checklist-item input[type="checkbox"] {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    margin-top: 1px;
    accent-color: var(--color-viola);
    cursor: pointer;
  }
  .btn-transition-submit {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    background: var(--color-lavanda);
    color: white;
    padding: 8px 20px;
    border-radius: var(--radius-md);
    border: none;
    cursor: pointer;
  }
  .btn-transition-submit:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .history-checklist {
    margin-top: var(--space-2);
    padding: var(--space-2) var(--space-3);
    background: var(--color-nebbia);
    border-radius: var(--radius-sm);
    font-size: var(--text-xs);
  }
  .history-checklist-label {
    display: block;
    font-weight: var(--weight-medium);
    color: var(--color-lilla);
    margin-bottom: var(--space-1);
  }
  .history-checklist ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .history-checklist li {
    color: var(--color-lilla);
  }
  .btn-icon {
    background: transparent; border: none; color: var(--color-lilla);
    cursor: pointer; font-size: 1rem; line-height: 1;
    padding: var(--space-1); border-radius: var(--radius-sm);
    transition: color var(--transition-fast);
  }
  .btn-icon:hover { color: var(--color-notte); }

  /* ── Publish metadata section ─────────────────────────────────────────── */
  .publish-meta-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
  .publish-meta-section input[type="text"],
  .publish-meta-section input[type="datetime-local"],
  .publish-meta-section textarea {
    width: 100%;
    padding: 8px var(--space-3);
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-md);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    color: var(--color-notte);
    outline: none;
    resize: vertical;
    transition: border-color var(--transition-fast);
  }
  .publish-meta-section input:focus,
  .publish-meta-section textarea:focus { border-color: var(--color-lavanda); }

  .excerpt-counter {
    font-size: var(--text-xs);
    color: var(--color-lilla);
    text-align: right;
    margin-top: 2px;
  }
  .excerpt-counter.excerpt-warning { color: var(--color-viola); }
  .excerpt-counter.excerpt-error   { color: #b45309; font-weight: var(--weight-medium); }

  .modal-divider {
    border: none;
    border-top: 0.5px solid var(--color-bordo);
    margin: 0;
  }

  /* ── Editorial comments panel ─────────────────────────────────────────────── */
  .editorial-panel {
    margin-top: var(--space-8);
    border-top: 0.5px solid var(--color-bordo);
    padding-top: var(--space-5);
  }
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-4);
  }
  .panel-title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-family: var(--font-sans);
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
  }
  .open-badge {
    background: var(--color-lavanda);
    color: white;
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    padding: 1px 7px;
    border-radius: var(--radius-pill);
    line-height: 1.6;
  }
  .btn-sm { font-size: var(--text-xs); padding: 5px 12px; }
  .comment-filters {
    display: flex;
    gap: var(--space-1);
    margin-bottom: var(--space-4);
    flex-wrap: wrap;
  }
  .filter-tab {
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    color: var(--color-lilla);
    background: transparent;
    border: none;
    padding: 4px 10px;
    border-radius: var(--radius-pill);
    cursor: pointer;
    transition: background var(--transition-fast), color var(--transition-fast);
  }
  .filter-tab:hover { background: var(--color-iris); color: var(--color-viola); }
  .filter-tab.active { background: var(--color-iris); color: var(--color-viola); font-weight: var(--weight-semibold); }
  .comment-form-box {
    background: var(--color-nebbia);
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-md);
    padding: var(--space-4);
    margin-bottom: var(--space-4);
  }
  .block-ref-preview {
    font-size: var(--text-sm);
    font-style: italic;
    color: var(--color-lilla);
    margin-bottom: var(--space-2);
  }
  .comment-textarea {
    width: 100%;
    padding: 8px var(--space-3);
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-md);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    color: var(--color-notte);
    background: white;
    resize: vertical;
    outline: none;
    transition: border-color var(--transition-fast);
    box-sizing: border-box;
  }
  .comment-textarea:focus { border-color: var(--color-lavanda); }
  .form-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
    margin-top: var(--space-2);
  }
  .btn-submit-comment {
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    background: var(--color-lavanda);
    color: white;
    padding: 5px 14px;
    border-radius: var(--radius-md);
    border: none;
    cursor: pointer;
  }
  .btn-submit-comment:disabled { opacity: 0.5; cursor: not-allowed; }
  .error-sm { font-size: var(--text-xs); color: #b91c1c; margin: var(--space-1) 0; }
  .empty-comments { font-size: var(--text-sm); color: var(--color-lilla); padding: var(--space-4) 0; }
  .comment-list { display: flex; flex-direction: column; gap: var(--space-3); }
  .comment-card {
    background: var(--color-nebbia);
    border-left: 3px solid var(--color-bordo);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    transition: border-color 0.15s, box-shadow 0.3s;
  }
  .comment-card.comment-workflow { background: white; }
  .comment-card.comment-resolved { opacity: 0.55; }
  .comment-card.comment-highlight {
    border-left-color: #7c55d4;
    box-shadow: 0 0 0 2px #ece7fa;
  }
  .block-citation {
    font-size: var(--text-xs);
    font-style: italic;
    color: var(--color-lilla);
    background: var(--color-iris);
    border-left: 2px solid var(--color-bordo);
    padding: 2px 8px;
    border-radius: 2px;
    margin-bottom: var(--space-2);
  }
  .block-citation.orphaned { opacity: 0.4; text-decoration: line-through; }
  .block-citation.changed { background: #faeeda; border-left-color: #854f0b; }
  .orphan-icon { margin-right: 4px; }
  .changed-chip {
    display: inline-block;
    font-size: 10px;
    font-style: normal;
    background: #faeeda;
    color: #854f0b;
    padding: 1px 6px;
    border-radius: var(--radius-pill);
    margin-left: 6px;
  }
  .workflow-badge {
    display: inline-block;
    font-size: 11px;
    font-weight: var(--weight-medium);
    padding: 2px 8px;
    border-radius: var(--radius-pill);
    margin-bottom: var(--space-2);
  }
  .comment-content {
    font-size: var(--text-sm);
    color: var(--color-notte);
    line-height: var(--leading-relaxed);
    margin: var(--space-1) 0;
    white-space: pre-wrap;
  }
  .comment-meta { display: flex; gap: var(--space-3); align-items: center; flex-wrap: wrap; margin-top: var(--space-2); }
  .comment-author { font-size: var(--text-xs); font-weight: var(--weight-medium); color: var(--color-notte); }
  .comment-date { font-size: var(--text-xs); color: var(--color-lilla); }
  .resolved-badge {
    font-size: var(--text-xs);
    color: #3b6d11;
    background: #eaf3de;
    padding: 1px 7px;
    border-radius: var(--radius-pill);
  }
  .comment-actions { display: flex; gap: var(--space-3); margin-top: var(--space-2); }
  .action-link {
    background: none;
    border: none;
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    color: var(--color-lilla);
    cursor: pointer;
    padding: 0;
    transition: color var(--transition-fast);
  }
  .action-link:hover { color: var(--color-notte); }
  .action-link.danger:hover { color: #b91c1c; }
  .reply-list {
    margin-top: var(--space-3);
    padding-left: 16px;
    border-left: 2px solid var(--color-bordo);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  .reply-card {
    background: white;
    border-radius: var(--radius-sm);
    padding: var(--space-2) var(--space-3);
  }
  .reply-form {
    margin-top: var(--space-3);
    padding-left: 16px;
    border-left: 2px solid var(--color-bordo);
  }
</style>
