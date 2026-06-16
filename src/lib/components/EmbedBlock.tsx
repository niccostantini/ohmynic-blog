import React from 'react';
import { createReactBlockSpec } from '@blocknote/react';

const POSITIONS = {
  full:          { label: '↔ Intera',    defaultWidth: 100 },
  center:        { label: '⊡ Centro',    defaultWidth: 70  },
  'float-right': { label: '→ Destra',    defaultWidth: 42  },
  'float-left':  { label: '← Sinistra',  defaultWidth: 42  },
} as const;
type Position = keyof typeof POSITIONS;

type ServiceInfo = {
  service: string;
  embedUrl: string;
  label: string;
  icon: string;
  height: number | null; // null = aspect-ratio 16/9
};

function detectEmbed(raw: string): ServiceInfo | null {
  try {
    const url = new URL(raw.trim());
    const host = url.hostname.replace(/^www\./, '');

    // YouTube
    if (host === 'youtube.com' || host === 'youtu.be') {
      let videoId: string | null = null;
      if (host === 'youtu.be') {
        videoId = url.pathname.slice(1).split('?')[0];
      } else {
        videoId = url.searchParams.get('v');
        if (!videoId && url.pathname.startsWith('/embed/')) {
          videoId = url.pathname.replace('/embed/', '');
        }
      }
      if (!videoId) return null;
      return {
        service: 'youtube',
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
        label: 'Video YouTube',
        icon: 'brand-youtube',
        height: null,
      };
    }

    // Spotify
    if (host === 'open.spotify.com') {
      const parts = url.pathname.split('/').filter(Boolean);
      const type = parts[0];
      const embedUrl = `https://open.spotify.com/embed/${parts.join('/')}`;
      const heightMap: Record<string, number> = {
        track: 152, album: 352, playlist: 352, episode: 232, show: 232,
      };
      const labelMap: Record<string, string> = {
        track: 'Brano Spotify', album: 'Album Spotify', playlist: 'Playlist Spotify',
        episode: 'Episodio Podcast', show: 'Podcast Spotify',
      };
      return {
        service: 'spotify',
        embedUrl,
        label: labelMap[type] ?? 'Player Spotify',
        icon: 'brand-spotify',
        height: heightMap[type] ?? 152,
      };
    }

    // GitHub Gist
    if (host === 'gist.github.com') {
      const clean = raw.trim().split('?')[0].replace(/\/$/, '');
      return {
        service: 'gist',
        embedUrl: clean + '.pibb',
        label: 'GitHub Gist',
        icon: 'brand-github',
        height: 300,
      };
    }

    // Codepen
    if (host === 'codepen.io') {
      return {
        service: 'codepen',
        embedUrl: url.href.replace('/pen/', '/embed/'),
        label: 'Pen su Codepen',
        icon: 'brand-codepen',
        height: 400,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export const embedBlockSpec = createReactBlockSpec(
    {
      type: 'embed' as const,
      propSchema: {
        url:      { default: '' as string },
        service:  { default: '' as string },
        embedUrl: { default: '' as string },
        label:    { default: '' as string },
        icon:     { default: '' as string },
        position: {
          default: 'full' as Position,
          values: ['full', 'center', 'float-right', 'float-left'] as const,
        },
        width:  { default: '100' as string },
        height: { default: '' as string }, // '' = aspect-ratio 16/9, otherwise px
      },
      content: 'none' as const,
    },
    {
      // ── Editor rendering ──────────────────────────────────────────────────────
      render: ({ block, editor }) => {
        const { service, embedUrl, label, icon, position } = block.props;
        const width = Number(block.props.width) || 100;
        const height = block.props.height ? Number(block.props.height) : null;

        const [inputUrl, setInputUrl] = React.useState('');
        const [error, setError] = React.useState('');
        const containerRef = React.useRef<HTMLDivElement>(null);

        function applyUrl(raw: string) {
          const info = detectEmbed(raw);
          if (!info) {
            setError('URL non riconosciuto. Supportati: YouTube, Spotify, GitHub Gist, Codepen.');
            return;
          }
          editor.updateBlock(block, {
            props: {
              url: raw.trim(),
              service: info.service,
              embedUrl: info.embedUrl,
              label: info.label,
              icon: info.icon,
              height: info.height !== null ? String(info.height) : '',
            },
          });
        }

        function startResize(e: React.MouseEvent) {
          e.preventDefault();
          e.stopPropagation();
          const startX = e.clientX;
          const startW = width;
          const refWidth = containerRef.current?.offsetWidth ?? 500;
          function onMove(ev: MouseEvent) {
            const delta = ev.clientX - startX;
            const newW = Math.min(100, Math.max(20, Math.round(startW + (delta / refWidth) * 100)));
            editor.updateBlock(block, { props: { width: String(newW) } });
          }
          function onUp() {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
          }
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
        }

        const btnBase: React.CSSProperties = {
          padding: '1px 8px', borderRadius: '4px', cursor: 'pointer',
          fontSize: '0.7rem', lineHeight: 1.4, fontFamily: 'inherit',
          border: '0.5px solid #d8d0f0',
        };

        // ── Empty state: URL input ────────────────────────────────────────────
        if (!embedUrl) {
          return (
            <div ref={containerRef} contentEditable={false} style={{ userSelect: 'none', margin: '0.25rem 0' }}>
              <div style={{
                border: '1px dashed #d8d0f0', borderRadius: '8px',
                padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '0.5rem',
              }}>
                <i className="ti ti-link" style={{ fontSize: '1.5rem', color: '#b0a4d0' }} />
                <p style={{ fontSize: '0.8rem', color: '#b0a4d0', margin: 0 }}>
                  YouTube · Spotify · GitHub Gist · Codepen
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '420px' }}>
                  <input
                    type="text"
                    value={inputUrl}
                    onChange={e => { setInputUrl(e.target.value); setError(''); }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); applyUrl(inputUrl); }
                    }}
                    placeholder="Incolla un link e premi Invio…"
                    style={{
                      flex: 1, padding: '6px 10px', border: '0.5px solid #d8d0f0',
                      borderRadius: '6px', fontSize: '0.82rem', fontFamily: 'inherit',
                      outline: 'none', color: '#3b2f5e', boxSizing: 'border-box' as const,
                    }}
                  />
                  <button
                    type="button"
                    onMouseDown={e => { e.preventDefault(); applyUrl(inputUrl); }}
                    style={{ ...btnBase, background: '#7c55d4', color: 'white', border: 'none', padding: '6px 14px' }}
                  >
                    Embed
                  </button>
                </div>
                {error && <p style={{ fontSize: '0.75rem', color: '#c0392b', margin: 0 }}>{error}</p>}
              </div>
            </div>
          );
        }

        // ── Loaded state: controls + iframe ──────────────────────────────────
        const iframeWrapStyle: React.CSSProperties = {
          position: 'relative',
          width: `${width}%`,
          ...(position !== 'float-right' && position !== 'float-left' && width < 100
            ? { marginLeft: 'auto', marginRight: 'auto' }
            : {}),
        };

        const iframeStyle: React.CSSProperties = {
          width: '100%',
          border: 'none',
          borderRadius: '8px',
          display: 'block',
          ...(height === null
            ? { aspectRatio: '16/9', height: 'auto' }
            : { height: `${height}px` }),
        };

        return (
          <div
            ref={containerRef}
            contentEditable={false}
            data-embed-pos={position}
            style={{ userSelect: 'none', margin: '0.25rem 0' }}
          >
            {/* Position + reset controls */}
            <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.5rem', flexWrap: 'wrap' as const, alignItems: 'center' }}>
              {(Object.keys(POSITIONS) as Position[]).map(k => (
                <button
                  key={k}
                  type="button"
                  onMouseDown={e => {
                    e.preventDefault();
                    editor.updateBlock(block, {
                      props: { position: k, width: String(POSITIONS[k].defaultWidth) },
                    });
                  }}
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

              <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: '#b0a4d0', fontFamily: 'monospace' }}>
                {width}%
              </span>
              <span style={{ color: '#d8d0f0' }}>|</span>

              <span style={{ fontSize: '0.68rem', color: '#8e82b0' }}>
                <i className={`ti ti-${icon || 'link'}`} /> {label}
              </span>
              <span style={{ color: '#d8d0f0' }}>|</span>

              <button
                type="button"
                onMouseDown={e => {
                  e.preventDefault();
                  editor.updateBlock(block, {
                    props: { url: '', service: '', embedUrl: '', label: '', icon: '', height: '' },
                  });
                }}
                style={{ ...btnBase, color: '#c0392b', background: 'transparent' }}
              >
                <i className="ti ti-x" /> Rimuovi
              </button>
            </div>

            {/* Iframe + drag resize handle */}
            <div style={iframeWrapStyle}>
              <iframe
                src={embedUrl}
                style={iframeStyle}
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                loading="lazy"
              />

              <div
                onMouseDown={startResize}
                className="embed-resize-handle"
                style={{
                  position: 'absolute', right: -8, top: 0, bottom: 0, width: 16,
                  cursor: 'ew-resize', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', zIndex: 10, opacity: 0,
                  transition: 'opacity 0.15s',
                }}
              >
                <div style={{ width: 4, height: 36, background: '#7c55d4', borderRadius: 2, boxShadow: '0 0 0 2px white' }} />
              </div>
            </div>
          </div>
        );
      },

      // ── HTML export (saved to DB, rendered publicly) ──────────────────────────
      toExternalHTML: ({ block }) => {
        const { service, embedUrl, label, icon, position } = block.props;
        const width = Number(block.props.width) || 100;
        const height = block.props.height ? Number(block.props.height) : null;
        if (!embedUrl) return <div />;

        const blockStyle: React.CSSProperties = { width: `${width}%` };
        if (position !== 'float-right' && position !== 'float-left' && width < 100) {
          blockStyle.marginLeft = 'auto';
          blockStyle.marginRight = 'auto';
        }

        const gateStyle: React.CSSProperties = {};
        if (height !== null) gateStyle.height = `${height}px`;

        return (
          <div
            className={`embed-block embed-${service}`}
            data-embed-position={position}
            style={blockStyle}
          >
            <div
              className="embed-gate"
              data-service={service}
              data-embed-url={embedUrl}
              data-embed-height={height !== null ? String(height) : ''}
              style={gateStyle}
            >
              <i className={`ti ti-${icon || 'link'}`} />
              <p>{label || 'Contenuto esterno'}</p>
              <button type="button" className="embed-load-btn">Carica</button>
            </div>
          </div>
        );
      },

      // ── HTML parsing (loading content back from DB) ───────────────────────────
      parse: (el) => {
        if (!(el instanceof HTMLElement)) return undefined;
        if (!el.classList.contains('embed-block')) return undefined;
        const gate = el.querySelector<HTMLElement>('.embed-gate');
        if (!gate) return undefined;
        const position = (el.dataset.embedPosition as Position) || 'full';
        const widthStr = el.style.width;
        const width = widthStr ? parseInt(widthStr) : (POSITIONS[position]?.defaultWidth ?? 100);
        return {
          url: gate.dataset.embedUrl || '',
          service: gate.dataset.service || '',
          embedUrl: gate.dataset.embedUrl || '',
          label: gate.querySelector('p')?.textContent?.trim() || '',
          icon: '',
          position,
          width: String(width),
          height: gate.dataset.embedHeight || '',
        };
      },
    }
  );
