import React from 'react';
import { createReactBlockSpec } from '@blocknote/react';

// ── Position config ───────────────────────────────────────────────────────────

const POSITIONS = {
  full:          { label: '↔ Intera',    float: 'none',  width: '100%' },
  center:        { label: '⊡ Centro',    float: 'none',  width: '70%'  },
  'float-right': { label: '→ Destra',    float: 'right', width: '42%'  },
  'float-left':  { label: '← Sinistra',  float: 'left',  width: '42%'  },
} as const;

type Position = keyof typeof POSITIONS;
type UploadFn = (file: File) => Promise<string>;

// ── Block spec factory ────────────────────────────────────────────────────────

export const imageBlockSpec = (uploadFile?: UploadFn) =>
  createReactBlockSpec(
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
        const [localCaption, setLocalCaption] = React.useState(caption);
        const [uploading, setUploading]       = React.useState(false);
        const [uploadKey, setUploadKey]       = React.useState(0); // reset input after each upload

        React.useEffect(() => { setLocalCaption(caption); }, [caption]);

        const btnBase: React.CSSProperties = {
          padding: '1px 8px', borderRadius: '4px', cursor: 'pointer',
          fontSize: '0.7rem', lineHeight: 1.4, fontFamily: 'inherit',
          border: '0.5px solid #d8d0f0',
        };

        async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
          const file = e.target.files?.[0];
          if (!file || !uploadFile) return;
          setUploading(true);
          try {
            const uploadedUrl = await uploadFile(file);
            editor.updateBlock(block, { props: { url: uploadedUrl } });
          } catch {
            // Errors (toast) are handled inside uploadFile
          } finally {
            setUploading(false);
            setUploadKey(k => k + 1); // reset <input> so same file can be re-selected
          }
        }

        return (
          <div contentEditable={false} data-img-pos={position} style={{ userSelect: 'none', margin: '0.25rem 0' }}>

            {/* Position controls + replace button */}
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

              {url && uploadFile && (
                <>
                  <span style={{ color: '#d8d0f0', opacity: 0.8 }}>|</span>
                  <label style={{ ...btnBase, color: '#7c55d4', background: 'transparent', cursor: 'pointer', display: 'inline-block' }}>
                    ✎ Sostituisci
                    <input
                      key={uploadKey}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleFileSelect}
                    />
                  </label>
                </>
              )}
            </div>

            {/* Upload in progress */}
            {uploading && (
              <div style={{
                padding: '2rem', textAlign: 'center',
                border: '1px dashed #d8d0f0', borderRadius: '8px',
                color: '#8e82b0', fontSize: '0.85rem',
              }}>
                ⏳ Caricamento in corso…
              </div>
            )}

            {/* Image preview */}
            {url && !uploading && (
              <div style={{ width: '100%' }}>
                <img
                  src={url}
                  alt={caption || ''}
                  style={{ width: '100%', borderRadius: '8px', display: 'block' }}
                  draggable={false}
                />
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

            {/* Empty state — file picker */}
            {!url && !uploading && (
              <label style={{
                display: 'block', padding: '2rem', textAlign: 'center',
                border: '1px dashed #d8d0f0', borderRadius: '8px',
                color: '#b0a4d0', fontSize: '0.85rem',
                cursor: uploadFile ? 'pointer' : 'default',
              }}>
                🖼 {uploadFile ? 'Clicca per caricare un\'immagine' : 'Upload non disponibile'}
                {uploadFile && (
                  <input
                    key={uploadKey}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                  />
                )}
              </label>
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
        const img = element.querySelector('img');
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
