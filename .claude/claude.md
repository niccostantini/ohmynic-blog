# OhMyNic Blog — Contesto codebase

## Stack tecnico

- **Framework**: SvelteKit 2 con Svelte 5 (runes: `$state`, `$props`, `$effect`)
- **Runtime/Deploy**: Node.js adapter (`@sveltejs/adapter-node`), servito da PM2 + Caddy
- **Database**: PostgreSQL via Drizzle ORM (`drizzle-orm` + `drizzle-kit`)
- **Auth admin**: Lucia v3 con adapter Drizzle (sessioni in tabella `sessions`)
- **Auth lettori**: sistema custom con cookie `reader_session` (tabella `reader_sessions`)
- **Editor**: BlockNote 0.51.4 (React) montato dentro un componente Svelte tramite `createRoot`
- **Email**: Resend
- **Upload immagini**: Cloudflare R2 via `@aws-sdk/client-s3`
- **Icone**: Tabler Icons webfont self-hosted (copiata in `static/fonts/` da `postinstall`)
- **Password hashing**: argon2

## Deploy

> Il server (DigitalOcean, 1 GB RAM) non può buildare — Vite viene killato dall'OOM killer.

**Flusso sempre**: build locale → rsync `build/` → restart PM2

```bash
./deploy-local.sh   # da /Users/niccolo/Sites/OhMyNic/blog
```

Lo script:
1. `npm run build` in locale
2. `rsync -avz --delete build/ root@64.225.70.212:/root/ohmynic-blog/build/`
3. SSH: `git pull && npm run db:migrate; pm2 restart ohmynic-blog`

Server: `root@64.225.70.212`, app in `/root/ohmynic-blog/`

## Struttura routes

```
src/routes/
├── (public)/               # Layout pubblico (header, footer, tema)
│   ├── +layout.server.ts   # Carica navItems, reader session
│   ├── [slug]/             # Pagina articolo/pagina statica
│   ├── login/              # Login lettori
│   ├── register/           # Registrazione lettori
│   ├── account/            # Profilo lettore
│   ├── search/             # Ricerca full-text
│   ├── tag/[tag]/          # Archivio per tag
│   └── author/[username]/  # Pagina autore
├── admin/                  # CMS (protetto da Lucia session)
│   ├── edit/[id]/          # Modifica articolo (Editor + workflow + commenti editoriali)
│   ├── pages/edit/[id]/    # Modifica pagina statica
│   ├── new/                # Nuovo articolo
│   ├── pages/new/          # Nuova pagina
│   ├── analytics/          # Dashboard analytics
│   ├── comments/           # Gestione commenti pubblici
│   ├── feedback/           # Feedback utenti
│   ├── settings/           # Impostazioni sito
│   └── users/              # Gestione utenti admin
├── admin-login/            # Login admin (separato da /login lettori)
├── api/
│   ├── upload/             # POST: upload immagine → R2
│   ├── analytics/          # pageview + completion
│   ├── comments/           # CRUD commenti pubblici
│   ├── feedback/           # Feedback
│   ├── bookmarks/          # Segnalibri lettori
│   └── og/[slug]/          # OG image generata
└── rss.xml/                # Feed RSS
```

## Schema database (tabelle principali)

| Tabella | Descrizione |
|---------|-------------|
| `users` | Admin/editor/contributor — ruoli: `admin`, `editor`, `contributor` |
| `sessions` | Sessioni Lucia per admin |
| `articles` | Articoli e pagine statiche (`type: 'article'|'page'`) |
| `navItems` | Voci navbar dinamica |
| `tags` + `article_tags` | Tag con slug |
| `readers` | Lettori registrati (separati da users) |
| `reader_sessions` | Sessioni lettori |
| `reader_bookmarks` | Segnalibri lettori |
| `comments` | Commenti pubblici (moderati) |
| `editorial_comments` | Commenti redazionali per-blocco nell'editor |
| `article_status_log` | Log transizioni di stato articolo |
| `page_views` + `article_read_completions` | Analytics interno |
| `feedback` | Bug/suggerimenti da utenti |
| `featured_items` | Articoli in evidenza homepage |

Articoli hanno `visibleTo text[]` per controllo accesso (es. `['public']`, `['readers']`).

## Workflow articoli

Stato: `draft → review → approved → published`

- `contributor`: può solo muovere i propri articoli da `draft` a `review`
- `editor`: può approvare (`review → approved`) e rifiutare (`approved → draft`)
- `admin`: può fare tutto, incluso pubblicare
- `canPublish` flag su `users` permette a editor/contributor di pubblicare direttamente

## Vincoli BlockNote propSchema e DOM

**Tipi nei prop**: BlockNote accetta solo `string` e `boolean` come default — mai numeri. Un `{ default: 100 }` causa errore silenzioso che svuota l'intero editor. I prop numerici si dichiarano come `{ default: '100' }` e si convertono con `parseInt()` dove servono.

**Non mutare il DOM di ProseMirror**: Non usare `useEffect` per modificare elementi come `.bn-block-outer` dall'interno di un blocco custom. ProseMirror usa un MutationObserver che rileva le mutazioni esterne e può invalidare lo stato interno dell'editor, azzerando il contenuto. Modificare solo il DOM interno al componente (il div root del blocco custom), mai i wrapper di BlockNote/ProseMirror.

**Migrazioni schema blocchi**: Quando si aggiunge un nuovo prop a un blocco custom, i `blocks_json` già salvati in DB non avranno quel prop. BlockNote rifiuta blocchi con prop mancanti invece di usare i default. Fix: normalizzare i blocchi in `Editor.svelte` prima di `replaceBlocks`, aggiungendo i prop mancanti con il loro default (vedi pattern `if (b.type === 'image' && !('width' in b.props))`). Aggiungere sempre un try-catch su `replaceBlocks` con fallback al parsing HTML.

## Editor (BlockNote)

`src/lib/components/Editor.svelte` — wrapper Svelte che monta React con `createRoot`.

**Schema custom blocchi**:
- `image`: sostituisce il blocco immagine di default; supporta float left/right/center/full; upload via `/api/upload` → R2
- `callout`: blocco callout con varianti `nota`, `attenzione`, `info`
- `footnoteList`: lista note a piè di pagina (auto-gestita)
- `footnote` (inline): nota inline con popover di editing

Il contenuto viene salvato come HTML in `articles.content` e anche come JSON in `articles.blocks_json` (per preservare gli ID blocco stabili tra caricamenti).

## Upload immagini (R2)

**Endpoint**: `POST /api/upload` (`src/routes/api/upload/+server.ts`)

Richiede autenticazione (`locals.user`). Risponde 503 se le env vars R2 mancano.

**Env vars necessarie** (nel `.env` del server `/root/ohmynic-blog/.env`):
```
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=    # URL pubblico del bucket (es. https://pub-xxx.r2.dev)
```

Limite: 15 MB, solo immagini. Key generata: `uploads/{timestamp}-{uuid}.{ext}`

## Auth — due sistemi paralleli

**Admin** (`locals.user`): Lucia v3, cookie `auth_session`, tabella `sessions`/`users`

**Lettori** (`locals.reader`): cookie `reader_session`, validato in `hooks.server.ts` tramite `validateReaderSession()`. Campi profilo: email, displayName, country, city, website, twitter, linkedin, instagram.

## Componenti chiave

| File | Descrizione |
|------|-------------|
| `src/lib/components/Editor.svelte` | Editor BlockNote (React-in-Svelte) |
| `src/lib/components/ImageBlock.tsx` | Blocco immagine custom con upload R2 |
| `src/lib/components/CalloutBlock.tsx` | Blocco callout |
| `src/lib/editor/footnotes/` | Plugin footnote custom (pronto per npm) |
| `src/lib/components/VisibilityChips.svelte` | UI per `visibleTo` array |
| `src/lib/stores/toast.ts` | Toast notifications globali |
| `src/lib/workflow/checklists.ts` | Checklist per transizioni di stato |

## Design system

CSS custom properties in `src/lib/styles/tokens.css` e `design-tokens.css`.
Font: Inter (sans) + Playfair Display (serif), self-hosted in `src/lib/assets/fonts/`.

Nomi token: `--color-viola`, `--color-lavanda`, `--color-lilla`, `--color-bordo`, `--color-nebbia`, `--color-prugna`, `--color-notte`, `--font-sans`, `--font-serif`, ecc.

## Migrazioni DB

```bash
npm run db:generate   # genera migrazione da schema
npm run db:migrate    # applica migrazioni (via drizzle-kit)
```

**Attenzione**: `db:migrate` può saltare migrazioni silenziosamente se l'hash è già in `__drizzle_migrations`. In caso di 500 post-deploy verificare colonne mancanti con psql diretto e inserire l'hash manualmente (vedi memory `feedback_migration_500.md`).

Migrazioni in `drizzle/migrations/`.

## Variabili d'ambiente (produzione)

```
DATABASE_URL=postgresql://ohmynic:PASSWORD@localhost:5432/ohmynic_blog
AUTH_SECRET=
RESEND_API_KEY=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
```

## Comandi utili

```bash
npm run dev              # dev server locale
npm run build            # build produzione
npm run db:migrate       # applica migrazioni
npm run db:studio        # Drizzle Studio (GUI DB)
./deploy-local.sh        # deploy completo in un comando
```

Sul server:
```bash
pm2 logs ohmynic-blog    # log in tempo reale
pm2 restart ohmynic-blog # restart
ssh root@64.225.70.212   # accesso server
```
