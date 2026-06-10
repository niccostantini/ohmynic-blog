<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { base } from '$app/paths';
  import { addToast } from '$lib/stores/toast';

  let {
    content = $bindable(''),
    blocksJson = undefined as string | null | undefined,
    readonly = false,
    blockComments = {} as Record<string, { count: number; preview: string }>,
    onAddBlockComment = undefined as ((blockId: string, blockType: string, snapshot: string) => void) | undefined,
    onBlockIndicatorClick = undefined as ((blockId: string) => void) | undefined,
    onReadyGetBlockMapFn = undefined as ((fn: () => Record<string, string>) => void) | undefined,
    onReadyGetBlocksJsonFn = undefined as ((fn: () => string) => void) | undefined,
    onReadyGetContentFn = undefined as ((fn: () => string) => void) | undefined,
  }: {
    content: string;
    blocksJson?: string | null;
    readonly?: boolean;
    blockComments?: Record<string, { count: number; preview: string }>;
    onAddBlockComment?: (blockId: string, blockType: string, snapshot: string) => void;
    onBlockIndicatorClick?: (blockId: string) => void;
    onReadyGetBlockMapFn?: (fn: () => Record<string, string>) => void;
    onReadyGetBlocksJsonFn?: (fn: () => string) => void;
    onReadyGetContentFn?: (fn: () => string) => void;
  } = $props();

  let mountEl: HTMLDivElement;
  let rootRef: import('react-dom/client').Root | null = null;
  let showSource = $state(false);
  let sourceValue = $state(content);

  // Bridge: React sets this so the Svelte toolbar can call it
  let insertFootnoteFn: (() => void) | null = null;

  // Bridge: update block comment indicators in React
  let updateBlockCommentsFn: ((c: Record<string, { count: number; preview: string }>) => void) | null = null;

  $effect(() => {
    updateBlockCommentsFn?.(blockComments);
  });

  function applySource() {
    content = sourceValue;
    showSource = false;
    mountEditor(sourceValue);
  }

  // ── R2 image upload ─────────────────────────────────────────────────────────

  const MAX_UPLOAD_SIZE = 15 * 1024 * 1024; // 15 MB

  async function uploadImageFile(file: File): Promise<string> {
    if (file.size > MAX_UPLOAD_SIZE) {
      addToast('Il file supera il limite di 15 MB.', 'error');
      throw new Error('File troppo grande');
    }
    if (!file.type.startsWith('image/')) {
      addToast('Sono accettate solo immagini.', 'error');
      throw new Error('Tipo file non valido');
    }

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${base}/api/upload`, { method: 'POST', body: formData });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      addToast(body.error ?? 'Upload fallito. Riprova.', 'error');
      throw new Error('Upload fallito');
    }

    const { url } = await res.json();
    return url as string;
  }

  async function mountEditor(initialHtml: string) {
    if (rootRef) { rootRef.unmount(); rootRef = null; }
    insertFootnoteFn = null;

    const React = await import('react');
    const { createElement, useState, useCallback, useRef, useMemo, useEffect } = React;
    const { createRoot } = await import('react-dom/client');
    const { createPortal } = await import('react-dom');
    const {
      useCreateBlockNote,
      SuggestionMenuController,
      getDefaultReactSlashMenuItems,
      SideMenuController,
      SideMenu,
      AddBlockButton,
      DragHandleButton,
      useExtensionState,
      useComponentsContext,
      useBlockNoteEditor,
    } = await import('@blocknote/react');
    const { BlockNoteView } = await import('@blocknote/mantine');
    const { BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs } = await import('@blocknote/core');
    const { filterSuggestionItems, SideMenuExtension } = await import('@blocknote/core/extensions');
    const { calloutBlockSpec } = await import('./CalloutBlock.js');
    const { imageBlockSpec } = await import('./ImageBlock.js');
    const { footnoteInlineContentSpec, footnoteListBlockSpec, FootnoteContext } = await import('$lib/editor/footnotes/index.js');

    await import('@blocknote/mantine/style.css');

    // Schema — image sovrascrive il blocco immagine di default aggiungendo float
    const schema = BlockNoteSchema.create({
      blockSpecs: {
        ...defaultBlockSpecs,
        image: imageBlockSpec(uploadImageFile),
        callout: calloutBlockSpec(),
        footnoteList: footnoteListBlockSpec(),
      },
      inlineContentSpecs: {
        ...defaultInlineContentSpecs,
        footnote: footnoteInlineContentSpec,
      },
    });

    // ── Block snapshot extractor ──────────────────────────────────────────────

    function extractBlockSnapshot(block: any): { snapshot: string; blockType: string } {
      const type = block.type as string;
      const getText = (content: any[]): string => {
        if (!Array.isArray(content)) return '';
        return content.map((item: any) => {
          if (item.type === 'text') return item.text ?? '';
          if (item.type === 'link') return (item.content ?? []).map((c: any) => c.text ?? '').join('');
          return '';
        }).join('');
      };
      const truncate = (s: string) => s.length > 300 ? s.slice(0, 297) + '…' : s;
      if (['paragraph', 'heading', 'bulletListItem', 'numberedListItem', 'checkListItem'].includes(type)) {
        return { snapshot: truncate(getText(block.content ?? [])), blockType: type };
      }
      if (type === 'image') return { snapshot: '[Immagine]', blockType: type };
      if (type === 'callout') {
        const title = block.props?.title;
        return { snapshot: title ? `[Callout] ${title}` : '[Callout]', blockType: type };
      }
      return { snapshot: `[Blocco: ${type}]`, blockType: type };
    }

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
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              e.stopPropagation();
              onSave(id, text);
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }
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
      initialBlocksJson,
      onChange,
      onReadyInsertFn,
      onReadyUpdateBlockCommentsFn,
      onAddBlockCommentCb,
      onBlockIndicatorClickCb,
      onReadyGetBlockMapFnCb,
      onReadyGetBlocksJsonFnCb,
      onReadyGetContentFnCb,
      readonlyProp,
    }: {
      html: string;
      initialBlocksJson?: string | null;
      onChange: (h: string) => void;
      onReadyInsertFn: (fn: () => void) => void;
      onReadyUpdateBlockCommentsFn: (fn: (c: Record<string, { count: number; preview: string }>) => void) => void;
      onAddBlockCommentCb?: (blockId: string, blockType: string, snapshot: string) => void;
      onBlockIndicatorClickCb?: (blockId: string) => void;
      onReadyGetBlockMapFnCb?: (fn: () => Record<string, string>) => void;
      onReadyGetBlocksJsonFnCb?: (fn: () => string) => void;
      onReadyGetContentFnCb?: (fn: () => string) => void;
      readonlyProp: boolean;
    }) {
      const editor = useCreateBlockNote({ schema } as any);

      // Block comments state
      const blockCommentsRef = useRef<Record<string, { count: number; preview: string }>>({});
      const [, forceUpdate] = useState(0);

      useEffect(() => {
        onReadyUpdateBlockCommentsFn((comments) => {
          blockCommentsRef.current = comments;
          forceUpdate((n) => n + 1);
        });
      }, []);

      // Block map + blocks JSON + content HTML refs — updated on every change, exposed as getters for form submit
      const blockMapRef = useRef<Record<string, string>>({});
      const blocksJsonRef = useRef<string>('[]');
      const contentHtmlRef = useRef<string>(html); // initialized with initial HTML, kept current

      useEffect(() => {
        onReadyGetBlockMapFnCb?.(() => blockMapRef.current);
        onReadyGetBlocksJsonFnCb?.(() => blocksJsonRef.current);
        onReadyGetContentFnCb?.(() => contentHtmlRef.current);
      }, []);

      // Custom side menu — stable reference, reads from ref
      const CustomSideMenu = useMemo(() => {
        function CM() {
          const Components = useComponentsContext()!;
          const innerEditor = useBlockNoteEditor<any, any, any>();
          const block = useExtensionState(SideMenuExtension as any, {
            editor: innerEditor,
            selector: (state: any) => state?.block,
          });
          const blockId: string | undefined = block?.id;
          const info = blockId ? blockCommentsRef.current[blockId] : null;

          return createElement(
            (Components as any).SideMenu.Root,
            { className: 'bn-side-menu' },
            createElement(AddBlockButton as any),
            createElement(DragHandleButton as any),
            info
              ? createElement('button', {
                  type: 'button',
                  className: 'editorial-comment-dot',
                  title: info.preview,
                  onClick: (e: Event) => {
                    e.stopPropagation();
                    if (blockId) onBlockIndicatorClickCb?.(blockId);
                  },
                }, info.count > 1 ? String(info.count) : '●')
              : null,
            !readonlyProp && blockId
              ? createElement('button', {
                  type: 'button',
                  className: 'editorial-add-comment-btn',
                  title: 'Commenta questo blocco',
                  onClick: (e: Event) => {
                    e.stopPropagation();
                    const b = (innerEditor as any).getBlock(blockId);
                    if (!b) return;
                    const { snapshot, blockType } = extractBlockSnapshot(b);
                    onAddBlockCommentCb?.(blockId, blockType, snapshot);
                  },
                }, '+')
              : null,
          );
        }
        return CM;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

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
        contentHtmlRef.current = h;
        // Update block map + JSON refs (read via getters at form submit)
        const doc = (editor as any).document as any[];
        const map: Record<string, string> = {};
        const walk = (block: any) => {
          const { snapshot } = extractBlockSnapshot(block);
          map[block.id] = snapshot;
          if (Array.isArray(block.children)) block.children.forEach(walk);
        };
        doc.forEach(walk);
        blockMapRef.current = map;
        blocksJsonRef.current = JSON.stringify(doc);
      }, [editor, syncFootnotes]);

      // ── Save note via popover ───────────────────────────────────────────────

      const handleSaveNote = useCallback((id: string, text: string) => {
        const updater = updatersRef.current[id];
        if (updater) updater({ type: 'footnote', props: { id, note: text } });
        setPopover(null);
      }, []);

      // ── Block all keyboard events from reaching ProseMirror while popover is open
      useEffect(() => {
        if (!popover) return;
        const trap = (e: KeyboardEvent) => {
          if ((e.target as Element)?.closest?.('.fn-popover')) {
            e.stopImmediatePropagation();
          }
        };
        document.addEventListener('keydown', trap, true);
        document.addEventListener('keypress', trap, true);
        return () => {
          document.removeEventListener('keydown', trap, true);
          document.removeEventListener('keypress', trap, true);
        };
      }, [popover]);

      // ── Close popover on outside click ──────────────────────────────────────

      useEffect(() => {
        if (!popover) return;
        const handleClick = (e: MouseEvent) => {
          if (!(e.target as Element).closest('.fn-popover')) setPopover(null);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
      }, [popover]);

      // ── Load initial content ────────────────────────────────────────────────
      // Prefer blocksJson (preserves stable block IDs) over HTML (lossy, assigns new IDs)

      useEffect(() => {
        let blocks: any[] | null = null;
        if (initialBlocksJson) {
          try {
            blocks = JSON.parse(initialBlocksJson);
          } catch { /* fall through to HTML */ }
        }
        if (!blocks || blocks.length === 0) {
          blocks = (editor as any).tryParseHTMLToBlocks(html);
        }
        if (blocks && blocks.length > 0) {
          (editor as any).replaceBlocks((editor as any).document, blocks);
        }
        syncFootnotes();
      }, []);

      // ── Slash menu ──────────────────────────────────────────────────────────

      const getSlashItems = useCallback(async (query: string) => {
        // Filter out BlockNote's built-in image item (it opens a file picker incompatible with our URL-based block)
        const defaults = getDefaultReactSlashMenuItems(editor as any).filter(
          (item: any) => item.key !== 'image' && item.title?.toLowerCase() !== 'image'
        );
        const imageItem = {
          title: 'Immagine',
          group: 'Media',
          icon: createElement('span', { style: { fontSize: '1.1rem' } }, '🖼'),
          onItemClick: () => {
            (editor as any).insertBlocks(
              [{ type: 'image', props: { url: '', caption: '', position: 'full' } }],
              (editor as any).getTextCursorPosition().block,
              'after',
            );
          },
        };
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
        return filterSuggestionItems([...defaults, imageItem, ...callouts] as any, query) as any;
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
            { editor, onChange: handleChange, theme: 'light', slashMenu: false, sideMenu: false },
            createElement(SideMenuController as any, { sideMenu: CustomSideMenu }),
            createElement(SuggestionMenuController as any, {
              triggerCharacter: '/',
              getItems: getSlashItems,
            })
          )
        ),
        popover && createPortal(
          createElement(FootnotePopover, {
            id: popover.id,
            note: popover.note,
            anchor: popover.anchor,
            onSave: handleSaveNote,
            onClose: () => setPopover(null),
          }),
          document.body
        )
      );
    }

    if (!mountEl) return;

    rootRef = createRoot(mountEl);
    rootRef.render(
      createElement(EditorWrapper, {
        html: initialHtml,
        initialBlocksJson: blocksJson,
        onChange: (h: string) => {
          content = h;
          sourceValue = h;
        },
        onReadyInsertFn: (fn: () => void) => {
          insertFootnoteFn = fn;
        },
        onReadyUpdateBlockCommentsFn: (fn: (c: Record<string, { count: number; preview: string }>) => void) => {
          updateBlockCommentsFn = fn;
        },
        onAddBlockCommentCb: onAddBlockComment,
        onBlockIndicatorClickCb: onBlockIndicatorClick,
        onReadyGetBlockMapFnCb: onReadyGetBlockMapFn,
        onReadyGetBlocksJsonFnCb: onReadyGetBlocksJsonFn,
        onReadyGetContentFnCb: onReadyGetContentFn,
        readonlyProp: readonly,
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

  /* Image float — :has() targets .bn-block-outer without touching ProseMirror-managed DOM */
  :global(.bn-editor .bn-block-outer:has([data-img-pos="float-right"])) {
    float: right;
    width: 42%;
    margin: 0.25rem 0 0.5rem 1rem;
  }
  :global(.bn-editor .bn-block-outer:has([data-img-pos="float-left"])) {
    float: left;
    width: 42%;
    margin: 0.25rem 1rem 0.5rem 0;
  }
  :global(.bn-editor .bn-block-outer:has([data-img-pos="center"])) {
    float: none;
    width: 70%;
    margin: 0.5rem auto;
    clear: both;
  }
  :global(.bn-editor .bn-block-outer:has([data-img-pos="full"])) {
    float: none;
    width: 100%;
    clear: both;
  }
  /* Clearfix so floats don't bleed past the editor */
  :global(.bn-editor::after) {
    content: '';
    display: table;
    clear: both;
  }

  /* Footnote editor styles */
  :global(.fn-marker) {
    display: inline;
  }
  :global(.fn-marker:hover sup) {
    color: #9b6ff0;
  }

  /* Block comment indicators */
  :global(.editorial-comment-dot) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #7c55d4;
    color: white;
    font-size: 9px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    line-height: 1;
    padding: 0;
    margin-left: 2px;
    flex-shrink: 0;
    transition: opacity 0.15s;
  }
  :global(.editorial-comment-dot:hover) { opacity: 0.8; }

  :global(.editorial-add-comment-btn) {
    display: none;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #ece7fa;
    color: #7c55d4;
    font-size: 12px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    padding: 0;
    margin-left: 2px;
    flex-shrink: 0;
  }
  :global(.bn-side-menu:hover .editorial-add-comment-btn) {
    display: inline-flex;
  }
</style>
