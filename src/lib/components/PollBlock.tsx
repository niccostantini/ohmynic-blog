import React from 'react';
import { createReactBlockSpec } from '@blocknote/react';
import { base } from '$app/paths';

// ── Types ─────────────────────────────────────────────────────────────────────

type PollOption = { id: string; label: string };

type PollListItem = {
  id: string;
  question: string;
  articleTitle: string | null;
  articleSlug: string | null;
  totalVoters: number;
  closed: boolean;
};

function parsedOptions(raw: string): PollOption[] {
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// ── Preview: mounts Poll.svelte inside the React block ────────────────────────

function PollPreview({
  pollId,
  question,
  options,
  allowMultiple,
  closed,
}: {
  pollId: string;
  question: string;
  options: PollOption[];
  allowMultiple: boolean;
  closed: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const instanceRef = React.useRef<any>(null);

  const optionKey = JSON.stringify(options);

  React.useEffect(() => {
    if (!containerRef.current) return;

    import('./Poll.svelte').then(({ default: Poll }) => {
      if (!containerRef.current) return;
      if (instanceRef.current) {
        import('svelte').then(({ unmount }) => unmount(instanceRef.current));
      }
      import('svelte').then(({ mount }) => {
        instanceRef.current = mount(Poll as any, {
          target: containerRef.current!,
          props: {
            pollId: pollId || 'preview',
            question,
            allowMultiple,
            closed,
            reader: null,
            previewMode: true,
            previewOptions: options.map((o, i) => ({ ...o, position: i })),
          },
        });
      });
    });

    return () => {
      if (instanceRef.current) {
        import('svelte').then(({ unmount }) => {
          unmount(instanceRef.current);
          instanceRef.current = null;
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollId, question, optionKey, allowMultiple, closed]);

  return React.createElement('div', { ref: containerRef });
}

// ── Existing-poll browser ─────────────────────────────────────────────────────

function PollBrowser({ onSelect, onCancel }: {
  onSelect: (poll: { id: string; question: string; options: PollOption[]; allowMultiple: boolean; closed: boolean; totalVoters: number }) => void;
  onCancel: () => void;
}) {
  const [polls, setPolls] = React.useState<PollListItem[] | null>(null);
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    fetch(`${base}/api/polls`)
      .then((r) => r.json())
      .then(setPolls)
      .catch(() => setPolls([]));
  }, []);

  const filtered = polls
    ? polls.filter((p) =>
        !query || p.question.toLowerCase().includes(query.toLowerCase()) ||
        (p.articleTitle ?? '').toLowerCase().includes(query.toLowerCase())
      )
    : null;

  async function pick(item: PollListItem) {
    setLoading(true);
    try {
      const res = await fetch(`${base}/api/polls/${item.id}`);
      const data = await res.json();
      onSelect({
        id: data.id,
        question: data.question,
        options: data.options.map((o: any) => ({ id: o.id, label: o.label })),
        allowMultiple: data.allowMultiple,
        closed: data.closed,
        totalVoters: item.totalVoters,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Cerca sondaggio o articolo…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          style={{
            flex: 1,
            background: 'transparent',
            border: '0.5px solid #d8d0f0',
            borderRadius: '6px',
            padding: '5px 10px',
            fontSize: '0.82rem',
            fontFamily: 'inherit',
            color: '#1a1330',
            outline: 'none',
          }}
        />
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); onCancel(); }}
          style={{ padding: '4px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.72rem', fontFamily: 'inherit', border: '0.5px solid #d8d0f0', background: 'transparent', color: '#b0a4d0' }}
        >
          Annulla
        </button>
      </div>

      <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {filtered === null && (
          <span style={{ fontSize: '0.78rem', color: '#b0a4d0', padding: '0.5rem 0' }}>Caricamento…</span>
        )}
        {filtered !== null && filtered.length === 0 && (
          <span style={{ fontSize: '0.78rem', color: '#b0a4d0', padding: '0.5rem 0' }}>Nessun sondaggio trovato.</span>
        )}
        {filtered !== null && filtered.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={loading}
            onMouseDown={(e) => { e.preventDefault(); pick(p); }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              textAlign: 'left',
              padding: '7px 10px',
              borderRadius: '6px',
              border: '0.5px solid #e8e0f8',
              background: loading ? '#faf8ff' : 'white',
              cursor: loading ? 'wait' : 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#f5f0ff'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = loading ? '#faf8ff' : 'white'; }}
          >
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1a1330', lineHeight: 1.3 }}>
              {p.question}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#b0a4d0' }}>
              {p.articleTitle ?? '—'} · {p.totalVoters} vot{p.totalVoters === 1 ? 'o' : 'i'}
              {p.closed ? ' · 🔒' : ''}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

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

const inputBase: React.CSSProperties = {
  width: '100%',
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

// ── Block spec ────────────────────────────────────────────────────────────────

export const pollBlockSpec = createReactBlockSpec(
    {
      type: 'poll' as const,
      propSchema: {
        pollId: { default: '' as string },
        question: { default: 'Qual è la tua risposta?' as string },
        options: { default: '' as string },
        allowMultiple: { default: false },
        closed: { default: false },
      },
      content: 'none' as const,
    },
    {
      // ── Editor rendering ──────────────────────────────────────────────────
      render: ({ block, editor }) => {
        const { pollId, question, allowMultiple, closed } = block.props;
        const options = parsedOptions(block.props.options);

        const [localQuestion, setLocalQuestion] = React.useState(question);
        const [localOptions, setLocalOptions] = React.useState<PollOption[]>(options);
        // 'pick' = show new/existing choice; 'browse' = show existing list; null = editing
        const [mode, setMode] = React.useState<'pick' | 'browse' | null>(
          () => (pollId ? null : 'pick')
        );
        const [votesAtLoad, setVotesAtLoad] = React.useState(0);

        React.useEffect(() => { setLocalQuestion(question); }, [question]);
        React.useEffect(() => { setLocalOptions(parsedOptions(block.props.options)); }, [block.props.options]);

        function initNew() {
          editor.updateBlock(block, {
            props: {
              pollId: crypto.randomUUID(),
              options: JSON.stringify([
                { id: crypto.randomUUID(), label: 'Opzione 1' },
                { id: crypto.randomUUID(), label: 'Opzione 2' },
              ]),
            } as any,
          });
          setMode(null);
        }

        function loadExisting(data: { id: string; question: string; options: PollOption[]; allowMultiple: boolean; closed: boolean; totalVoters: number }) {
          editor.updateBlock(block, {
            props: {
              pollId: data.id,
              question: data.question,
              options: JSON.stringify(data.options),
              allowMultiple: data.allowMultiple,
              closed: data.closed,
            } as any,
          });
          setVotesAtLoad(data.totalVoters);
          setMode(null);
        }

        function syncOptions(updated: PollOption[]) {
          editor.updateBlock(block, { props: { options: JSON.stringify(updated) } });
        }

        function updateOptionLabel(index: number, label: string) {
          const updated = localOptions.map((o, i) => (i === index ? { ...o, label } : o));
          setLocalOptions(updated);
          syncOptions(updated);
        }

        function addOption() {
          const updated = [...localOptions, { id: crypto.randomUUID(), label: `Opzione ${localOptions.length + 1}` }];
          setLocalOptions(updated);
          syncOptions(updated);
        }

        function removeOption(index: number) {
          if (localOptions.length <= 2) return;
          const updated = localOptions.filter((_, i) => i !== index);
          setLocalOptions(updated);
          syncOptions(updated);
        }

        const effectivePollId = pollId || 'preview';

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
                <i className="ti ti-chart-bar" style={{ fontSize: '0.9rem' }}></i> Sondaggio
              </span>
              {pollId && (
                <span style={{ fontSize: '0.65rem', color: '#b0a4d0', fontFamily: 'monospace' }}>
                  {pollId.slice(0, 8)}
                </span>
              )}
            </div>

            {/* ── Mode: pick new or existing ── */}
            {mode === 'pick' && (
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', padding: '0.5rem 0' }}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); initNew(); }}
                  style={{
                    ...btnBase,
                    padding: '8px 18px',
                    fontSize: '0.82rem',
                    border: '0.5px solid #c9b8f0',
                    color: '#7c55d4',
                    fontWeight: 600,
                  }}
                >
                  <i className="ti ti-circle-plus" style={{ fontSize: '0.95rem' }}></i> Nuovo sondaggio
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); setMode('browse'); }}
                  style={{
                    ...btnBase,
                    padding: '8px 18px',
                    fontSize: '0.82rem',
                    border: '0.5px solid #c9b8f0',
                    color: '#3b2f5e',
                    fontWeight: 600,
                  }}
                >
                  <i className="ti ti-search" style={{ fontSize: '0.95rem' }}></i> Usa esistente
                </button>
              </div>
            )}

            {/* ── Mode: browse existing polls ── */}
            {mode === 'browse' && (
              <PollBrowser
                onSelect={loadExisting}
                onCancel={() => setMode('pick')}
              />
            )}

            {/* ── Normal editing mode ── */}
            {mode === null && (
              <>
                {/* Warning: existing poll with votes */}
                {votesAtLoad > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.4rem',
                    background: '#fef9ec',
                    border: '0.5px solid #fac775',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    marginBottom: '0.6rem',
                    fontSize: '0.75rem',
                    color: '#633806',
                    lineHeight: 1.4,
                  }}>
                    <i className="ti ti-alert-triangle" style={{ fontSize: '0.95rem', flexShrink: 0, marginTop: '1px' }}></i>
                    <span>
                      Questo sondaggio ha <strong>{votesAtLoad} {votesAtLoad === 1 ? 'voto' : 'voti'}</strong> — le modifiche si applicano a tutti gli articoli che lo contengono e ai lettori che hanno già votato.
                    </span>
                  </div>
                )}

                {/* Question input */}
                <input
                  type="text"
                  value={localQuestion}
                  onChange={(e) => setLocalQuestion(e.target.value)}
                  onBlur={(e) => editor.updateBlock(block, { props: { question: e.target.value } })}
                  placeholder="Scrivi la domanda…"
                  style={{ ...inputBase, fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.6rem' }}
                />

                {/* Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.6rem' }}>
                  {localOptions.map((opt, i) => (
                    <div key={opt.id} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <span style={{ color: '#b0a4d0', fontSize: '0.75rem', width: '14px', flexShrink: 0 }}>
                        {i + 1}.
                      </span>
                      <input
                        type="text"
                        value={opt.label}
                        onChange={(e) => updateOptionLabel(i, e.target.value)}
                        placeholder={`Opzione ${i + 1}`}
                        style={{ ...inputBase, flex: 1 }}
                      />
                      {localOptions.length > 2 && (
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); removeOption(i); }}
                          style={{ ...btnBase, padding: '2px 7px', color: '#c0392b', border: '0.5px solid #f5c6cb' }}
                          title="Rimuovi opzione"
                        >
                          <i className="ti ti-x"></i>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add option + settings */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); addOption(); }}
                    style={{ ...btnBase, color: '#7c55d4', border: '0.5px solid #d8d0f0' }}
                  >
                    <i className="ti ti-plus"></i> Opzione
                  </button>

                  <span style={{ color: '#d8d0f0', margin: '0 0.1rem' }}>|</span>

                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      editor.updateBlock(block, { props: { allowMultiple: !allowMultiple } });
                    }}
                    style={{
                      ...btnBase,
                      background: allowMultiple ? '#d8d0f0' : 'transparent',
                      fontWeight: allowMultiple ? 700 : 400,
                    }}
                  >
                    {allowMultiple
                      ? <><i className="ti ti-checkbox"></i> Multipla</>
                      : <><i className="ti ti-circle"></i> Singola</>
                    }
                  </button>

                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      editor.updateBlock(block, { props: { closed: !closed } });
                    }}
                    style={{
                      ...btnBase,
                      background: closed ? '#faeeda' : 'transparent',
                      border: closed ? '0.5px solid #fac775' : '0.5px solid #d8d0f0',
                      color: closed ? '#633806' : '#3b2f5e',
                      fontWeight: closed ? 700 : 400,
                    }}
                  >
                    {closed
                      ? <><i className="ti ti-lock"></i> Chiuso</>
                      : <><i className="ti ti-lock-open"></i> Aperto</>
                    }
                  </button>

                  {pollId && (
                    <>
                      <span style={{ color: '#d8d0f0', margin: '0 0.1rem' }}>|</span>
                      <a
                        href={`${base}/api/polls/${pollId}/export`}
                        download
                        style={{ ...btnBase, textDecoration: 'none', display: 'inline-block' }}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <i className="ti ti-download"></i> CSV
                      </a>
                    </>
                  )}
                </div>

                {/* Poll.svelte preview */}
                <div style={{ borderTop: '0.5px solid #e8e0f8', paddingTop: '0.75rem' }}>
                  <PollPreview
                    pollId={effectivePollId}
                    question={localQuestion}
                    options={localOptions}
                    allowMultiple={allowMultiple}
                    closed={closed}
                  />
                </div>
              </>
            )}
          </div>
        );
      },

      // ── HTML export (saved to DB / article content) ───────────────────────
      toExternalHTML: ({ block }) => {
        const { pollId, question } = block.props;
        return (
          <div
            className="poll-embed"
            data-poll-id={pollId}
            data-poll-question={question}
          />
        );
      },

      // ── HTML parsing (loading article back from HTML fallback) ────────────
      parse: (element) => {
        if (!(element instanceof HTMLElement)) return undefined;
        if (!element.classList.contains('poll-embed')) return undefined;
        const pollId = element.getAttribute('data-poll-id') ?? '';
        const question = element.getAttribute('data-poll-question') ?? '';
        return { pollId, question, options: '', allowMultiple: false, closed: false };
      },
    },
  );
