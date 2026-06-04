# ohmynic.co — Self-hosted Blog Platform
## Spec per Claude Code

---

## Obiettivo

Costruire una piattaforma di blogging self-hosted simile a Medium, deployata su un droplet DigitalOcean esistente (`ohmynic.co`), con:

- Frontend pubblico per i lettori
- Admin privata per scrivere e gestire articoli
- Commenti anonimi con disclaimer
- RSS feed, tag, condivisione social

---

## Stack

| Layer | Tecnologia |
|---|---|
| Framework | SvelteKit (fullstack, SSR) |
| Database | PostgreSQL (già installato sul droplet) |
| ORM | Drizzle ORM |
| Editor articoli | TipTap (rich text, stile Medium) |
| Auth | Lucia Auth v3 |
| Deploy | PM2 + Caddy (reverse proxy + HTTPS) |
| Runtime | Node.js 20+ |

---

## Struttura del progetto

```
ohmynic-blog/
├── src/
│   ├── routes/
│   │   ├── (public)/
│   │   │   ├── +page.svelte              # Homepage: lista articoli
│   │   │   ├── [slug]/
│   │   │   │   ├── +page.svelte          # Singolo articolo + commenti
│   │   │   │   └── +page.server.ts       # Load articolo + commenti
│   │   │   └── tag/[tag]/
│   │   │       ├── +page.svelte          # Articoli filtrati per tag
│   │   │       └── +page.server.ts
│   │   ├── admin/
│   │   │   ├── +layout.svelte            # Layout admin con nav
│   │   │   ├── +layout.server.ts         # Guard: redirect se non autenticato
│   │   │   ├── +page.svelte              # Dashboard: lista articoli
│   │   │   ├── new/
│   │   │   │   ├── +page.svelte          # Editor nuovo articolo
│   │   │   │   └── +page.server.ts
│   │   │   └── edit/[id]/
│   │   │       ├── +page.svelte          # Editor modifica articolo
│   │   │       └── +page.server.ts
│   │   ├── login/
│   │   │   ├── +page.svelte              # Form di login
│   │   │   └── +page.server.ts
│   │   ├── api/
│   │   │   ├── comments/+server.ts       # POST nuovo commento
│   │   │   └── logout/+server.ts         # POST logout
│   │   └── rss.xml/
│   │       └── +server.ts                # Feed RSS
├── src/lib/
│   ├── db/
│   │   ├── schema.ts                     # Schema Drizzle
│   │   ├── index.ts                      # Client DB
│   │   └── queries/
│   │       ├── articles.ts
│   │       ├── comments.ts
│   │       └── tags.ts
│   ├── components/
│   │   ├── Editor.svelte                 # TipTap editor
│   │   ├── ArticleCard.svelte            # Card articolo in lista
│   │   ├── CommentForm.svelte            # Form commento anonimo
│   │   ├── CommentList.svelte            # Lista commenti
│   │   ├── ShareButtons.svelte           # Bottoni condivisione social
│   │   └── TagList.svelte
│   └── auth.ts                           # Configurazione Lucia Auth
├── drizzle/
│   └── migrations/                       # Migrazioni DB auto-generate
├── drizzle.config.ts
├── .env                                  # Variabili d'ambiente (NON committare)
├── .env.example
├── Caddyfile                             # Config Caddy per ohmynic.co
├── ecosystem.config.cjs                  # Config PM2
└── package.json
```

---

## Schema database (Drizzle)

```typescript
// src/lib/db/schema.ts

import { pgTable, text, timestamp, boolean, uuid, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

export const articles = pgTable('articles', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(),        // HTML da TipTap
  excerpt: text('excerpt'),                  // Estratto opzionale
  coverImage: text('cover_image'),           // URL immagine copertina
  published: boolean('published').default(false).notNull(),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
});

export const articleTags = pgTable('article_tags', {
  articleId: uuid('article_id').notNull().references(() => articles.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
});

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  articleId: uuid('article_id').notNull().references(() => articles.id, { onDelete: 'cascade' }),
  authorName: text('author_name'),           // Opzionale (anonimo se null)
  authorEmail: text('author_email'),         // Opzionale
  content: text('content').notNull(),
  approved: boolean('approved').default(false).notNull(), // Moderazione
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

---

## Variabili d'ambiente

```bash
# .env.example

DATABASE_URL="postgresql://user:password@localhost:5432/ohmynic_blog"
AUTH_SECRET="genera-con-openssl-rand-base64-32"

# Credenziali admin iniziali (usate solo per setup)
ADMIN_USERNAME="tuonome"
ADMIN_PASSWORD="password-sicura"
```

---

## Funzionalità principali

### 1. Editor articoli (Admin)
- TipTap con toolbar: Bold, Italic, Heading (H2, H3), Link, Quote, Code, Lista, Immagine
- Campo titolo separato (grande, stile Medium)
- Campo tag: input con autocomplete + creazione al volo
- Campo excerpt (opzionale, altrimenti auto-generato dai primi 160 caratteri)
- Upload/URL immagine copertina
- Bottoni: **Salva bozza** / **Pubblica**
- Preview live dell'articolo

### 2. Frontend pubblico
- Homepage con lista articoli (solo pubblicati), ordinati per data
- Paginazione (10 articoli per pagina)
- Card articolo: copertina, titolo, excerpt, data, tag
- Pagina singolo articolo con stile tipografico leggibile
- Bottoni di condivisione: Twitter/X, LinkedIn, copia link, email
- Lista tag sidebar / footer
- Filtro per tag

### 3. Commenti
- Form sotto ogni articolo
- Campi: **Nome** (opzionale), **Email** (opzionale), **Commento** (obbligatorio)
- Disclaimer visibile sopra il form:
  > *I commenti sono anonimi. Nome ed email sono facoltativi e non verranno condivisi. I commenti sono moderati prima della pubblicazione.*
- I commenti appaiono solo dopo approvazione (`approved = true`)
- Nell'admin: sezione "Commenti in attesa" con pulsanti Approva / Elimina

### 4. RSS Feed
- Route `/rss.xml` che genera feed valido (RSS 2.0)
- Include: titolo, link, excerpt, data pubblicazione
- Solo articoli pubblicati, ordinati per data

### 5. Auth Admin
- Login con username + password (Lucia Auth v3 + Argon2)
- Session cookie sicuro (httpOnly, sameSite: strict)
- Tutte le route `/admin/*` protette da guard nel layout server
- Logout via POST `/api/logout`

---

## Deploy su DigitalOcean

### Prerequisiti sul droplet
```bash
# Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2
npm install -g pm2

# Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy
```

### Caddyfile
```
# /etc/caddy/Caddyfile

ohmynic.co {
  reverse_proxy localhost:3000
}
```

Caddy gestisce automaticamente certificato SSL via Let's Encrypt.

### PM2 config
```javascript
// ecosystem.config.cjs
module.exports = {
  apps: [{
    name: 'ohmynic-blog',
    script: 'build/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    env_file: '.env',
  }]
};
```

### Build e deploy
```bash
# Sul droplet, nella cartella del progetto
npm install
npm run build
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup   # Per riavvio automatico
```

---

## Istruzioni per Claude Code

**Usa questi prompt in sequenza:**

### Step 1 — Scaffold
```
Crea un progetto SvelteKit con TypeScript. Installa: drizzle-orm, drizzle-kit, pg, lucia, @lucia-auth/adapter-drizzle, @tiptap/core, @tiptap/starter-kit, @tiptap/extension-link, @tiptap/extension-image, argon2. Configura drizzle.config.ts per PostgreSQL.
```

### Step 2 — Database
```
Crea lo schema Drizzle in src/lib/db/schema.ts con le tabelle: users, sessions, articles, tags, articleTags, comments (vedi spec). Crea le query helper in src/lib/db/queries/. Genera la prima migrazione.
```

### Step 3 — Auth
```
Configura Lucia Auth v3 in src/lib/auth.ts con adapter Drizzle e PostgreSQL. Crea le route /login (GET form + POST handler) e /api/logout. Crea il layout server per /admin che fa redirect a /login se non autenticato.
```

### Step 4 — Admin
```
Crea la dashboard admin in /admin con lista articoli (bozze + pubblicati). Crea le pagine /admin/new e /admin/edit/[id] con l'Editor TipTap (toolbar completa), campo tag con autocomplete, excerpt, cover image, e bottoni Salva bozza / Pubblica. Aggiungi sezione "Commenti in attesa" con Approva/Elimina.
```

### Step 5 — Frontend pubblico
```
Crea la homepage con ArticleCard (cover, titolo, excerpt, data, tag), paginazione a 10 articoli. Crea la pagina singolo articolo con stile tipografico, ShareButtons (Twitter, LinkedIn, copia link, email), CommentForm con disclaimer e CommentList (solo commenti approvati). Crea la pagina /tag/[tag].
```

### Step 6 — RSS
```
Crea la route /rss.xml che genera un feed RSS 2.0 valido con tutti gli articoli pubblicati, ordinati per data decrescente.
```

### Step 7 — Deploy
```
Crea ecosystem.config.cjs per PM2, il Caddyfile per ohmynic.co con reverse proxy su porta 3000, e un file DEPLOY.md con i passi per il primo deploy sul droplet DigitalOcean.
```

---

## Note finali

- Lo slug degli articoli si genera automaticamente dal titolo (kebab-case, deduplicato con suffisso numerico se necessario)
- I commenti non approvati non sono mai visibili pubblicamente, nemmeno via API
- Il campo `approved` permette moderazione asincrona: puoi approvare i commenti dall'admin quando vuoi
- Per le immagini negli articoli: inizia con URL esterni (Cloudinary free tier o Imgur); l'upload locale può essere aggiunto dopo
- Drizzle genera le migrazioni: esegui sempre `npm run db:migrate` dopo modifiche allo schema

---

## Design System

### Font (Google Fonts)
Aggiungi in `src/app.html`, nel `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,400;1,500&family=Inter:wght@400;500&display=swap" rel="stylesheet">
```

### Tokens
Copia `design-tokens.css` in `src/lib/styles/tokens.css` e importalo in `src/app.css`:
```css
@import '$lib/styles/tokens.css';

body {
  background: var(--color-nebbia);
  color: var(--color-notte);
  font-family: var(--font-sans);
}
```

### Palette
| Token | Hex | Uso |
|---|---|---|
| `--color-notte` | `#1e1630` | Testo principale, bottone dark |
| `--color-prugna` | `#3b2f5e` | Testo body articoli |
| `--color-viola` | `#7c55d4` | Link, tag border, accenti |
| `--color-lavanda` | `#9b6ff0` | CTA, accento primario, logo "My" |
| `--color-nebbia` | `#f5f3fb` | Background pagina |
| `--color-iris` | `#ece7fa` | Background card e tag |
| `--color-bordo` | `#d8d0f0` | Bordi card e divisori |
| `--color-lilla` | `#8e82b0` | Meta, date, testi terziari |

### Logo
```svelte
<!-- src/lib/components/Logo.svelte -->
<span class="logo">Oh<em>My</em>Nic!</span>

<style>
  .logo {
    font-family: var(--font-serif);
    font-weight: 600;
    color: var(--color-notte);
    letter-spacing: var(--tracking-tight);
  }
  .logo em {
    font-style: italic;
    color: var(--color-lavanda);
  }
</style>
```

---

## Workflow di sviluppo

### Prerequisiti locali
Claude Code verificherà tutto automaticamente all'avvio. Assicurati di avere:
- Docker Desktop in esecuzione
- Node.js 20+
- Git configurato

### Setup iniziale (una volta sola)

**Chiedi a Claude Code di eseguire questo script di setup:**

```
Prima di tutto, esegui i controlli preliminari dell'ambiente:
1. Verifica che Docker sia in esecuzione (docker info)
2. Verifica Node.js >= 20 (node --version)
3. Verifica npm >= 9 (npm --version)
4. Avvia un container Postgres locale se non esiste già:
   docker run --name ohmynic-postgres \
     -e POSTGRES_USER=ohmynic \
     -e POSTGRES_PASSWORD=localdev \
     -e POSTGRES_DB=ohmynic_blog \
     -p 5432:5432 \
     -d postgres:16
5. Crea il file .env copiando .env.example e compilando:
   DATABASE_URL="postgresql://ohmynic:localdev@localhost:5432/ohmynic_blog"
   AUTH_SECRET="dev-secret-non-usare-in-produzione"
   ADMIN_USERNAME="admin"
   ADMIN_PASSWORD="admindev123"
6. Installa le dipendenze (npm install)
7. Esegui le migrazioni (npm run db:migrate)
8. Crea l'utente admin iniziale (npm run db:seed)
9. Avvia il dev server (npm run dev)
Segnalami ogni errore prima di procedere.
```

### Variabili d'ambiente

```bash
# .env (locale)
DATABASE_URL="postgresql://ohmynic:localdev@localhost:5432/ohmynic_blog"
AUTH_SECRET="dev-secret-non-usare-in-produzione"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admindev123"

# .env.production (server — NON committare mai)
DATABASE_URL="postgresql://ohmynic:PASSWORD@localhost:5432/ohmynic_blog"
AUTH_SECRET="genera con: openssl rand -base64 32"
ADMIN_USERNAME="tuonome"
ADMIN_PASSWORD="password-molto-sicura"
```

### Comandi quotidiani

```bash
# Avviare Postgres se il container è fermo
docker start ohmynic-postgres

# Dev server
npm run dev

# Dopo modifiche allo schema DB
npm run db:generate   # genera la migrazione
npm run db:migrate    # applica la migrazione

# Vedere il DB con interfaccia grafica
npm run db:studio     # apre Drizzle Studio su localhost:4983
```

### Repository Git

```bash
# Setup iniziale (una volta)
git init
git remote add origin git@github.com:TUO_USERNAME/ohmynic-blog.git

# .gitignore — assicurati che contenga:
.env
.env.production
node_modules/
build/
.svelte-kit/

# Workflow deploy
git add .
git commit -m "descrizione"
git push origin main
```

### Deploy sul server (dopo ogni push)

SSH sul droplet e:

```bash
cd ~/ohmynic-blog
git pull origin main
npm install --production
npm run build
pm2 restart ohmynic-blog
```

Oppure automatizza con un semplice script `deploy.sh` sul server:

```bash
#!/bin/bash
set -e
cd ~/ohmynic-blog
git pull origin main
npm install --production
npm run build
pm2 restart ohmynic-blog
echo "Deploy completato."
```

Rendilo eseguibile: `chmod +x deploy.sh`  
Eseguilo: `./deploy.sh`

---

## Come autorizzare Claude Code in automatico

Claude Code chiede conferma prima di eseguire comandi potenzialmente distruttivi. Per ridurre le interruzioni durante lo sviluppo, usa la modalità **auto-approve**.

### Opzione 1 — Flag `--dangerously-skip-permissions` (sviluppo locale)
```bash
claude --dangerously-skip-permissions
```
Claude Code eseguirà tutti i comandi senza chiedere conferma. **Usare solo in locale, mai su un server.**

### Opzione 2 — File di configurazione per regole granulari
Crea `.claude/settings.json` nella root del progetto:

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(docker *)",
      "Bash(git *)",
      "Bash(npx drizzle-kit *)",
      "Write(**/*.ts)",
      "Write(**/*.svelte)",
      "Write(**/*.css)",
      "Write(**/*.json)",
      "Write(**/*.md)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(curl * | bash *)"
    ]
  }
}
```

Questo approccio è più sicuro: Claude Code opera liberamente su file di progetto e comandi npm/docker/git, ma chiede comunque conferma per operazioni pericolose.

### Consiglio
Usa l'**Opzione 2** per tutto il progetto — ti evita il 95% delle interruzioni mantenendo un minimo di controllo. Riserva `--dangerously-skip-permissions` solo per sessioni veloci in cui vuoi andare spedito senza nessuna interruzione.

