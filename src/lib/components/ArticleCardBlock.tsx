import React from 'react';
import { createReactBlockSpec } from '@blocknote/react';
import { base } from '$app/paths';

// ── Types ─────────────────────────────────────────────────────────────────────

type ArticleSearchResult = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
};

// ── Styles ────────────────────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  background: 'transparent',
  border: '0.5px solid #d8d0f0',
  borderRadius: '6px',
  outline: 'none',
  padding: '5px 10px',
  fontSize: '0.85rem',
  fontFamily: 'inherit',
  color: '#1a1330',
  boxSizing: 'border-box',
};

const btnBase: React.CSSProperties = {
  padding: '2px 10px',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '0.72rem',
  fontFamily: 'inherit',
  border: '0.5px solid #d8d0f0',
  background: 'transparent',
  color: '#3b2f5e',
  lineHeight: 1.5,
};

// ── Internal article search ────────────────────────────────────────────────────

function ArticleSearch({ onSelect, onCancel }: {
  onSelect: (article: ArticleSearchResult) => void;
  onCancel: () => void;
}) {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<ArticleSearchResult[] | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!query.trim()) { setResults(null); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${base}/api/articles/search?q=${encodeURIComponent(query)}`);
        setResults(res.ok ? await res.json() : []);
      } catch { setResults([]); } finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Cerca articolo per titolo…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          style={{ ...inputBase, flex: 1 }}
        />
        <button type="button" onMouseDown={(e) => { e.preventDefault(); onCancel(); }}
          style={{ ...btnBase, padding: '4px 10px', color: '#b0a4d0' }}>
          Annulla
        </button>
      </div>
      {query.trim() && (
        <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {loading && (
            <span style={{ fontSize: '0.78rem', color: '#b0a4d0', padding: '0.5rem 0' }}>Ricerca…</span>
          )}
          {!loading && results?.length === 0 && (
            <span style={{ fontSize: '0.78rem', color: '#b0a4d0', padding: '0.5rem 0' }}>Nessun articolo trovato.</span>
          )}
          {results?.map((a) => (
            <button
              key={a.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onSelect(a); }}
              style={{
                display: 'flex', gap: '0.5rem', alignItems: 'center', textAlign: 'left',
                padding: '7px 10px', borderRadius: '6px', border: '0.5px solid #e8e0f8',
                background: 'white', cursor: 'pointer', fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f5f0ff'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'white'; }}
            >
              {a.coverImage && (
                <img src={a.coverImage} alt="" style={{ width: '48px', height: '32px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1a1330', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.title}
                </div>
                {a.excerpt && (
                  <div style={{ fontSize: '0.7rem', color: '#b0a4d0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.excerpt}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── External URL input ────────────────────────────────────────────────────────

function ExternalUrlInput({ onFetch, onCancel }: {
  onFetch: (data: { url: string; title: string; description: string; image: string; siteName: string }) => void;
  onCancel: () => void;
}) {
  const [url, setUrl] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');

  async function fetchOg() {
    const trimmed = url.trim();
    if (!trimmed) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${base}/api/og-scrape?url=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const data = await res.json();
        onFetch({ url: trimmed, title: data.title || '', description: data.description || '', image: data.image || '', siteName: data.siteName || '' });
      } else {
        setErrorMsg('Impossibile recuperare i dati dalla URL.');
      }
    } catch {
      setErrorMsg('Errore di rete.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
        <input
          type="url"
          placeholder="https://esempio.com/articolo"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); fetchOg(); } }}
          autoFocus
          style={{ ...inputBase, flex: 1 }}
        />
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); fetchOg(); }}
          disabled={loading}
          style={{ ...btnBase, padding: '4px 12px', color: '#7c55d4', border: '0.5px solid #c9b8f0' }}
        >
          {loading ? '…' : 'Carica'}
        </button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); onCancel(); }}
          style={{ ...btnBase, padding: '4px 10px', color: '#b0a4d0' }}>
          Annulla
        </button>
      </div>
      {errorMsg && (
        <span style={{ fontSize: '0.75rem', color: '#c0392b' }}>{errorMsg}</span>
      )}
    </div>
  );
}

// ── Block spec ────────────────────────────────────────────────────────────────

export const articleCardBlockSpec = createReactBlockSpec(
  {
    type: 'articleCard' as const,
    propSchema: {
      cardType: { default: 'internal' as string },   // 'internal' | 'external'
      url: { default: '' as string },                 // slug (internal) or full URL (external)
      position: { default: 'center' as string },     // 'left'|'center'|'right'|'full'
      intTitle: { default: '' as string },            // frozen title for editor display only
      extTitle: { default: '' as string },
      extDescription: { default: '' as string },
      extImage: { default: '' as string },
      extSiteName: { default: '' as string },
    },
    content: 'none' as const,
  },
  {
    render: ({ block, editor }) => {
      const { cardType, url, position, intTitle, extTitle, extDescription, extImage, extSiteName } = block.props;

      // 'pick' = type chooser; 'search' = internal search; 'ext' = external URL input; null = card preview
      const [mode, setMode] = React.useState<'pick' | 'search' | 'ext' | null>(
        () => (url ? null : 'pick'),
      );

      function updatePosition(pos: string) {
        editor.updateBlock(block, { props: { position: pos } as any });
      }

      function selectInternal(article: ArticleSearchResult) {
        editor.updateBlock(block, {
          props: { cardType: 'internal', url: article.slug, intTitle: article.title } as any,
        });
        setMode(null);
      }

      function selectExternal(data: { url: string; title: string; description: string; image: string; siteName: string }) {
        editor.updateBlock(block, {
          props: {
            cardType: 'external',
            url: data.url,
            extTitle: data.title,
            extDescription: data.description,
            extImage: data.image,
            extSiteName: data.siteName,
          } as any,
        });
        setMode(null);
      }

      const positionLabels: Record<string, string> = {
        left: 'Sinistra', center: 'Centro', right: 'Destra', full: 'Piena',
      };

      return (
        <div
          contentEditable={false}
          style={{
            border: '1px dashed #c9b8f0',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            margin: '0.25rem 0',
            background: '#fdfcff',
            userSelect: 'none',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.7rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em', color: '#7c55d4', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <i className="ti ti-bookmark" style={{ fontSize: '0.9rem' }}></i> Link articolo
            </span>
            {url && (
              <span style={{ fontSize: '0.65rem', color: '#b0a4d0', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px', whiteSpace: 'nowrap', flex: 1 }}>
                {cardType === 'internal' ? `/${url}` : url}
              </span>
            )}
            {url && mode === null && (
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); setMode('pick'); }}
                style={{ ...btnBase, marginLeft: 'auto', padding: '1px 8px', fontSize: '0.65rem', color: '#b0a4d0', flexShrink: 0 }}
              >
                Cambia
              </button>
            )}
          </div>

          {/* Mode: type chooser */}
          {mode === 'pick' && (
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', padding: '0.5rem 0' }}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); setMode('search'); }}
                style={{ ...btnBase, padding: '8px 18px', fontSize: '0.82rem', border: '0.5px solid #c9b8f0', color: '#7c55d4', fontWeight: 600 }}
              >
                <i className="ti ti-search" style={{ fontSize: '0.95rem' }}></i> Articolo interno
              </button>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); setMode('ext'); }}
                style={{ ...btnBase, padding: '8px 18px', fontSize: '0.82rem', border: '0.5px solid #c9b8f0', color: '#3b2f5e', fontWeight: 600 }}
              >
                <i className="ti ti-external-link" style={{ fontSize: '0.95rem' }}></i> URL esterno
              </button>
            </div>
          )}

          {/* Mode: internal search */}
          {mode === 'search' && (
            <ArticleSearch onSelect={selectInternal} onCancel={() => setMode('pick')} />
          )}

          {/* Mode: external URL */}
          {mode === 'ext' && (
            <ExternalUrlInput onFetch={selectExternal} onCancel={() => setMode('pick')} />
          )}

          {/* Mode: card preview */}
          {mode === null && url && (
            <>
              <div style={{
                border: '0.5px solid #e8e0f8',
                borderRadius: '8px',
                overflow: 'hidden',
                marginBottom: '0.7rem',
                display: 'flex',
                gap: 0,
              }}>
                {cardType === 'external' && extImage && (
                  <img src={extImage} alt="" style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} />
                )}
                <div style={{ padding: '0.6rem 0.8rem' }}>
                  {cardType === 'external' && extSiteName && (
                    <div style={{ fontSize: '0.62rem', color: '#b0a4d0', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {extSiteName}
                    </div>
                  )}
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1a1330', lineHeight: 1.3, marginBottom: '0.2rem' }}>
                    {cardType === 'internal' ? (intTitle || url) : (extTitle || url)}
                  </div>
                  {cardType === 'external' && extDescription && (
                    <div style={{ fontSize: '0.75rem', color: '#6b5c8a', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {extDescription}
                    </div>
                  )}
                  <div style={{ fontSize: '0.65rem', color: '#b0a4d0', marginTop: '0.3rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                    {cardType === 'internal'
                      ? <><i className="ti ti-arrow-right"></i> Articolo interno</>
                      : <><i className="ti ti-external-link"></i> Link esterno</>
                    }
                  </div>
                </div>
              </div>

              {/* Position selector */}
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#b0a4d0', lineHeight: 2 }}>Posizione:</span>
                {(['left', 'center', 'right', 'full'] as const).map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); updatePosition(pos); }}
                    style={{
                      ...btnBase,
                      background: position === pos ? '#d8d0f0' : 'transparent',
                      fontWeight: position === pos ? 700 : 400,
                      border: position === pos ? '0.5px solid #b0a0e0' : '0.5px solid #d8d0f0',
                    }}
                  >
                    {positionLabels[pos]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      );
    },

    // ── HTML export (saved to DB) ──────────────────────────────────────────────
    toExternalHTML: ({ block }) => {
      const { cardType, url, position, extTitle, extDescription, extImage, extSiteName } = block.props;
      if (!url) return <div />;

      const attrs: Record<string, string> = {
        'data-type': cardType || 'internal',
        'data-url': url,
        'data-position': position || 'center',
      };
      if (cardType === 'external') {
        if (extTitle) attrs['data-ext-title'] = extTitle;
        if (extDescription) attrs['data-ext-description'] = extDescription;
        if (extImage) attrs['data-ext-image'] = extImage;
        if (extSiteName) attrs['data-ext-site-name'] = extSiteName;
      }

      return <div className="article-card-embed" {...attrs} />;
    },

    parse: (element) => {
      if (!(element instanceof HTMLElement)) return undefined;
      if (!element.classList.contains('article-card-embed')) return undefined;
      return {
        cardType: element.getAttribute('data-type') || 'internal',
        url: element.getAttribute('data-url') || '',
        position: element.getAttribute('data-position') || 'center',
        intTitle: '',
        extTitle: element.getAttribute('data-ext-title') || '',
        extDescription: element.getAttribute('data-ext-description') || '',
        extImage: element.getAttribute('data-ext-image') || '',
        extSiteName: element.getAttribute('data-ext-site-name') || '',
      };
    },
  },
);
