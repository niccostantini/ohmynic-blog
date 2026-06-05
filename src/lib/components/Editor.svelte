<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  let {
    content = $bindable(''),
  }: {
    content: string;
  } = $props();

  let mountEl: HTMLDivElement;
  let rootRef: import('react-dom/client').Root | null = null;
  let showSource = $state(false);
  let sourceValue = $state(content);

  // Bridge: React sets this so the Svelte toolbar can call it
  let insertFootnoteFn: (() => void) | null = null;

  function applySource() {
    content = sourceValue;
    showSource = false;
    mountEditor(sourceValue);
  }

  async function mountEditor(initialHtml: string) {
    if (rootRef) { rootRef.unmount(); rootRef = null; }
    insertFootnoteFn = null;

    const React = await import('react');
    const { createElement, useState, useCallback, useRef, useMemo, useEffect } = React;
    const { createRoot } = await import('react-dom/client');
    const {
      useCreateBlockNote,
      SuggestionMenuController,
      getDefaultReactSlashMenuItems,
    } = await import('@blocknote/react');
    const { BlockNoteView } = await import('@blocknote/mantine');
    const { BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs } = await import('@blocknote/core');
    const { filterSuggestionItems } = await import('@blocknote/core/extensions');
    const { calloutBlockSpec } = await import('./CalloutBlock.js');
    const { footnoteInlineContentSpec, footnoteListBlockSpec, FootnoteContext } = await import('$lib/editor/footnotes/index.js');

    await import('@blocknote/mantine/style.css');

    // Schema with callout block + footnote inline content + footnoteList block
    const schema = BlockNoteSchema.create({
      blockSpecs: {
        ...defaultBlockSpecs,
        callout: calloutBlockSpec(),
        footnoteList: footnoteListBlockSpec,
      },
      inlineContentSpecs: {
        ...defaultInlineContentSpecs,
        footnote: footnoteInlineContentSpec,
      },
    });

    // ── Footnote popover component ────────────────────────────────────────────

    function FootnotePopover({
      id,
      note,
      anchor,
      onSave,
      onClose,
    }: {
      id: string;
      note: string;
      anchor: HTMLElement;
      onSave: (id: string, text: string) => void;
      onClose: () => void;
    }) {
      const [text, setText] = useState(note);
      const rect = anchor.getBoundingClientRect();

      const style: React.CSSProperties = {
        position: 'fixed',
        top: rect.bottom + 8,
        left: Math.min(rect.left, window.innerWidth - 308),
        zIndex: 9999,
        background: 'white',
        border: '0.5px solid #d8d0f0',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 4px 20px rgba(100, 70, 180, 0.12)',
        width: '296px',
      };

      const taStyle: React.CSSProperties = {
        width: '100%',
        resize: 'vertical' as const,
        padding: '8px 10px',
        border: '0.5px solid #d8d0f0',
        borderRadius: '6px',
        fontFamily: 'var(--font-sans, sans-serif)',
        fontSize: '13px',
        color: '#3b2f5e',
        lineHeight: 1.5,
        outline: 'none',
        boxSizing: 'border-box' as const,
        minHeight: '72px',
      };

      return createElement(
        'div',
        { className: 'fn-popover', style },
        createElement(
          'p',
          {
            style: {
              margin: '0 0 8px',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#8e82b0',
            },
          },
          'Testo della nota'
        ),
        createElement('textarea', {
          autoFocus: true,
          value: text,
          placeholder: 'Testo della nota...',
          rows: 3,
          style: taStyle,
          onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value),
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              onSave(id, text);
            }
            if (e.key === 'Escape') onClose();
          },
        }),
        createElement(
          'div',
          { style: { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' } },
          createElement(
            'button',
            {
              type: 'button',
              onClick: onClose,
              style: {
                padding: '5px 12px',
                borderRadius: '5px',
                border: '0.5px solid #d8d0f0',
                background: 'transparent',
                color: '#8e82b0',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans, sans-serif)',
              },
            },
            'Annulla'
          ),
          createElement(
            'button',
            {
              type: 'button',
              onClick: () => onSave(id, text),
              style: {
                padding: '5px 14px',
                borderRadius: '5px',
                border: 'none',
                background: '#7c55d4',
                color: 'white',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 500,
                fontFamily: 'var(--font-sans, sans-serif)',
              },
            },
            'Salva'
          )
        )
      );
    }

    // ── Main editor wrapper ───────────────────────────────────────────────────

    function EditorWrapper({
      html,
      onChange,
      onReadyInsertFn,
    }: {
      html: string;
      onChange: (h: string) => void;
      onReadyInsertFn: (fn: () => void) => void;
    }) {
      const editor = useCreateBlockNote({ schema } as any);

      // Footnote state
      const [indices, setIndices] = useState<Record<string, number>>({});
      const [popover, setPopover] = useState<{
        id: string; note: string; anchor: HTMLElement;
      } | null>(null);
      const [pendingOpenId, setPendingOpenId] = useState<string | null>(null);

      // Map of footnote id → updateInlineContent function
      const updatersRef = useRef<Record<string, (u: any) => void>>({});

      // Track last-exported notes JSON to prevent sync loops
      const footnotesRef = useRef<string>('[]');

      // ── Sync footnotes ──────────────────────────────────────────────────────

      const syncFootnotes = useCallback(() => {
        // 1. Collect footnotes in document order (skip footnoteList blocks)
        const footnotes: { id: string; note: string }[] = [];
        const walkBlock = (block: any) => {
          if (block.type === 'footnoteList') return;
          if (Array.isArray(block.content)) {
            for (const item of block.content) {
              if (item.type === 'footnote') {
                footnotes.push({ id: item.props.id, note: item.props.note });
              }
            }
          }
          for (const child of (block.children ?? [])) walkBlock(child);
        };
        (editor as any).document.forEach(walkBlock);

        // 2. Update in-editor display indices
        const newIndices: Record<string, number> = {};
        footnotes.forEach((f, i) => { newIndices[f.id] = i + 1; });
        setIndices(newIndices);

        // 3. Sync FootnoteList block at end of document
        const notesJson = JSON.stringify(footnotes);
        const blocks = (editor as any).document as any[];
        const fnListBlock = blocks.find((b: any) => b.type === 'footnoteList');
        const lastBlock = blocks[blocks.length - 1];

        if (footnotes.length > 0) {
          if (!fnListBlock) {
            // Insert FootnoteList at end
            footnotesRef.current = notesJson;
            (editor as any).insertBlocks(
              [{ type: 'footnoteList', props: { notes: notesJson } }],
              lastBlock,
              'after'
            );
          } else if (notesJson !== footnotesRef.current) {
            // Update props in place (loop-safe: next sync will see same JSON)
            footnotesRef.current = notesJson;
            (editor as any).updateBlock(fnListBlock, { props: { notes: notesJson } });
          }
        } else if (fnListBlock) {
          // No footnotes → remove FootnoteList
          footnotesRef.current = '[]';
          (editor as any).removeBlocks([fnListBlock]);
        }
      }, [editor]);

      // ── Insert footnote ─────────────────────────────────────────────────────

      const insertFootnote = useCallback(() => {
        const newId = crypto.randomUUID();
        setPendingOpenId(newId);
        (editor as any).insertInlineContent([{
          type: 'footnote',
          props: { id: newId, note: '' },
        }]);
      }, [editor]);

      // Expose insertFootnote to Svelte toolbar
      useEffect(() => {
        onReadyInsertFn(insertFootnote);
      }, [insertFootnote]);

      // ── Handle editor changes ───────────────────────────────────────────────

      const handleChange = useCallback(async () => {
        syncFootnotes();
        const h = await (editor as any).blocksToHTMLLossy((editor as any).document);
        onChange(h);
      }, [editor, syncFootnotes]);

      // ── Save note via popover ───────────────────────────────────────────────

      const handleSaveNote = useCallback((id: string, text: string) => {
        const updater = updatersRef.current[id];
        if (updater) updater({ props: { note: text } });
        setPopover(null);
        // syncFootnotes will run via handleChange triggered by the update
      }, []);

      // ── Close popover on outside click ──────────────────────────────────────

      useEffect(() => {
        if (!popover) return;
        const handleClick = (e: MouseEvent) => {
          if (!(e.target as Element).closest('.fn-popover')) setPopover(null);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
      }, [popover]);

      // ── Load initial HTML ───────────────────────────────────────────────────

      useEffect(() => {
        const blocks = (editor as any).tryParseHTMLToBlocks(html);
        if (blocks.length > 0) {
          (editor as any).replaceBlocks((editor as any).document, blocks);
        }
        syncFootnotes();
      }, []);

      // ── Slash menu ──────────────────────────────────────────────────────────

      const getSlashItems = useCallback(async (query: string) => {
        const defaults = getDefaultReactSlashMenuItems(editor as any);
        const callouts = (
          [
            { emoji: '💡', label: 'Callout Nota',       variant: 'nota'       },
            { emoji: '⚠️', label: 'Callout Attenzione', variant: 'attenzione' },
            { emoji: 'ℹ️', label: 'Callout Info',       variant: 'info'       },
          ] as const
        ).map(({ emoji, label, variant }) => ({
          title: label,
          group: 'Callout',
          icon: createElement('span', { style: { fontSize: '1.1rem' } }, emoji),
          onItemClick: () => {
            (editor as any).insertBlocks(
              [{ type: 'callout', props: { variant, position: 'center', title: '' }, content: '' }],
              (editor as any).getTextCursorPosition().block,
              'after',
            );
          },
        }));
        return filterSuggestionItems([...defaults, ...callouts] as any, query) as any;
      }, [editor]);

      // ── Context value ────────────────────────────────────────────────────────

      const footnoteCtxValue = useMemo(() => ({
        indices,
        pendingOpenId,
        clearPendingOpen: () => setPendingOpenId(null),
        registerUpdater: (id: string, fn: (u: any) => void) => { updatersRef.current[id] = fn; },
        unregisterUpdater: (id: string) => { delete updatersRef.current[id]; },
        openPopover: (id: string, note: string, anchor: HTMLElement) =>
          setPopover({ id, note, anchor }),
      }), [indices, pendingOpenId]);

      // ── Render ────────────────────────────────────────────────────────────────

      return createElement(
        React.Fragment,
        null,
        createElement(
          FootnoteContext.Provider,
          { value: footnoteCtxValue },
          createElement(
            BlockNoteView as any,
            { editor, onChange: handleChange, theme: 'light', slashMenu: false },
            createElement(SuggestionMenuController as any, {
              triggerCharacter: '/',
              getItems: getSlashItems,
            })
          )
        ),
        popover && createElement(FootnotePopover, {
          id: popover.id,
          note: popover.note,
          anchor: popover.anchor,
          onSave: handleSaveNote,
          onClose: () => setPopover(null),
        })
      );
    }

    if (!mountEl) return;

    rootRef = createRoot(mountEl);
    rootRef.render(
      createElement(EditorWrapper, {
        html: initialHtml,
        onChange: (h: string) => {
          content = h;
          sourceValue = h;
        },
        onReadyInsertFn: (fn: () => void) => {
          insertFootnoteFn = fn;
        },
      })
    );
  }

  onMount(() => {
    mountEditor(content);
  });

  onDestroy(() => {
    rootRef?.unmount();
  });
</script>

<div class="editor-wrap">
  <div class="editor-toolbar">
    <button
      type="button"
      class="toolbar-btn footnote-btn"
      onclick={() => insertFootnoteFn?.()}
      title="Inserisci nota a piè di pagina (footnote)"
    >¹</button>
    <button
      type="button"
      class="source-toggle toolbar-btn"
      class:active={showSource}
      onclick={() => {
        if (!showSource) {
          sourceValue = content;
          showSource = true;
        } else {
          applySource();
        }
      }}
      title="Mostra/modifica HTML sorgente"
    >&lt;/&gt;</button>
  </div>

  <div class="bn-mount" bind:this={mountEl}></div>

  {#if showSource}
    <div class="source-panel">
      <textarea bind:value={sourceValue} rows="12" spellcheck="false"></textarea>
      <div class="source-actions">
        <button type="button" class="btn-apply" onclick={applySource}>Applica</button>
        <button type="button" class="btn-cancel" onclick={() => showSource = false}>Annulla</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .editor-wrap {
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-lg);
    overflow: hidden;
    background: white;
  }

  .editor-toolbar {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border-bottom: 0.5px solid var(--color-bordo);
    background: var(--color-nebbia);
  }

  .toolbar-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 28px;
    padding: 0 var(--space-3);
    border: 0.5px solid transparent;
    border-radius: var(--radius-sm);
    background: transparent;
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-lilla);
    cursor: pointer;
    transition: background var(--transition-fast), color var(--transition-fast);
  }

  .toolbar-btn:hover, .toolbar-btn.active {
    background: var(--color-iris);
    color: var(--color-viola);
    border-color: var(--color-bordo);
  }

  .footnote-btn {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-viola);
    letter-spacing: -0.02em;
  }

  /* Keep old class for compat */
  .source-toggle { /* inherits from .toolbar-btn */ }

  .bn-mount {
    min-height: 400px;
  }

  .source-panel {
    border-top: 0.5px solid var(--color-bordo);
    padding: var(--space-4);
    background: var(--color-nebbia);
  }

  .source-panel textarea {
    width: 100%;
    font-family: monospace;
    font-size: var(--text-sm);
    color: var(--color-prugna);
    background: white;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-md);
    padding: var(--space-3);
    resize: vertical;
    outline: none;
  }

  .source-actions {
    display: flex;
    gap: var(--space-2);
    margin-top: var(--space-3);
    justify-content: flex-end;
  }

  .btn-apply {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    background: var(--color-lavanda);
    color: white;
    padding: 6px 14px;
    border-radius: var(--radius-md);
    border: none;
    cursor: pointer;
  }

  .btn-cancel {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    background: transparent;
    color: var(--color-lilla);
    padding: 6px 14px;
    border-radius: var(--radius-md);
    border: 0.5px solid var(--color-bordo);
    cursor: pointer;
  }

  /* Override BlockNote styles con i nostri token */
  :global(.bn-container) {
    font-family: var(--font-sans) !important;
    --bn-font-family: var(--font-sans);
    --bn-border-radius: var(--radius-md);
  }

  :global(.bn-editor) {
    padding: var(--space-6) !important;
    min-height: 380px;
    font-family: var(--font-sans);
    font-size: var(--text-base);
    line-height: var(--leading-relaxed);
    color: var(--color-prugna);
  }

  :global(.bn-editor h1, .bn-editor h2, .bn-editor h3) {
    font-family: var(--font-serif) !important;
    color: var(--color-notte);
    letter-spacing: var(--tracking-tight);
  }

  :global(.bn-editor h2) {
    font-size: var(--text-2xl);
    font-weight: var(--weight-semibold);
  }

  :global(.bn-editor h3) {
    font-size: var(--text-xl);
    font-weight: var(--weight-semibold);
  }

  /* Footnote editor styles */
  :global(.fn-marker) {
    display: inline;
  }
  :global(.fn-marker:hover sup) {
    color: #9b6ff0;
  }
</style>
