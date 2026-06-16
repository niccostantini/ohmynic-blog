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
    onSave = undefined as (() => void) | undefined,
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
    onSave?: () => void;
  } = $props();

  let mountEl: HTMLDivElement;
  let rootRef: import('react-dom/client').Root | null = null;
  let showSource = $state(false);
  let sourceValue = $state(content);

  // Bridge: React sets this so the Svelte toolbar can call it
  let insertFootnoteFn: (() => void) | null = null;
  let setFontSizeFn: ((size: string | null) => void) | null = null;
  let setListStyleFn: ((style: string) => void) | null = null;
  let setBulletStyleFn: ((style: string) => void) | null = null;
  let openBulletIconPickerFn: (() => void) | null = null;
  // Reactive: React notifies Svelte of current block type on selection change
  let cursorBlockType = $state('');

  // Bridge: update block comment indicators in React
  let updateBlockCommentsFn: ((c: Record<string, { count: number; preview: string }>) => void) | null = null;

  const BULLET_OPTIONS = [
    { value: 'auto',    char: '↺', title: 'Auto (default per livello)' },
    { value: 'disc',    char: '•', title: 'Pallino'  },
    { value: 'circle',  char: '○', title: 'Cerchio'  },
    { value: 'square',  char: '■', title: 'Quadrato' },
    { value: 'diamond', char: '◆', title: 'Rombo'    },
    { value: 'dash',    char: '–', title: 'Trattino' },
    { value: 'arrow',   char: '→', title: 'Freccia'  },
  ];

  $effect(() => {
    updateBlockCommentsFn?.(blockComments);
  });

  // Auto-save — globale via sessionStorage (si resetta a ON ad ogni sessione browser)
  const AUTOSAVE_KEY = 'ohmynic_autosave';
  let autoSaveEnabled = $state(true);
  let lastSavedContent = content;
  let lastAutoSaveTime = $state<string | null>(null);

  $effect(() => {
    if (!autoSaveEnabled || !onSave) return;
    const timer = setInterval(() => {
      if (content !== lastSavedContent) {
        lastSavedContent = content;
        onSave();
        lastAutoSaveTime = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      }
    }, 60_000);
    return () => clearInterval(timer);
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

    const res = await fetch(`${base}/api/upload?maxWidth=1200`, { method: 'POST', body: formData });

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
    const { pollBlockSpec } = await import('./PollBlock.js');
    const { embedBlockSpec } = await import('./EmbedBlock.js');
    const { numberedListItemSpec } = await import('./NumberedListBlock.js');
    const { bulletListItemSpec } = await import('./BulletListBlock.js');
    const { fontSizeStyle } = await import('$lib/editor/FontSizeStyle.js');
    const { tablerIconInlineContentSpec } = await import('$lib/editor/TablerIconSpec.js');
    const { defaultStyleSpecs } = await import('@blocknote/core');

    await import('@blocknote/mantine/style.css');

    // Schema — image sovrascrive il blocco immagine di default aggiungendo float
    const schema = BlockNoteSchema.create({
      blockSpecs: {
        ...defaultBlockSpecs,
        image: imageBlockSpec(uploadImageFile)(),
        callout: calloutBlockSpec(),
        footnoteList: footnoteListBlockSpec(),
        poll: pollBlockSpec(),
        embed: embedBlockSpec(),
        numberedListItem: numberedListItemSpec(),
        bulletListItem: bulletListItemSpec(),
      },
      inlineContentSpecs: {
        ...defaultInlineContentSpecs,
        footnote: footnoteInlineContentSpec,
        tablerIcon: tablerIconInlineContentSpec,
      },
      styleSpecs: {
        ...defaultStyleSpecs,
        fontSize: fontSizeStyle,
      },
    } as any);

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
      if (type === 'poll') {
        const q = block.props?.question;
        return { snapshot: q ? `[Sondaggio] ${q}` : '[Sondaggio]', blockType: type };
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
      onReadySetFontSizeFnCb,
      onReadySetListStyleFnCb,
      onReadySetBulletStyleFnCb,
      onReadyOpenBulletIconPickerCb,
      onCursorBlockTypeChangeCb,
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
      onReadySetFontSizeFnCb?: (fn: (size: string | null) => void) => void;
      onReadySetListStyleFnCb?: (fn: (style: string) => void) => void;
      onReadySetBulletStyleFnCb?: (fn: (style: string) => void) => void;
      onReadyOpenBulletIconPickerCb?: (fn: () => void) => void;
      onCursorBlockTypeChangeCb?: (type: string) => void;
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

      // Font size bridge
      useEffect(() => {
        onReadySetFontSizeFnCb?.((size: string | null) => {
          if (size === null) {
            (editor as any).removeStyles({ fontSize: '' });
          } else {
            (editor as any).addStyles({ fontSize: size });
          }
          (editor as any).focus();
        });
      }, []);

      // List style bridge
      useEffect(() => {
        onReadySetListStyleFnCb?.((style: string) => {
          const pos = (editor as any).getTextCursorPosition?.();
          if (pos?.block?.type === 'numberedListItem') {
            (editor as any).updateBlock(pos.block, { props: { listStyle: style } });
            (editor as any).focus();
          }
        });
      }, []);

      // Bullet style bridge
      useEffect(() => {
        onReadySetBulletStyleFnCb?.((style: string) => {
          const pos = (editor as any).getTextCursorPosition?.();
          if (pos?.block?.type === 'bulletListItem') {
            (editor as any).updateBlock(pos.block, { props: { bulletStyle: style } });
            (editor as any).focus();
          }
        });
      }, []);

      // Bullet icon picker bridge
      useEffect(() => {
        onReadyOpenBulletIconPickerCb?.(() => {
          setBulletIconPickerOpen(true);
        });
      }, []);

      // Cursor block type bridge — notifies Svelte on every selection change
      useEffect(() => {
        const handler = () => {
          try {
            const pos = (editor as any).getTextCursorPosition?.();
            onCursorBlockTypeChangeCb?.(pos?.block?.type ?? '');
          } catch {}
        };
        document.addEventListener('selectionchange', handler);
        return () => document.removeEventListener('selectionchange', handler);
      }, [editor]);

      // List Enter behavior — restores standard word-processor behavior lost with createReactBlockSpec:
      //   • Enter on empty item  → exit list (convert to paragraph)
      //   • Enter on non-empty   → BlockNote splits the block; we fix type + inherit style props
      useEffect(() => {
        const handleListEnter = (e: KeyboardEvent) => {
          if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
          try {
            const pos = (editor as any).getTextCursorPosition?.();
            const block = pos?.block;
            if (!block) return;
            const isBullet   = block.type === 'bulletListItem';
            const isNumbered = block.type === 'numberedListItem';
            if (!isBullet && !isNumbered) return;

            const content = block.content ?? [];
            const allText = content.map((c: any) => c.text ?? '').join('');
            const isEmpty = allText === '' && content.every((c: any) => c.type === 'text');
            const listType = block.type;
            const inheritedProps = isBullet
              ? { bulletStyle: block.props?.bulletStyle ?? 'auto' }
              : { listStyle:   block.props?.listStyle   ?? 'auto' };
            const blockId = block.id;

            if (isEmpty) {
              // Empty item → exit list
              e.preventDefault();
              e.stopPropagation();
              (editor as any).updateBlock(block, { type: 'paragraph', props: {} });
            } else {
              // Non-empty: let BlockNote split at cursor, then fix type + props on new block
              requestAnimationFrame(() => {
                try {
                  const newPos = (editor as any).getTextCursorPosition?.();
                  const newBlock = newPos?.block;
                  if (!newBlock || newBlock.id === blockId) return;
                  (editor as any).updateBlock(newBlock, { type: listType, props: inheritedProps });
                } catch {}
              });
            }
          } catch {}
        };
        document.addEventListener('keydown', handleListEnter, true);
        return () => document.removeEventListener('keydown', handleListEnter, true);
      }, [editor]);

      // Icon picker state
      const [iconPickerOpen, setIconPickerOpen] = useState(false);
      const [bulletIconPickerOpen, setBulletIconPickerOpen] = useState(false);

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
            // Backfill props added after initial save (schema migrations).
            // BlockNote rejects blocks with missing props instead of using defaults.
            blocks = blocks.map((b: any) => {
              if (b.type === 'image' && b.props) {
                const pos = b.props.position;
                const isFloat = pos === 'float-right' || pos === 'float-left';
                if (!('width' in b.props)) {
                  return { ...b, props: { ...b.props, width: isFloat ? '42' : '100' } };
                }
                if (isFloat && b.props.width === '100') {
                  return { ...b, props: { ...b.props, width: '42' } };
                }
              }
              if (b.type === 'numberedListItem' && b.props && !('listStyle' in b.props)) {
                return { ...b, props: { ...b.props, listStyle: 'auto' } };
              }
              if (b.type === 'bulletListItem' && b.props && !('bulletStyle' in b.props)) {
                return { ...b, props: { ...b.props, bulletStyle: 'auto' } };
              }
              if (b.type === 'embed' && b.props) {
                // Backfill any prop added after initial save
                const defaults: Record<string, string> = {
                  url: '', service: '', embedUrl: '', label: '', icon: '',
                  position: 'full', width: '100', height: '',
                };
                const filled: Record<string, string> = {};
                let changed = false;
                for (const [k, v] of Object.entries(defaults)) {
                  if (!(k in b.props)) { filled[k] = v as string; changed = true; }
                }
                if (changed) return { ...b, props: { ...b.props, ...filled } };
              }
              return b;
            });
          } catch { /* fall through to HTML */ }
        }
        // Recursive pass: bulletListItem can be nested in children (Tab key),
        // so the top-level map above isn't enough.
        if (blocks) {
          const deepBulletBackfill = (b: any): any => {
            if (b.type === 'bulletListItem' && b.props && !('bulletStyle' in b.props)) {
              b = { ...b, props: { ...b.props, bulletStyle: 'auto' } };
            }
            if (b.children?.length > 0) {
              b = { ...b, children: b.children.map(deepBulletBackfill) };
            }
            return b;
          };
          blocks = blocks.map(deepBulletBackfill);
        }
        if (!blocks || blocks.length === 0) {
          blocks = (editor as any).tryParseHTMLToBlocks(html);
        }
        if (blocks && blocks.length > 0) {
          try {
            (editor as any).replaceBlocks((editor as any).document, blocks);
          } catch {
            // Schema mismatch: fall back to HTML parsing
            const htmlBlocks = (editor as any).tryParseHTMLToBlocks(html);
            if (htmlBlocks?.length > 0) {
              (editor as any).replaceBlocks((editor as any).document, htmlBlocks);
            }
          }
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
          icon: createElement('i', { className: 'ti ti-photo', style: { fontSize: '1.1rem' } }),
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
            { icon: 'ti-bulb',          label: 'Callout Nota',       variant: 'nota'       },
            { icon: 'ti-alert-triangle', label: 'Callout Attenzione', variant: 'attenzione' },
            { icon: 'ti-info-circle',    label: 'Callout Info',       variant: 'info'       },
          ] as const
        ).map(({ icon, label, variant }) => ({
          title: label,
          group: 'Callout',
          icon: createElement('i', { className: `ti ${icon}`, style: { fontSize: '1.1rem' } }),
          onItemClick: () => {
            (editor as any).insertBlocks(
              [{ type: 'callout', props: { variant, position: 'center', title: '' }, content: '' }],
              (editor as any).getTextCursorPosition().block,
              'after',
            );
          },
        }));
        const pollItem = {
          title: 'Sondaggio',
          group: 'Media',
          icon: createElement('i', { className: 'ti ti-chart-bar', style: { fontSize: '1.1rem' } }),
          onItemClick: () => {
            // pollId vuoto → il blocco mostra il picker "Nuovo / Esistente"
            (editor as any).insertBlocks(
              [{ type: 'poll', props: { pollId: '', question: '', options: '', allowMultiple: false, closed: false } }],
              (editor as any).getTextCursorPosition().block,
              'after',
            );
          },
        };
        const iconItem = {
          title: 'Icona',
          group: 'Media',
          icon: createElement('i', { className: 'ti ti-icons', style: { fontSize: '1.1rem' } }),
          onItemClick: () => { setIconPickerOpen(true); },
        };
        const embedItem = {
          title: 'Embed',
          group: 'Media',
          icon: createElement('i', { className: 'ti ti-link', style: { fontSize: '1.1rem' } }),
          onItemClick: () => {
            (editor as any).insertBlocks(
              [{ type: 'embed', props: { url: '', service: '', embedUrl: '', label: '', icon: '', position: 'full', width: '100', height: '' } }],
              (editor as any).getTextCursorPosition().block,
              'after',
            );
          },
        };
        return filterSuggestionItems([...defaults, imageItem, pollItem, iconItem, embedItem, ...callouts] as any, query) as any;
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
        ),
        iconPickerOpen && createPortal(
          createElement(IconPicker, {
            onInsert: (name: string) => {
              (editor as any).insertInlineContent([{ type: 'tablerIcon', props: { name } }]);
              setIconPickerOpen(false);
              (editor as any).focus();
            },
            onClose: () => setIconPickerOpen(false),
          }),
          document.body
        ),
        bulletIconPickerOpen && createPortal(
          createElement(IconPicker, {
            onInsert: (name: string) => {
              const pos = (editor as any).getTextCursorPosition?.();
              if (pos?.block?.type === 'bulletListItem') {
                (editor as any).updateBlock(pos.block, { props: { bulletStyle: `icon:${name}` } });
                (editor as any).focus();
              }
              setBulletIconPickerOpen(false);
            },
            onClose: () => setBulletIconPickerOpen(false),
          }),
          document.body
        )
      );
    }

    // ── Icon picker component ─────────────────────────────────────────────────

    const ICON_CATEGORIES: { label: string; icons: string[] }[] = [
      { label: 'Comuni', icons: ['heart', 'star', 'thumbs-up', 'thumbs-down', 'bookmark', 'eye', 'search', 'check', 'x', 'plus', 'minus', 'copy', 'share', 'link', 'external-link', 'refresh', 'edit', 'trash', 'download', 'upload'] },
      { label: 'Persone e social', icons: ['user', 'users', 'user-circle', 'mail', 'phone', 'message-circle', 'brand-twitter', 'brand-linkedin', 'brand-instagram', 'brand-github', 'brand-youtube', 'brand-facebook'] },
      { label: 'Navigazione e UI', icons: ['home', 'settings', 'bell', 'menu', 'arrow-up', 'arrow-down', 'arrow-left', 'arrow-right', 'chevron-right', 'chevron-down', 'dots-vertical', 'dots-horizontal', 'layout-dashboard', 'filter', 'sort-ascending', 'sort-descending'] },
      { label: 'Contenuto', icons: ['file', 'folder', 'calendar', 'clock', 'tag', 'flag', 'map-pin', 'chart-bar', 'chart-pie', 'table', 'list', 'quote', 'code', 'terminal'] },
      { label: 'Simboli', icons: ['info-circle', 'alert-triangle', 'alert-circle', 'circle-check', 'circle-x', 'question-mark', 'lock', 'lock-open', 'bulb', 'rocket', 'flame', 'trophy', 'crown', 'diamond', 'gift'] },
      { label: 'Media', icons: ['photo', 'video', 'music', 'microphone', 'volume', 'camera', 'player-play', 'player-pause', 'player-stop'] },
    ];
    const ALL_ICONS = ICON_CATEGORIES.flatMap((c) => c.icons);

    function IconPicker({ onInsert, onClose }: { onInsert: (name: string) => void; onClose: () => void }) {
      const [query, setQuery] = React.useState('');
      const inputRef = React.useRef<HTMLInputElement>(null);

      React.useEffect(() => { inputRef.current?.focus(); }, []);

      const filtered = query.trim()
        ? ALL_ICONS.filter((n) => n.includes(query.toLowerCase()))
        : null;

      const overlayStyle: React.CSSProperties = {
        position: 'fixed', inset: 0, background: 'rgba(20,10,40,0.35)', zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      };
      const pickerStyle: React.CSSProperties = {
        background: 'white', borderRadius: '12px', padding: '1rem',
        boxShadow: '0 8px 40px rgba(100,70,180,0.18)', width: '480px', maxWidth: '95vw',
        maxHeight: '70vh', display: 'flex', flexDirection: 'column', gap: '0.75rem',
        fontFamily: 'var(--font-sans, sans-serif)',
      };
      const iconBtnStyle: React.CSSProperties = {
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
        padding: '8px 4px', borderRadius: '6px', border: '0.5px solid transparent',
        background: 'transparent', cursor: 'pointer', fontSize: '1.35rem',
        color: '#3b2f5e', transition: 'background 0.1s',
        width: '52px',
      };

      const renderIconGrid = (icons: string[]) =>
        createElement('div', {
          style: { display: 'flex', flexWrap: 'wrap' as const, gap: '4px' },
        }, ...icons.map((name) =>
          createElement('button', {
            key: name,
            type: 'button',
            title: name,
            style: iconBtnStyle,
            onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLButtonElement).style.background = '#f0ecff'; },
            onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; },
            onMouseDown: (e: React.MouseEvent) => { e.preventDefault(); onInsert(name); },
          },
            createElement('i', { className: `ti ti-${name}`, style: { fontSize: '1.4rem' } }),
            createElement('span', { style: { fontSize: '8px', color: '#b0a4d0', lineHeight: 1.2, textAlign: 'center' as const, wordBreak: 'break-all' as const, maxWidth: '44px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const } }, name)
          )
        ));

      return createElement('div', {
        style: overlayStyle,
        onMouseDown: (e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose(); },
      },
        createElement('div', { style: pickerStyle },
          createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '0.5rem' } },
            createElement('i', { className: 'ti ti-icons', style: { fontSize: '1.1rem', color: '#7c55d4' } }),
            createElement('span', { style: { fontWeight: 700, fontSize: '0.85rem', color: '#3b2f5e', flex: 1 } }, 'Inserisci icona'),
            createElement('button', {
              type: 'button',
              onMouseDown: (e: React.MouseEvent) => { e.preventDefault(); onClose(); },
              style: { background: 'transparent', border: 'none', cursor: 'pointer', color: '#b0a4d0', fontSize: '1rem', padding: '0 4px' },
            }, createElement('i', { className: 'ti ti-x' }))
          ),
          createElement('input', {
            ref: inputRef,
            type: 'text',
            placeholder: 'Cerca icona (es. heart, arrow-right…)',
            value: query,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value),
            onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } },
            style: {
              width: '100%', padding: '7px 12px', border: '0.5px solid #d8d0f0',
              borderRadius: '6px', fontSize: '0.85rem', fontFamily: 'inherit',
              color: '#1a1330', outline: 'none', boxSizing: 'border-box' as const,
            },
          }),
          createElement('div', { style: { overflowY: 'auto' as const, flex: 1, display: 'flex', flexDirection: 'column' as const, gap: '0.75rem' } },
            filtered !== null
              ? (filtered.length > 0
                  ? renderIconGrid(filtered)
                  : createElement('p', { style: { fontSize: '0.8rem', color: '#b0a4d0', margin: 0 } }, 'Nessuna icona trovata. Prova un altro nome.')
                )
              : ICON_CATEGORIES.map(({ label, icons }) =>
                  createElement('div', { key: label },
                    createElement('p', { style: { fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: '#b0a4d0', margin: '0 0 6px' } }, label),
                    renderIconGrid(icons)
                  )
                )
          )
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
        onReadySetFontSizeFnCb: (fn: (size: string | null) => void) => { setFontSizeFn = fn; },
        onReadySetListStyleFnCb: (fn: (style: string) => void) => { setListStyleFn = fn; },
        onReadySetBulletStyleFnCb: (fn: (style: string) => void) => { setBulletStyleFn = fn; },
        onReadyOpenBulletIconPickerCb: (fn: () => void) => { openBulletIconPickerFn = fn; },
        onCursorBlockTypeChangeCb: (type: string) => { cursorBlockType = type; },
        readonlyProp: readonly,
      })
    );
  }

  onMount(() => {
    autoSaveEnabled = sessionStorage.getItem(AUTOSAVE_KEY) !== 'false';
    mountEditor(content);
  });

  onDestroy(() => {
    rootRef?.unmount();
  });
</script>

<div class="editor-wrap">
  <div class="editor-toolbar">
    <!-- Font size -->
    <div class="toolbar-group">
      <button type="button" class="toolbar-btn font-size-btn" onclick={() => setFontSizeFn?.('small')} title="Testo piccolo">S</button>
      <button type="button" class="toolbar-btn font-size-btn font-size-mid" onclick={() => setFontSizeFn?.(null)} title="Testo normale">M</button>
      <button type="button" class="toolbar-btn font-size-btn font-size-lg" onclick={() => setFontSizeFn?.('large')} title="Testo grande">L</button>
    </div>

    <!-- Numbered list style — only visible when cursor is in a numbered list -->
    {#if cursorBlockType === 'numberedListItem'}
      <div class="toolbar-sep"></div>
      <div class="toolbar-group">
        {#each [['↺','auto','Auto (default per livello)'],['1','decimal','1, 2, 3'],['a','lower-alpha','a, b, c'],['A','upper-alpha','A, B, C'],['i','lower-roman','i, ii, iii'],['I','upper-roman','I, II, III']] as [lbl, style, title]}
          <button type="button" class="toolbar-btn list-style-btn" onclick={() => setListStyleFn?.(style)} title="Lista: {title}">{lbl}</button>
        {/each}
      </div>
    {/if}

    <!-- Bullet list style — only visible when cursor is in a bullet list -->
    {#if cursorBlockType === 'bulletListItem'}
      <div class="toolbar-sep"></div>
      <div class="toolbar-group">
        {#each BULLET_OPTIONS as opt}
          <button type="button" class="toolbar-btn bullet-style-btn" onclick={() => setBulletStyleFn?.(opt.value)} title={opt.title}>{opt.char}</button>
        {/each}
      </div>
      <button
        type="button"
        class="toolbar-btn"
        onclick={() => openBulletIconPickerFn?.()}
        title="Icona come bullet"
      ><i class="ti ti-icons"></i></button>
    {/if}

    <div class="toolbar-sep"></div>

    <!-- Footnote -->
    <button
      type="button"
      class="toolbar-btn footnote-btn"
      onclick={() => insertFootnoteFn?.()}
      title="Inserisci nota a piè di pagina"
    ><i class="ti ti-superscript"></i></button>

    <!-- Source HTML -->
    <button
      type="button"
      class="toolbar-btn source-toggle"
      class:active={showSource}
      onclick={() => {
        if (!showSource) { sourceValue = content; showSource = true; }
        else { applySource(); }
      }}
      title="Mostra/modifica HTML sorgente"
    ><i class="ti ti-code"></i></button>

    {#if onSave}
      <div class="toolbar-sep"></div>
      <button
        type="button"
        class="toolbar-btn autosave-btn"
        class:active={autoSaveEnabled}
        onclick={() => {
          autoSaveEnabled = !autoSaveEnabled;
          sessionStorage.setItem(AUTOSAVE_KEY, autoSaveEnabled ? 'true' : 'false');
        }}
        title={autoSaveEnabled ? 'Auto-save ON — ogni 60s (clicca per disattivare)' : 'Auto-save OFF (clicca per attivare)'}
      ><i class="ti ti-clock"></i></button>
      {#if lastAutoSaveTime}
        <span class="autosave-time">{lastAutoSaveTime}</span>
      {/if}
      <button
        type="button"
        class="toolbar-btn save-btn"
        onclick={() => { onSave?.(); lastSavedContent = content; }}
        title="Salva"
      ><i class="ti ti-device-floppy"></i></button>
    {/if}
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
    background: white;
    /* No overflow:hidden — toolbar needs to be sticky */
  }

  .editor-toolbar {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-2) var(--space-3);
    border-bottom: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    background: var(--color-nebbia);
    /* Sticky: sticks just below the navbar (60px) */
    position: sticky;
    top: 60px;
    z-index: 20;
  }

  .toolbar-group {
    display: inline-flex;
    align-items: center;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .toolbar-sep {
    width: 1px;
    height: 18px;
    background: var(--color-bordo);
    margin: 0 var(--space-1);
    flex-shrink: 0;
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

  /* Font size buttons inside the group — no individual border */
  .toolbar-group .font-size-btn {
    border: none;
    border-radius: 0;
    border-right: 0.5px solid var(--color-bordo);
    height: 28px;
    padding: 0 10px;
  }
  .toolbar-group .font-size-btn:last-child { border-right: none; }
  .font-size-btn         { font-size: 11px; }
  .font-size-mid         { font-size: 13px; }
  .font-size-lg          { font-size: 15px; font-weight: 600; }

  .footnote-btn { font-size: 0.95rem; color: var(--color-viola); }

  .save-btn { color: var(--color-viola); font-size: 1rem; }
  .save-btn:hover { background: var(--color-iris); }

  .autosave-btn { font-size: 0.95rem; color: var(--color-lilla); }
  .autosave-btn.active { color: var(--color-viola); }
  .autosave-time {
    font-size: 10px;
    color: var(--color-lilla);
    white-space: nowrap;
    padding: 0 2px;
  }

  /* In-editor font size marks */
  :global(.bn-font-size-small) { font-size: 0.8em; }
  :global(.bn-font-size-large) { font-size: 1.25em; }

  .list-style-btn { font-family: monospace; font-size: 11px; }
  .bullet-style-btn { font-size: 1rem; line-height: 1; }

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

  /* Resize handle — visibile al hover del blocco immagine */
  :global([data-img-pos]:hover .img-resize-handle) {
    opacity: 1 !important;
  }

  /* Embed block in-editor float layout */
  :global(.bn-editor .bn-block-outer:has([data-embed-pos="float-right"])) {
    float: right;
    width: 42%;
    margin: 0.25rem 0 0.5rem 1rem;
  }
  :global(.bn-editor .bn-block-outer:has([data-embed-pos="float-left"])) {
    float: left;
    width: 42%;
    margin: 0.25rem 1rem 0.5rem 0;
  }
  :global(.bn-editor .bn-block-outer:has([data-embed-pos="center"])) {
    float: none;
    width: 70%;
    margin: 0.5rem auto;
    clear: both;
  }
  :global(.bn-editor .bn-block-outer:has([data-embed-pos="full"])) {
    float: none;
    width: 100%;
    clear: both;
  }
  :global([data-embed-pos]:hover .embed-resize-handle) {
    opacity: 1 !important;
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
