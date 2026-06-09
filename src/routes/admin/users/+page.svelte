<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  // ── Tipi ────────────────────────────────────────────────────────────────────
  type User = PageData['users'][number];

  // ── Filtro account disattivati ──────────────────────────────────────────────
  let hideInactive = $state(true);
  const visibleUsers = $derived(hideInactive ? data.users.filter(u => u.active) : data.users);
  const inactiveCount = $derived(data.users.filter(u => !u.active).length);

  // ── Stato modal creazione ───────────────────────────────────────────────────
  let showCreate = $state(false);
  let tempPasswordShown = $state<string | null>(null);
  let createdUsername = $state<string | null>(null);

  // ── Stato modal modifica ────────────────────────────────────────────────────
  let editUser = $state<User | null>(null);
  let editPassword = $state('');
  let confirmVisible = $derived(editPassword.length > 0);
  let deactivateConfirm = $state(false);

  let editRole = $state<string>('contributor');

  function openEdit(u: User) {
    editUser = u;
    editRole = u.role;
    editPassword = '';
    deactivateConfirm = false;
  }
  function closeEdit() {
    editUser = null;
    deactivateConfirm = false;
  }

  // ── Reazione ai form result ─────────────────────────────────────────────────
  $effect(() => {
    if (form?.created && form.tempPassword) {
      showCreate = false;
      tempPasswordShown = form.tempPassword;
      createdUsername = form.createdUsername ?? null;
    }
    if (form?.updated) closeEdit();
    if (form?.toggled) closeEdit();
  });

  // ── Errori inline ───────────────────────────────────────────────────────────
  const editErrorMsg = $derived.by(() => {
    if (!form?.editError) return null;
    if (form.editError === 'username_taken') return 'Username già in uso da un altro account.';
    if (form.editError === 'email_taken') return 'Email già in uso da un altro account.';
    return form.editError as string;
  });
  const editErrorField = $derived.by(() => {
    if (form?.editError === 'username_taken') return 'username';
    if (form?.editError === 'email_taken') return 'email';
    return null;
  });
  // Mostra l'errore solo se riguarda l'utente che stiamo editando
  const showEditError = $derived(
    form?.editId && form.editId === editUser?.id && editErrorMsg
  );

  const ROLE_LABELS: Record<string, string> = {
    admin: 'Admin',
    editor: 'Editor',
    contributor: 'Contributor',
  };

  function initials(name: string | null, username: string) {
    const n = name ?? username;
    return n.slice(0, 1).toUpperCase();
  }
</script>

<div class="page-head">
  <h1 class="page-title">Utenti</h1>
  <div class="page-head-right">
    {#if inactiveCount > 0}
      <label class="toggle-inactive-label">
        <input
          type="checkbox"
          class="toggle-inactive-checkbox"
          bind:checked={hideInactive}
        />
        <span class="toggle-inactive-track"></span>
        <span class="toggle-inactive-text">
          Nascondi disattivati
          {#if hideInactive}
            <span class="inactive-count">({inactiveCount})</span>
          {/if}
        </span>
      </label>
    {/if}
    <button class="btn-primary" onclick={() => { showCreate = true; tempPasswordShown = null; }}>
      + Nuovo utente
    </button>
  </div>
</div>

{#if form?.createError}
  <div class="alert alert-error">{form.createError}</div>
{/if}

{#if tempPasswordShown}
  <div class="alert alert-success">
    <strong>Utente <code>{createdUsername}</code> creato.</strong>
    Password temporanea (mostrata una sola volta):
    <code class="temp-pwd">{tempPasswordShown}</code>
    <button class="btn-ghost btn-sm" onclick={() => { tempPasswordShown = null; }}>✕</button>
  </div>
{/if}

<!-- Tabella utenti -->
<table class="users-table">
  <thead>
    <tr>
      <th>Utente</th>
      <th>Ruolo</th>
      <th>Creato</th>
      <th>Stato</th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    {#each visibleUsers as user}
      <tr class:inactive={!user.active}>
        <td class="td-user">
          <div class="user-cell">
            {#if user.avatarUrl}
              <img src={user.avatarUrl} alt={user.displayName ?? user.username} class="cell-avatar" />
            {:else}
              <div class="cell-avatar-placeholder">{initials(user.displayName, user.username)}</div>
            {/if}
            <div>
              <div class="cell-name">{user.displayName ?? '—'}</div>
              <div class="cell-username">@{user.username}</div>
            </div>
          </div>
        </td>
        <td>
          <span class="role-badge role-{user.role}">{ROLE_LABELS[user.role]}</span>
          {#if user.role === 'editor' && user.canPublish}
            <span class="can-publish-badge" title="Può pubblicare">✓ pubblica</span>
          {/if}
        </td>
        <td class="td-date">{new Date(user.createdAt).toLocaleDateString('it-IT')}</td>
        <td>
          <span class="status-badge" class:active={user.active}>
            {user.active ? 'Attivo' : 'Disattivato'}
          </span>
        </td>
        <td class="td-actions">
          <button class="btn-ghost btn-sm" onclick={() => openEdit(user)}>Modifica</button>
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<!-- ── Modal creazione utente ──────────────────────────────────────────────── -->
{#if showCreate}
  <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Nuovo utente">
    <div class="modal">
      <div class="modal-head">
        <h2>Nuovo utente</h2>
        <button class="btn-icon" onclick={() => (showCreate = false)} aria-label="Chiudi">✕</button>
      </div>
      <form method="POST" action="?/create" use:enhance class="modal-body">
        <label class="field">
          <span>Nome visualizzato *</span>
          <input type="text" name="displayName" required placeholder="Mario Rossi" />
        </label>
        <div class="field-row">
          <label class="field">
            <span>Username *</span>
            <input type="text" name="username" required placeholder="mario.rossi" autocomplete="off" />
          </label>
          <label class="field">
            <span>Email *</span>
            <input type="email" name="email" required placeholder="mario@esempio.com" />
          </label>
        </div>
        <label class="field">
          <span>Ruolo *</span>
          <select name="role">
            <option value="contributor" selected>Contributor</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <p class="field-hint">
          Una password temporanea verrà generata e mostrata una sola volta.
          L'utente dovrà cambiarla al primo accesso.
        </p>
        <div class="modal-footer">
          <button type="button" class="btn-ghost" onclick={() => (showCreate = false)}>Annulla</button>
          <button type="submit" class="btn-primary">Crea utente</button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- ── Modal modifica utente ───────────────────────────────────────────────── -->
{#if editUser}
  {@const u = editUser}
  {@const isSelf = form?.editId === u.id}
  <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Modifica utente">
    <div class="modal modal-edit">

      <!-- Header con avatar + info -->
      <div class="edit-head">
        <div class="edit-head-left">
          {#if u.avatarUrl}
            <img src={u.avatarUrl} alt={u.displayName ?? u.username} class="edit-avatar" />
          {:else}
            <div class="edit-avatar-placeholder">{initials(u.displayName, u.username)}</div>
          {/if}
          <div>
            <div class="edit-name">{u.displayName ?? u.username}</div>
            <span class="role-badge role-{u.role}">{ROLE_LABELS[u.role]}</span>
          </div>
        </div>
        <button class="btn-icon" onclick={closeEdit} aria-label="Chiudi">✕</button>
      </div>

      <!-- Errore inline -->
      {#if showEditError}
        <div class="edit-error">{editErrorMsg}</div>
      {/if}

      <form
        method="POST"
        action="?/update"
        use:enhance
        class="modal-body"
        id="edit-form-{u.id}"
      >
        <input type="hidden" name="id" value={u.id} />

        <div class="field-row">
          <label class="field">
            <span>Nome visualizzato *</span>
            <input
              type="text"
              name="displayName"
              required
              value={u.displayName ?? ''}
              class:field-error={editErrorField === 'displayName'}
            />
          </label>
          <label class="field">
            <span>Username *</span>
            <input
              type="text"
              name="username"
              required
              value={u.username}
              class:field-error={editErrorField === 'username'}
            />
            {#if editErrorField === 'username'}
              <span class="field-error-msg">Username già in uso.</span>
            {/if}
          </label>
        </div>

        <label class="field">
          <span>Email</span>
          <input
            type="email"
            name="email"
            value={u.email ?? ''}
            class:field-error={editErrorField === 'email'}
          />
          {#if editErrorField === 'email'}
            <span class="field-error-msg">Email già in uso.</span>
          {/if}
        </label>

        <label class="field">
          <span>Bio</span>
          <textarea name="bio" rows="3" placeholder="Breve biografia...">{u.bio ?? ''}</textarea>
        </label>

        <label class="field">
          <span>URL avatar</span>
          <input type="url" name="avatarUrl" value={u.avatarUrl ?? ''} placeholder="https://..." />
        </label>

        <label class="field">
          <span>Ruolo *</span>
          <select name="role" bind:value={editRole}>
            {#each ['admin', 'editor', 'contributor'] as r}
              <option value={r} selected={u.role === r}>{ROLE_LABELS[r]}</option>
            {/each}
          </select>
        </label>

        {#if editRole === 'editor'}
          <div class="can-publish-row">
            <label class="toggle-label">
              <input
                type="checkbox"
                name="canPublish"
                value="true"
                checked={u.role === 'editor' ? (u.canPublish ?? false) : false}
                class="toggle-checkbox"
              />
              <span class="toggle-track"></span>
              <span class="toggle-text">
                Può pubblicare articoli
                <small>Permette all'editor di pubblicare e unpubblicare articoli</small>
              </span>
            </label>
          </div>
        {:else}
          <!-- canPublish is false for non-editors -->
        {/if}

        <div class="pwd-section">
          <div class="pwd-section-label">Cambia password <span class="optional">(opzionale)</span></div>
          <div class="field-row">
            <label class="field">
              <span>Nuova password</span>
              <input
                type="password"
                name="password"
                autocomplete="new-password"
                bind:value={editPassword}
                placeholder="min. 12 caratteri"
              />
            </label>
            {#if confirmVisible}
              <label class="field">
                <span>Conferma password</span>
                <input type="password" name="confirm" autocomplete="new-password" />
              </label>
            {:else}
              <!-- placeholder invisibile per mantenere il layout -->
              <input type="hidden" name="confirm" value="" />
            {/if}
          </div>
        </div>
      </form>

      <!-- Footer -->
      <div class="edit-footer">
        <div class="edit-footer-danger">
          {#if u.active}
            {#if deactivateConfirm}
              <span class="deactivate-confirm-text">Sei sicuro?</span>
              <form method="POST" action="?/toggleActive" use:enhance>
                <input type="hidden" name="id" value={u.id} />
                <input type="hidden" name="active" value="false" />
                <button type="submit" class="btn-danger-outline">Sì, disattiva</button>
              </form>
              <button class="btn-ghost btn-sm" onclick={() => (deactivateConfirm = false)}>Annulla</button>
            {:else}
              <button
                class="btn-deactivate"
                onclick={() => (deactivateConfirm = true)}
              >Disattiva account</button>
            {/if}
          {:else}
            <form method="POST" action="?/toggleActive" use:enhance>
              <input type="hidden" name="id" value={u.id} />
              <input type="hidden" name="active" value="true" />
              <button type="submit" class="btn-reactivate">Riattiva account</button>
            </form>
          {/if}
        </div>
        <div class="edit-footer-main">
          <button type="button" class="btn-ghost" onclick={closeEdit}>Annulla</button>
          <button type="submit" form="edit-form-{u.id}" class="btn-primary">Salva modifiche</button>
        </div>
      </div>

    </div>
  </div>
{/if}

<style>
  /* ── Page ─────────────────────────────────────────────────────────────────── */
  .page-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-6);
    gap: var(--space-4);
    flex-wrap: wrap;
  }
  .page-title {
    font-family: var(--font-serif);
    font-size: var(--text-2xl);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    letter-spacing: var(--tracking-tight);
  }
  .page-head-right {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  /* ── Toggle nascondi disattivati ─────────────────────────────────────────── */
  .toggle-inactive-label {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    cursor: pointer;
    user-select: none;
  }
  .toggle-inactive-checkbox { display: none; }
  .toggle-inactive-track {
    width: 32px;
    height: 18px;
    background: var(--color-bordo);
    border-radius: 9px;
    flex-shrink: 0;
    position: relative;
    transition: background var(--transition-fast);
  }
  .toggle-inactive-track::after {
    content: '';
    position: absolute;
    top: 3px; left: 3px;
    width: 12px; height: 12px;
    background: white;
    border-radius: 50%;
    transition: transform var(--transition-fast);
    box-shadow: 0 1px 2px rgba(0,0,0,0.15);
  }
  .toggle-inactive-checkbox:checked + .toggle-inactive-track {
    background: var(--color-lavanda);
  }
  .toggle-inactive-checkbox:checked + .toggle-inactive-track::after {
    transform: translateX(14px);
  }
  .toggle-inactive-text {
    font-size: var(--text-sm);
    color: var(--color-lilla);
    white-space: nowrap;
  }
  .inactive-count {
    font-size: var(--text-xs);
    color: var(--color-lilla);
  }

  /* ── Alerts ───────────────────────────────────────────────────────────────── */
  .alert {
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    margin-bottom: var(--space-4);
    font-size: var(--text-sm);
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex-wrap: wrap;
  }
  .alert-error  { background: #fde8e8; color: #7f1d1d; }
  .alert-success { background: #ecfdf5; color: #064e3b; }
  .temp-pwd {
    font-family: monospace;
    font-size: 1rem;
    font-weight: 700;
    background: #d1fae5;
    padding: 2px 8px;
    border-radius: 4px;
    letter-spacing: 0.05em;
  }

  /* ── Table ────────────────────────────────────────────────────────────────── */
  .users-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-lg);
    overflow: hidden;
    font-size: var(--text-sm);
  }
  .users-table th {
    text-align: left;
    padding: var(--space-3) var(--space-4);
    font-weight: var(--weight-medium);
    color: var(--color-lilla);
    background: var(--color-nebbia);
    border-bottom: 0.5px solid var(--color-bordo);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: var(--tracking-wider);
  }
  .users-table td {
    padding: var(--space-3) var(--space-4);
    border-bottom: 0.5px solid var(--color-bordo);
    vertical-align: middle;
  }
  .users-table tr:last-child td { border-bottom: none; }
  .users-table tr.inactive td { opacity: 0.5; }

  .td-user { min-width: 200px; }
  .user-cell { display: flex; align-items: center; gap: var(--space-3); }
  .cell-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }
  .cell-avatar-placeholder {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--color-iris);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: var(--weight-semibold);
    color: var(--color-viola);
    font-size: var(--text-sm);
    flex-shrink: 0;
  }
  .cell-name { font-weight: var(--weight-medium); color: var(--color-notte); }
  .cell-username { font-size: var(--text-xs); color: var(--color-lilla); font-family: monospace; }
  .td-date { color: var(--color-lilla); white-space: nowrap; }
  .td-actions { text-align: right; }

  /* ── Badges ───────────────────────────────────────────────────────────────── */
  .role-badge {
    display: inline-block;
    font-size: 11px;
    font-weight: var(--weight-medium);
    padding: 2px 8px;
    border-radius: 100px;
  }
  .role-admin       { background: #1e1630; color: #f5f3fb; }
  .role-editor      { background: #ece7fa; color: #3b2f5e; }
  .role-contributor { background: #f1efe8; color: #444441; }
  .can-publish-badge {
    display: inline-block;
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 100px;
    background: #eaf3de;
    color: #3b6d11;
    margin-left: 4px;
  }

  .status-badge {
    display: inline-block;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 100px;
    background: #f1efe8;
    color: #666;
  }
  .status-badge.active { background: #d1fae5; color: #065f46; }

  /* ── Buttons ──────────────────────────────────────────────────────────────── */
  .btn-primary {
    padding: var(--space-2) var(--space-4);
    background: var(--color-lavanda);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    cursor: pointer;
    font-family: inherit;
    transition: background var(--transition-fast);
  }
  .btn-primary:hover { background: var(--color-viola); }

  .btn-ghost {
    padding: var(--space-2) var(--space-3);
    background: transparent;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
    color: var(--color-lilla);
    cursor: pointer;
    font-family: inherit;
    transition: border-color var(--transition-fast), color var(--transition-fast);
  }
  .btn-ghost:hover { border-color: var(--color-lavanda); color: var(--color-notte); }
  .btn-sm { font-size: 11px; padding: 2px 8px; }

  .btn-icon {
    background: transparent;
    border: none;
    color: var(--color-lilla);
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
    padding: var(--space-1);
    border-radius: var(--radius-sm);
    transition: color var(--transition-fast);
  }
  .btn-icon:hover { color: var(--color-notte); }

  .btn-deactivate {
    background: transparent;
    border: none;
    color: #b91c1c;
    font-size: var(--text-xs);
    cursor: pointer;
    font-family: inherit;
    padding: 0;
    text-decoration: underline;
    text-underline-offset: 2px;
    opacity: 0.8;
    transition: opacity var(--transition-fast);
  }
  .btn-deactivate:hover { opacity: 1; }

  .btn-reactivate {
    background: transparent;
    border: none;
    color: #065f46;
    font-size: var(--text-xs);
    cursor: pointer;
    font-family: inherit;
    padding: 0;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .btn-danger-outline {
    padding: 2px 10px;
    background: transparent;
    border: 0.5px solid #fca5a5;
    border-radius: var(--radius-sm);
    color: #b91c1c;
    font-size: var(--text-xs);
    cursor: pointer;
    font-family: inherit;
    transition: background var(--transition-fast);
  }
  .btn-danger-outline:hover { background: #fde8e8; }

  /* ── Modal shared ─────────────────────────────────────────────────────────── */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(30, 22, 48, 0.45);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-4);
  }
  .modal {
    background: white;
    border-radius: var(--radius-lg);
    width: 100%;
    max-width: 460px;
    box-shadow: 0 8px 40px rgba(30, 22, 48, 0.18);
    overflow: hidden;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }
  .modal-edit { max-width: 580px; }

  .modal-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-5);
    border-bottom: 0.5px solid var(--color-bordo);
    flex-shrink: 0;
  }
  .modal-head h2 {
    font-family: var(--font-serif);
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
  }

  .modal-body {
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    overflow-y: auto;
    flex: 1;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-3);
    padding-top: var(--space-2);
  }

  /* ── Form fields ──────────────────────────────────────────────────────────── */
  .field { display: flex; flex-direction: column; gap: var(--space-1); flex: 1; }
  .field-row { display: flex; gap: var(--space-3); }
  .field span {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-notte);
  }
  .field input, .field select, .field textarea {
    padding: var(--space-2) var(--space-3);
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-family: inherit;
    color: var(--color-notte);
    outline: none;
    transition: border-color var(--transition-fast);
    width: 100%;
    box-sizing: border-box;
  }
  .field input:focus, .field select:focus, .field textarea:focus {
    border-color: var(--color-lavanda);
  }
  .field textarea { resize: vertical; }
  :global(.field-error) { border-color: #fca5a5 !important; }
  .field-error-msg {
    font-size: var(--text-xs);
    color: #b91c1c;
    margin-top: 2px;
  }
  .field-hint {
    font-size: var(--text-xs);
    color: var(--color-lilla);
    line-height: 1.5;
    background: var(--color-nebbia);
    padding: var(--space-3);
    border-radius: var(--radius-sm);
  }

  /* ── Edit modal specific ──────────────────────────────────────────────────── */
  .edit-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-5);
    border-bottom: 0.5px solid var(--color-bordo);
    flex-shrink: 0;
  }
  .edit-head-left { display: flex; align-items: center; gap: var(--space-3); }
  .edit-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    border: 1.5px solid var(--color-bordo);
  }
  .edit-avatar-placeholder {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--color-iris);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-serif);
    font-size: var(--text-xl);
    font-weight: var(--weight-semibold);
    color: var(--color-viola);
    flex-shrink: 0;
  }
  .edit-name {
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    font-size: var(--text-base);
    margin-bottom: var(--space-1);
  }

  .edit-error {
    background: #fde8e8;
    color: #7f1d1d;
    font-size: var(--text-sm);
    padding: var(--space-3) var(--space-5);
    flex-shrink: 0;
  }

  .pwd-section {
    background: var(--color-nebbia);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  .pwd-section-label {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-notte);
  }
  .optional {
    font-size: var(--text-xs);
    font-weight: normal;
    color: var(--color-lilla);
  }

  /* ── canPublish toggle ────────────────────────────────────────────────── */
  .can-publish-row {
    background: var(--color-nebbia);
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
  }
  .toggle-label {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    cursor: pointer;
  }
  .toggle-checkbox { display: none; }
  .toggle-track {
    width: 36px;
    height: 20px;
    background: var(--color-bordo);
    border-radius: 10px;
    flex-shrink: 0;
    position: relative;
    transition: background var(--transition-fast);
  }
  .toggle-track::after {
    content: '';
    position: absolute;
    top: 3px; left: 3px;
    width: 14px; height: 14px;
    background: white;
    border-radius: 50%;
    transition: transform var(--transition-fast);
  }
  .toggle-checkbox:checked + .toggle-track {
    background: var(--color-lavanda);
  }
  .toggle-checkbox:checked + .toggle-track::after {
    transform: translateX(16px);
  }
  .toggle-text {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-notte);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .toggle-text small {
    font-size: var(--text-xs);
    font-weight: normal;
    color: var(--color-lilla);
  }

  .edit-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-5);
    border-top: 0.5px solid var(--color-bordo);
    flex-shrink: 0;
    gap: var(--space-3);
  }
  .edit-footer-danger { display: flex; align-items: center; gap: var(--space-2); }
  .edit-footer-main   { display: flex; align-items: center; gap: var(--space-3); }
  .deactivate-confirm-text { font-size: var(--text-xs); color: var(--color-lilla); }
</style>
