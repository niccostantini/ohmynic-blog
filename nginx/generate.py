#!/usr/bin/env python3
"""Generate all nginx error pages for dev. and blog. subdomains."""

import os
import base64
from pathlib import Path

# ── Paths ──────────────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
FONTS_DIR  = Path(__file__).parent.parent / "static" / "fonts"
OUT_DIR    = SCRIPT_DIR

# ── Encode fonts as base64 ────────────────────────────────────────────────────
def b64(filename):
    data = (FONTS_DIR / filename).read_bytes()
    return base64.b64encode(data).decode()

print("Encoding fonts…")
INTER_REG  = b64("inter-regular.woff2")
INTER_600  = b64("inter-600.woff2")
PLAYFAIR   = b64("playfair-600.woff2")
print("Fonts encoded.")

# ── Shared CSS ────────────────────────────────────────────────────────────────
SHARED_CSS = f"""
  @font-face {{
    font-family: 'Inter';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url('data:font/woff2;base64,{INTER_REG}') format('woff2');
  }}
  @font-face {{
    font-family: 'Inter';
    font-style: normal;
    font-weight: 500;
    font-display: swap;
    src: url('data:font/woff2;base64,{INTER_600}') format('woff2');
  }}
  @font-face {{
    font-family: 'Inter';
    font-style: normal;
    font-weight: 600;
    font-display: swap;
    src: url('data:font/woff2;base64,{INTER_600}') format('woff2');
  }}
  @font-face {{
    font-family: 'Playfair Display';
    font-style: normal;
    font-weight: 600;
    font-display: swap;
    src: url('data:font/woff2;base64,{PLAYFAIR}') format('woff2');
  }}

  :root {{
    --color-notte:      #1e1630;
    --color-prugna:     #3b2f5e;
    --color-viola:      #7c55d4;
    --color-lavanda:    #9b6ff0;
    --color-nebbia:     #f5f3fb;
    --color-iris:       #ece7fa;
    --color-bordo:      #d8d0f0;
    --color-bordo-soft: #ede9f8;
    --color-grafite:    #6b5f8a;
    --color-lilla:      #8e82b0;

    --font-serif: 'Playfair Display', Georgia, 'Times New Roman', serif;
    --font-sans:  'Inter', system-ui, sans-serif;

    --radius-md:   8px;
    --radius-lg:   12px;
    --radius-xl:   16px;
    --radius-pill: 999px;

    --shadow-lg: 0 8px 32px rgba(30, 22, 48, 0.14);
    --transition-fast: 120ms ease;
  }}

  *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}

  html, body {{
    height: 100%;
  }}

  body {{
    font-family: var(--font-sans);
    background-color: var(--color-nebbia);
    color: var(--color-notte);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 24px;
  }}

  .card {{
    background: var(--color-iris);
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg);
    padding: 52px 48px 48px;
    max-width: 480px;
    width: 100%;
    text-align: center;
  }}

  .eyebrow {{
    display: inline-block;
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-lavanda);
    background: white;
    border: 0.5px solid var(--color-bordo);
    border-radius: var(--radius-pill);
    padding: 3px 12px;
    margin-bottom: 24px;
  }}

  .error-code {{
    font-family: var(--font-serif);
    font-size: 100px;
    font-weight: 600;
    line-height: 1;
    letter-spacing: -0.02em;
    margin-bottom: 8px;
    background: linear-gradient(135deg, var(--color-lavanda) 30%, var(--color-viola));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }}

  .divider {{
    width: 40px;
    height: 1.5px;
    background: var(--color-bordo);
    border: none;
    margin: 20px auto 24px;
  }}

  .title {{
    font-family: var(--font-serif);
    font-size: 26px;
    font-weight: 600;
    line-height: 1.2;
    color: var(--color-notte);
    letter-spacing: -0.01em;
    margin-bottom: 16px;
  }}

  .desc {{
    font-size: 14px;
    color: var(--color-grafite);
    line-height: 1.6;
    margin-bottom: 28px;
  }}

  .scenarios {{
    list-style: none;
    text-align: left;
    background: white;
    border: 0.5px solid var(--color-bordo-soft);
    border-radius: var(--radius-lg);
    padding: 16px 20px;
    margin-bottom: 32px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }}

  .scenarios li {{
    font-size: 14px;
    color: var(--color-grafite);
    line-height: 1.5;
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }}

  .scenarios li::before {{
    content: '';
    display: block;
    flex-shrink: 0;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--color-lavanda);
    margin-top: 6px;
  }}

  .code-hint {{
    display: inline-block;
    font-family: 'Courier New', 'Monaco', monospace;
    font-size: 12px;
    color: var(--color-viola);
    background: white;
    border: 0.5px solid var(--color-bordo);
    border-radius: 4px;
    padding: 2px 8px;
    margin-bottom: 28px;
  }}

  .btn {{
    display: inline-block;
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 500;
    background: var(--color-notte);
    color: var(--color-nebbia);
    padding: 10px 24px;
    border-radius: var(--radius-md);
    border: none;
    cursor: pointer;
    letter-spacing: 0.04em;
    text-decoration: none;
    transition: background var(--transition-fast), transform var(--transition-fast);
    border-bottom: none;
  }}

  .btn:hover {{
    background: var(--color-prugna);
    color: var(--color-nebbia);
    border-bottom: none;
    transform: translateY(-1px);
  }}

  .footnote {{
    display: block;
    margin-top: 12px;
    font-size: 12px;
    color: var(--color-lilla);
    letter-spacing: 0.02em;
  }}

  .bg-orb {{
    position: fixed;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.35;
    pointer-events: none;
    z-index: -1;
  }}
  .bg-orb-1 {{
    width: 400px; height: 400px;
    background: var(--color-lavanda);
    top: -100px; right: -100px;
  }}
  .bg-orb-2 {{
    width: 300px; height: 300px;
    background: var(--color-viola);
    bottom: -80px; left: -80px;
  }}

  @media (max-width: 520px) {{
    .card {{ padding: 40px 28px 36px; }}
    .error-code {{ font-size: 80px; }}
    .title {{ font-size: 22px; }}
  }}
"""

# ── Page builder ──────────────────────────────────────────────────────────────
def build_body(code, eyebrow, title, body_html, btn_label, btn_href, footnote=""):
    footnote_html = f'<small class="footnote">{footnote}</small>' if footnote else ""
    return f"""
  <div class="bg-orb bg-orb-1"></div>
  <div class="bg-orb bg-orb-2"></div>

  <div class="card">
    <span class="eyebrow">{eyebrow}</span>
    <div class="error-code">{code}</div>
    <hr class="divider">
    <h1 class="title">{title}</h1>
    {body_html}
    <a class="btn" href="{btn_href}">{btn_label}</a>
    {footnote_html}
  </div>
"""

def render_page(lang_title, code, eyebrow, title, body_html, btn_label, btn_href, footnote=""):
    body = build_body(code, eyebrow, title, body_html, btn_label, btn_href, footnote)
    return f"""<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{code} — {lang_title}</title>
  <style>{SHARED_CSS}  </style>
</head>
<body>{body}
</body>
</html>
"""

def desc(text):
    return f'<p class="desc">{text}</p>'

def bullets(*items):
    lis = "\n".join(f"      <li>{item}</li>" for item in items)
    return f'<ul class="scenarios">\n{lis}\n    </ul>'

# ── Error definitions ─────────────────────────────────────────────────────────

BLOG_HOME = "https://ohmynic.co"

# (code, eyebrow, title, body_html, btn_label, btn_href, footnote)
DEV_ERRORS = {
    "400": (
        "Bad Request",
        "La richiesta è strana",
        bullets(
            "Parametri malformati o mancanti.",
            "Potrebbe essere un form rotto, una querystring sbagliata o un momento di debolezza.",
        ),
        "Torna al blog", BLOG_HOME,
        "quello giusto",
    ),
    "401": (
        "Unauthorized",
        "Non sei autenticato",
        bullets(
            "Devi fare login prima di accedere a questa risorsa.",
            "Se pensi di essere già loggato, la sessione è probabilmente scaduta.",
        ),
        "Torna al blog", BLOG_HOME,
        "",
    ),
    "403": (
        "Forbidden",
        "Non puoi entrare",
        bullets(
            "Non hai i permessi per questa risorsa.",
            "Né in dev, né altrove — e meno male.",
        ),
        "Torna al blog", BLOG_HOME,
        "e meno male",
    ),
    "404": (
        "Not Found",
        "Pagina scomparsa",
        bullets(
            "Questo path non esiste nel routing.",
            "Controlla le slug, le route dinamiche o il fatto che stai buildando la cosa giusta.",
        ),
        "Torna al blog", BLOG_HOME,
        "hai sbagliato path",
    ),
    "429": (
        "Too Many Requests",
        "Stai esagerando",
        desc("Troppe richieste in poco tempo. Rallenta — il rate limiter non discrimina tra dev e prod."),
        "Torna al blog", BLOG_HOME,
        "aspetta un secondo",
    ),
    "500": (
        "Internal Server Error",
        "Qualcosa è esploso",
        bullets(
            "Errore interno del server.",
            "Guarda i log — ci sarà sicuramente qualcosa di interessante là.",
        ),
        "Torna al blog", BLOG_HOME,
        "pm2 logs ohmynic-blog",
    ),
    "502": (
        "Bad Gateway",
        "Il server ha detto «no»",
        bullets(
            "Sei un dev e hai sbagliato qualcosa.",
            "Non sei un dev e non dovresti essere qui.",
        ),
        "Torna al blog", BLOG_HOME,
        "quello giusto",
    ),
    "503": (
        "Service Unavailable",
        "Il server è offline",
        bullets(
            "Il servizio non è raggiungibile in questo momento.",
            "Qualcuno ha dimenticato di avviare il processo?",
        ),
        "Torna al blog", BLOG_HOME,
        "pm2 start",
    ),
    "504": (
        "Gateway Timeout",
        "Il server non risponde",
        bullets(
            "Il server upstream non ha risposto in tempo.",
            "Sta buildando? Sta swappando? Boh.",
        ),
        "Torna al blog", BLOG_HOME,
        "controlla la RAM",
    ),
}

BLOG_ERRORS = {
    "400": (
        "Richiesta errata",
        "Qualcosa non ha funzionato",
        desc("La richiesta non era valida. Se stavi navigando normalmente, potrebbe essere un problema temporaneo."),
        "Torna alla home", BLOG_HOME,
        "riprova tra poco",
    ),
    "401": (
        "Accesso riservato",
        "Devi essere connesso",
        desc("Questa sezione è riservata ai lettori registrati. Accedi o crea un account per continuare."),
        "Accedi", f"{BLOG_HOME}/login",
        "",
    ),
    "403": (
        "Accesso negato",
        "Questa sezione è riservata",
        desc("Non hai i permessi per visualizzare questa pagina. Se pensi sia un errore, verifica di aver effettuato l'accesso."),
        "Torna alla home", BLOG_HOME,
        "",
    ),
    "404": (
        "Non trovato",
        "Questa pagina non esiste",
        desc("La pagina che cerchi non è stata trovata — potrebbe essere stata spostata, rinominata o rimossa."),
        "Torna alla home", BLOG_HOME,
        "",
    ),
    "429": (
        "Troppo veloce",
        "Rallenta un po'",
        desc("Hai fatto troppe richieste in poco tempo. Aspetta qualche secondo e riprova."),
        "Torna alla home", BLOG_HOME,
        "nessuna fretta",
    ),
    "500": (
        "Errore interno",
        "Qualcosa è andato storto",
        desc("Si è verificato un errore nel caricamento di questa pagina. Ci scusiamo per il disagio — stiamo lavorando per risolvere il problema."),
        "Torna alla home", BLOG_HOME,
        "",
    ),
    "502": (
        "Offline",
        "Il blog è offline",
        desc("Il blog è temporaneamente irraggiungibile. Stiamo lavorando per ripristinare il servizio il prima possibile."),
        "Riprova", BLOG_HOME,
        "torna più tardi",
    ),
    "503": (
        "Manutenzione",
        "Stiamo aggiornando",
        desc("Il blog è temporaneamente in manutenzione. Tornerà online tra poco — grazie per la pazienza."),
        "Riprova", BLOG_HOME,
        "grazie per la pazienza",
    ),
    "504": (
        "Timeout",
        "Il blog non risponde",
        desc("Il server ha impiegato troppo tempo a rispondere. Riprova tra qualche minuto."),
        "Riprova", BLOG_HOME,
        "",
    ),
}

# ── Generate ──────────────────────────────────────────────────────────────────
def generate(variant, errors):
    out = OUT_DIR / variant
    out.mkdir(parents=True, exist_ok=True)
    for code, args in errors.items():
        eyebrow, title, body_html, btn_label, btn_href, footnote = args
        html = render_page(title, code, eyebrow, title, body_html, btn_label, btn_href, footnote)
        path = out / f"{code}.html"
        path.write_text(html, encoding="utf-8")
        print(f"  {variant}/{code}.html")

print("\nGenerating dev/ pages…")
generate("dev", DEV_ERRORS)

print("\nGenerating blog/ pages…")
generate("blog", BLOG_ERRORS)

print("\nDone.")
