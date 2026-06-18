# Misure di sicurezza — OhMyNic! Blog

Panoramica delle protezioni attive sul blog, organizzate per categoria di rischio.

---

## 1. Autenticazione e sessioni

**Due sistemi paralleli e separati:**

| Sistema | Cookie | Tabella DB | Libreria |
|---|---|---|---|
| Admin / Editor / Contributor | `auth_session` | `sessions` + `users` | Lucia v3 |
| Lettori registrati | `reader_session` | `reader_sessions` + `readers` | Custom |

- Le sessioni admin e lettori non si intersecano: un lettore autenticato non può accedere alle route `/admin/*`.
- `locals.user` e `locals.reader` sono popolati in `hooks.server.ts` e usati nei load/action di ogni route protetta.
- **Password hash**: argon2 (sia per admin che per lettori).
- **Reset password**: token monouso con scadenza 1 ora, invalidato dopo il primo utilizzo.

---

## 2. Autorizzazione articoli

Gli articoli hanno un campo `visibleTo text[]` che controlla chi può leggerli:

- `['public']` — visibile a tutti
- `['readers']` — solo lettori registrati
- `[]` / `null` — privato (fail-closed: accesso negato se il campo è vuoto)

Logica in `src/routes/(public)/[slug]/+page.server.ts`:
- Utente non autenticato su contenuto riservato → redirect a `/login`
- Utente autenticato senza il ruolo corretto → 403

---

## 3. CSRF

SvelteKit gestisce la protezione CSRF nativamente per le form action (`method="POST"`):
- Verifica l'header `Origin` su ogni richiesta POST verso una form action.
- Le chiamate `fetch` alle API REST (`/api/*`) usano `Content-Type: application/json`, che non è forgeable da form cross-origin.
- nginx imposta `proxy_set_header Host $host;` su tutti i location block, preservando l'host originale per la verifica SvelteKit.

---

## 4. Rate limiting (nginx)

File: `/etc/nginx/conf.d/ratelimit.conf`

```nginx
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;
```

Endpoint protetti con burst controllato:

| Endpoint | Limite | Burst |
|---|---|---|
| `/blog/login` | 5 req/min | 3 |
| `/blog/admin-login` | 5 req/min | 3 |
| `/blog/register` | 5 req/min | 3 |
| `/blog/forgot-password` | 5 req/min | 2 |

Risposta in caso di superamento: `429 Too Many Requests`.

---

## 5. Security headers (nginx)

Impostati a livello `server` in `/etc/nginx/sites-enabled/ohmynic`, ereditati dal location block `/blog`:

| Header | Valore |
|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `X-Permitted-Cross-Domain-Policies` | `none` |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self';` |

> **Nota**: I location block con `add_header` propri (font cache, asset immutabili) non ereditano questi header — accettabile perché sono risposte binarie, non HTML.

---

## 6. XSS — sanitizzazione contenuto articoli

File: `src/routes/(public)/[slug]/+page.server.ts`

Il contenuto HTML degli articoli (generato da BlockNote) viene passato attraverso **DOMPurify** (`isomorphic-dompurify`) prima di essere restituito al client:

```typescript
import DOMPurify from 'isomorphic-dompurify';

content: DOMPurify.sanitize(article.content ?? '', { ADD_ATTR: ['target'] })
```

- `ADD_ATTR: ['target']` preserva `target="_blank"` sui link esterni (comportamento desiderato).
- La sanitizzazione avviene server-side, prima del rendering.

---

## 7. HTML injection nelle email

File: `src/lib/email.ts`

Tutti i campi user-supplied interpolati nei template HTML delle email sono escapati tramite la funzione interna `e()`:

```typescript
function e(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

Campi protetti in tutti i 13 template: nomi, email, titoli articoli, body commenti, note redazionali, descrizioni feedback, URL di pagina.

Per i campi multiriga: `e(text).replace(/\n/g, '<br>')` — escape prima, poi conversione newline (ordine critico per non escapare i `<br>`).

---

## 8. SSRF — og-scrape

File: `src/routes/api/og-scrape/+server.ts`

L'endpoint recupera metadati OG da URL esterni (solo admin autenticati). Protezioni in cascata:

1. **Autenticazione**: `if (!locals.user) error(401)` — solo admin/editor.
2. **Whitelist protocollo**: solo `http:` e `https:` — blocca `file:`, `ftp:`, ecc.
3. **Blocklist IP privati** (eseguita prima del `fetch`):

```
127.x.x.x     loopback
::1            loopback IPv6
10.x.x.x       rete privata classe A
172.16–31.x.x  rete privata classe B
192.168.x.x    rete privata classe C
169.254.x.x    link-local / metadata cloud (AWS, GCP, Azure)
0.x.x.x        riservato
198.18–19.x.x  benchmarking riservato
```

4. **Timeout**: `AbortSignal.timeout(10_000)` — 10 secondi massimo.

> **Limitazione nota**: non protegge da DNS rebinding (hostname pubblico che risolve a IP privato dopo il controllo). Mitigazione possibile con una seconda verifica post-DNS, non ancora implementata.

---

## 9. SQL injection

Tutte le query al database usano **Drizzle ORM** con query parametrizzate. Non vengono costruite query SQL per concatenazione di stringhe. Le query raw (`sql` template tag di Drizzle) usano placeholder `$1`, `$2`, ecc.

---

## 10. Validazione input — commenti e feedback

Validazione a tre livelli per i campi testuali liberi:

| Campo | Min | Max | HTML `maxlength` | Check JS | Check server |
|---|---|---|---|---|---|
| Commento (`content`) | 1 char | 1000 | ✓ | ✓ | ✓ |
| Feedback titolo | 1 char | 100 | ✓ | ✓ | ✓ |
| Feedback descrizione | 20 char | 2000 | ✓ | ✓ | ✓ |

---

## 11. Upload immagini

File: `src/routes/api/upload/+server.ts`

- Richiede autenticazione admin (`locals.user`).
- Limite dimensione: **15 MB**.
- Whitelist MIME type: solo immagini.
- Le immagini sono caricate su **Cloudflare R2** (storage esterno), non sul filesystem del server.
- La chiave R2 è generata con timestamp + UUID: `uploads/{timestamp}-{uuid}.{ext}` — nessun path traversal possibile.

---

## Cosa non è ancora coperto

| Vettore | Stato |
|---|---|
| DNS rebinding su og-scrape | Non coperto (vedi §8) |
| Brute force a livello Node.js | Solo nginx rate limiting; nessun lockout applicativo |
| Debounce client-side su ricerca/API | Assente |
| Verifica email mittente commenti | Assente (email opzionale, non verificata) |
