import React from 'react';
import { createReactBlockSpec } from '@blocknote/react';

// ── Position config ───────────────────────────────────────────────────────────

const POSITIONS = {
  full:         { label: '↔ Intera',   float: 'none',  width: '100%'    },
  center:       { label: '⊡ Centro',   float: 'none',  width: '70%'     },
  'float-right':{ label: '→ Destra',   float: 'right', width: '42%'     },
  'float-left': { label: '← Sinistra', float: 'left',  width: '42%'     },
} as const;

type Position = keyof typeof POSITIONS;

// ── Block spec ────────────────────────────────────────────────────────────────

export const imageBlockSpec = createReactBlockSpec(
  {
    type: 'image' as const,
    propSchema: {
      url:      { default: '' as string },
      caption:  { default: '' as string },
      position: { default: 'full' as Position, values: ['full', 'center', 'float-right', 'float-left'] as const },
    },
    content: 'none' as const,
  },
  {
    // ── Editor rendering ────────────────────────────────────────────────────
    render: ({ block, editor }) => {
      const { url, caption, position } = block.props;
      const [localUrl, setLocalUrl]         = React.useState(url);
      const [localCaption, setLocalCaption] = React.useState(caption);
      const [editingUrl, setEditingUrl]     = React.useState(!url);
      React.useEffect(() => { setLocalUrl(url); setEditingUrl(!url); }, [url]);
      React.useEffect(() => { setLocalCaption(caption); }, [caption]);

      const btnBase: React.CSSProperties = {
        padding: '1px 8px', borderRadius: '4px', cursor: 'pointer',
        fontSize: '0.7rem', lineHeight: 1.4, fontFamily: 'inherit',
        border: '0.5px solid #d8d0f0',
      };

      const confirmUrl = () => {
        const trimmed = localUrl.trim();
        if (trimmed) editor.updateBlock(block, { props: { url: trimmed } });
        setEditingUrl(false);
      };

      return (
        <div contentEditable={false} data-img-pos={position} style={{ userSelect: 'none', margin: '0.25rem 0' }}>
          {/* Controls */}
          <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {(Object.keys(POSITIONS) as Position[]).map(k => (
              <button
                key={k}
                type="button"
                onMouseDown={e => { e.preventDefault(); editor.updateBlock(block, { props: { position: k } }); }}
                style={{
                  ...btnBase,
                  background: position === k ? '#d8d0f0' : 'transparent',
                  color: '#3b2f5e',
                  fontWeight: position === k ? 700 : 400,
                }}
              >
                {POSITIONS[k].label}
              </button>
            ))}
            {url && (
              <>
                <span style={{ color: '#d8d0f0', opacity: 0.8 }}>|</span>
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); setEditingUrl(true); }}
                  style={{ ...btnBase, color: '#7c55d4', background: 'transparent', border: '0.5px solid #d8d0f0' }}
                >
                  ✎ URL
                </button>
              </>
            )}
          </div>

          {/* URL input */}
          {editingUrl && (
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <input
                type="url"
                value={localUrl}
                onChange={e => setLocalUrl(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); confirmUrl(); }
                  if (e.key === 'Escape') { setEditingUrl(false); setLocalUrl(url); }
                }}
                placeholder="https://..."
                autoFocus
                style={{
                  flex: 1, padding: '5px 10px', borderRadius: '6px',
                  border: '0.5px solid #d8d0f0', fontSize: '0.8rem',
                  fontFamily: 'inherit', outline: 'none', color: '#3b2f5e',
                }}
              />
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); confirmUrl(); }}
                style={{
                  ...btnBase, padding: '5px 12px',
                  background: '#7c55d4', color: 'white', border: 'none', fontWeight: 500,
                }}
              >
                OK
              </button>
            </div>
          )}

          {/* Preview — float/width applied to .bn-block-outer via useEffect */}
          {url && !editingUrl && (
            <div style={{ width: '100%' }}>
              <img
                src={url}
                alt={caption || ''}
                style={{ width: '100%', borderRadius: '8px', display: 'block' }}
                draggable={false}
              />
              {/* Caption */}
              <input
                type="text"
                value={localCaption}
                onChange={e => setLocalCaption(e.target.value)}
                onBlur={e => editor.updateBlock(block, { props: { caption: e.target.value } })}
                placeholder="Didascalia (opzionale)"
                style={{
                  display: 'block', width: '100%', marginTop: '0.3rem',
                  background: 'transparent', border: 'none', outline: 'none',
                  textAlign: 'center', fontSize: '0.8rem', fontStyle: 'italic',
                  color: '#8e82b0', fontFamily: 'inherit',
                }}
              />
            </div>
          )}

          {/* Empty state */}
          {!url && !editingUrl && (
            <div
              onMouseDown={e => { e.preventDefault(); setEditingUrl(true); }}
              style={{
                padding: '2rem', textAlign: 'center', border: '1px dashed #d8d0f0',
                borderRadius: '8px', color: '#b0a4d0', fontSize: '0.85rem', cursor: 'pointer',
              }}
            >
              🖼 Clicca per aggiungere un'immagine
            </div>
          )}
        </div>
      );
    },

    // ── HTML export (saved to DB) ─────────────────────────────────────────────
    toExternalHTML: ({ block }) => {
      const { url, caption, position } = block.props;
      if (!url) return <div></div>;

      return (
        <figure className={`image ${position}`}>
          <img src={url} alt={caption || ''} />
          {caption && <figcaption>{caption}</figcaption>}
        </figure>
      );
    },

    // ── HTML parsing (loading saved content) ─────────────────────────────────
    parse: (element) => {
      if (!(element instanceof HTMLElement)) return undefined;
      if (!element.classList.contains('image')) return undefined;
      const img      = element.querySelector('img');
      if (!img) return undefined;
      const url      = img.getAttribute('src') || '';
      const caption  = element.querySelector('figcaption')?.textContent?.trim() || img.getAttribute('alt') || '';
      const position = (
        ['float-right', 'float-left', 'center', 'full'] as Position[]
      ).find(p => element.classList.contains(p)) ?? 'full';
      return { url, caption, position };
    },
  }
);
