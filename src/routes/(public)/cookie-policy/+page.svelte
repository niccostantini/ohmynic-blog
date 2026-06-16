<svelte:head>
  <title>Cookie policy — OhMyNic!</title>
  <meta name="description" content="Informativa sull'uso di cookie e storage locale su OhMyNic!" />
  <meta name="robots" content="noindex" />
</svelte:head>

<article class="article-wrap is-page">
  <div class="article-header">
    <h1 class="article-title">Cookie policy</h1>
    <p class="article-updated">Ultimo aggiornamento: 16 giugno 2026</p>
  </div>

  <div class="prose">

    <h2>1. Titolare del trattamento</h2>
    <p>
      Il titolare del trattamento dei dati personali raccolti tramite questo sito è
      <strong>Niccolò Costantini</strong>, contattabile all'indirizzo
      <a href="mailto:niccolo@ohmynic.co">niccolo@ohmynic.co</a>.
    </p>

    <h2>2. Cosa sono cookie e storage locale</h2>
    <p>
      I <strong>cookie</strong> sono piccoli file di testo salvati dal browser sul tuo dispositivo quando visiti un sito.
      Questo sito usa anche il <strong>localStorage</strong> e il <strong>sessionStorage</strong>, meccanismi gestiti dal browser
      che non vengono automaticamente inviati al server a ogni richiesta.
    </p>

    <h2>3. Cookie impostati da questo sito</h2>
    <p>
      Questo sito non usa cookie di profilazione, pubblicitari o di terze parti.
      I soli cookie utilizzati sono tecnici e necessari al funzionamento del servizio.
    </p>

    <table>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Scopo</th>
          <th>Durata</th>
          <th>Tipo</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>auth_session</code></td>
          <td>Sessione di autenticazione per utenti staff/admin del CMS.</td>
          <td>30 giorni o fino al logout</td>
          <td>HttpOnly, Secure, SameSite=Strict</td>
        </tr>
        <tr>
          <td><code>reader_session</code></td>
          <td>Sessione per utenti registrati che effettuano login volontario.</td>
          <td>30 giorni o fino al logout</td>
          <td>HttpOnly, Secure, SameSite=Lax</td>
        </tr>
      </tbody>
    </table>

    <p>
      Questi cookie sono strettamente necessari per fornire funzionalità richieste dall'utente
      e non richiedono consenso ai sensi dell'art. 5(3) della Direttiva ePrivacy.
    </p>

    <h2>4. Storage locale</h2>

    <h3>localStorage</h3>
    <p>
      Il sito salva alcune preferenze nel localStorage del tuo browser. Questi dati restano sul dispositivo
      e non vengono mai trasmessi al server.
    </p>

    <table>
      <thead>
        <tr>
          <th>Chiave</th>
          <th>Contenuto</th>
          <th>Durata</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>ohmynic-theme</code></td>
          <td>Preferenza tema UI (chiaro/scuro/sistema)</td>
          <td>Fino a cancellazione manuale</td>
        </tr>
        <tr>
          <td><code>ohmynic-theme-color</code></td>
          <td>Preferenza colore interfaccia</td>
          <td>Fino a cancellazione manuale</td>
        </tr>
        <tr>
          <td><code>ohmynic-theme-hc</code></td>
          <td>Preferenza modalità alto contrasto</td>
          <td>Fino a cancellazione manuale</td>
        </tr>
        <tr>
          <td><code>ohmynic-cookie-notice</code></td>
          <td>Memorizza la chiusura del banner informativo sui cookie</td>
          <td>Fino a cancellazione manuale</td>
        </tr>
        <tr>
          <td><code>ohmynic-analytics-optout</code></td>
          <td>Preferenza di opt-out dalle statistiche interne. Se impostato, nessun dato di visita viene raccolto.</td>
          <td>Fino a cancellazione manuale</td>
        </tr>
      </tbody>
    </table>

    <h3>sessionStorage</h3>
    <p>
      Viene utilizzato per salvare un identificativo temporaneo di sessione per le statistiche interne.
      Il dato esiste solo per la durata della scheda del browser e non viene mantenuto oltre la sessione.
    </p>

    <table>
      <thead>
        <tr>
          <th>Chiave</th>
          <th>Contenuto</th>
          <th>Durata</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>ohmynic-sid</code></td>
          <td>UUID casuale generato lato client per identificare la sessione di navigazione nelle statistiche interne. Non è collegato a nessun profilo o account.</td>
          <td>Durata della scheda del browser</td>
        </tr>
      </tbody>
    </table>

    <h2>5. Analytics interni</h2>

    <p>
      Il sito utilizza un sistema di analytics sviluppato internamente, senza servizi di terze parti.
    </p>

    <h3>Dati raccolti per visita</h3>
    <ul>
      <li>URL della pagina visitata</li>
      <li>Referrer (URL di provenienza), se presente</li>
      <li>Paese di accesso, derivato dall'indirizzo IP tramite Cloudflare — l'indirizzo IP non viene mai memorizzato</li>
      <li>Identificativo di sessione (UUID da sessionStorage, non persistente)</li>
      <li>Progressione di lettura dell'articolo (25%, 50%, 75%, 100%)</li>
    </ul>

    <h3>Dati non raccolti</h3>
    <ul>
      <li>Indirizzo IP</li>
      <li>Dati del dispositivo o del browser (nessun fingerprinting)</li>
      <li>Tracciamento cross-site</li>
      <li>Dati inviati a terze parti</li>
    </ul>

    <h3>Utenti autenticati</h3>
    <p>
      Per i lettori registrati e autenticati, le statistiche di visita possono essere associate all'account
      per fornire funzionalità del servizio (come la cronologia personale). Questo non costituisce profilazione.
    </p>

    <h3>Opt-out e Do Not Track</h3>
    <p>
      Puoi disattivare le statistiche in qualsiasi momento tramite il banner presente nel footer del sito
      oppure dalle impostazioni del browser (segnale Do Not Track). Se l'opt-out è attivo o DNT è abilitato,
      nessun dato di visita viene raccolto né trasmesso.
    </p>

    <h3>Base giuridica</h3>
    <p>
      Il trattamento si basa sul legittimo interesse (art. 6(1)(f) GDPR) al miglioramento del servizio,
      bilanciato con la minimizzazione dei dati e l'assenza di terze parti.
      L'opt-out è disponibile in qualsiasi momento senza che ciò comprometta la fruizione del sito.
    </p>

    <h3>Conservazione</h3>
    <p>
      I dati di analytics vengono conservati per un massimo di 13 mesi, poi eliminati automaticamente.
    </p>

    <h2>6. Contenuti di terze parti e contenuti incorporati</h2>
    <p>
      Il sito non utilizza servizi di analisi o pubblicità di terze parti.
      Non sono presenti pixel di tracciamento, script di profilazione o CDN che raccolgono dati sull'utente.
    </p>

    <h3>Contenuti incorporati (embed)</h3>
    <p>
      Alcuni articoli possono contenere contenuti incorporati da piattaforme esterne
      (YouTube, Spotify, GitHub Gist, Codepen).
      Questi contenuti sono presentati tramite un meccanismo di <strong>caricamento su richiesta</strong>:
      il contenuto di terze parti — inclusi eventuali script, cookie e dati della piattaforma — non viene
      caricato finché l'utente non fa esplicitamente click sul pulsante <strong>Carica</strong>.
    </p>
    <p>
      Finché non si clicca su <strong>Carica</strong>, nessun dato viene trasmesso alle piattaforme
      e nessun cookie di terze parti viene impostato.
    </p>
    <p>
      Cliccando su <strong>Carica</strong> si attiva l'iframe della piattaforma corrispondente.
      Da quel momento si applicano le rispettive informative sulla privacy:
    </p>
    <ul>
      <li><strong>YouTube</strong> (tramite youtube-nocookie.com, versione senza cookie di profilazione) — <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a></li>
      <li><strong>Spotify</strong> — <a href="https://www.spotify.com/legal/privacy-policy/" target="_blank" rel="noopener noreferrer">spotify.com/legal/privacy-policy</a></li>
      <li><strong>GitHub Gist</strong> — <a href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement" target="_blank" rel="noopener noreferrer">docs.github.com/privacy</a></li>
      <li><strong>Codepen</strong> — <a href="https://codepen.io/legal/privacy-policy" target="_blank" rel="noopener noreferrer">codepen.io/legal/privacy-policy</a></li>
    </ul>

    <h2>7. Come gestire cookie e storage locale</h2>
    <p>
      Puoi gestire, bloccare o cancellare cookie e storage locale direttamente dal tuo browser, in genere
      in <strong>Impostazioni → Privacy e sicurezza → Cookie e altri dati dei siti</strong>.
    </p>
    <p>
      Tieni presente che disabilitare i cookie tecnici (<code>auth_session</code>, <code>reader_session</code>)
      impedirà il funzionamento corretto del login.
    </p>

    <h2>8. Diritti dell'interessato</h2>
    <p>In qualità di interessato, hai il diritto di:</p>
    <ul>
      <li><strong>Accesso</strong> — ottenere conferma del trattamento e riceverne copia (art. 15 GDPR)</li>
      <li><strong>Rettifica</strong> — correggere dati inesatti (art. 16 GDPR)</li>
      <li><strong>Cancellazione</strong> — ottenere la cancellazione dei tuoi dati (art. 17 GDPR)</li>
      <li><strong>Limitazione</strong> — limitare il trattamento in determinati casi (art. 18 GDPR)</li>
      <li><strong>Portabilità</strong> — ricevere i tuoi dati in formato strutturato (art. 20 GDPR)</li>
      <li><strong>Opposizione</strong> — opporti al trattamento basato su legittimo interesse (art. 21 GDPR)</li>
    </ul>
    <p>
      Per esercitare i tuoi diritti scrivi a <a href="mailto:niccolo@ohmynic.co">niccolo@ohmynic.co</a>.
      Risponderemo entro 30 giorni.
    </p>

    <h2>9. Reclamo all'autorità di controllo</h2>
    <p>
      Se ritieni che il trattamento dei tuoi dati violi il GDPR, hai il diritto di presentare reclamo al
      <strong>Garante per la protezione dei dati personali</strong>:
      <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">www.garanteprivacy.it</a>.
    </p>

  </div>
</article>

<style>
  .article-wrap {
    max-width: var(--max-width-wide);
    margin: 0 auto;
    padding: var(--space-10) var(--space-8);
  }

  .article-header {
    max-width: var(--max-width-prose);
    margin: 0 auto var(--space-10);
  }

  .article-title {
    font-family: var(--font-serif);
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: 700;
    line-height: 1.2;
    color: var(--color-notte);
    letter-spacing: var(--tracking-tight);
    margin-bottom: var(--space-3);
  }

  .article-updated {
    font-size: var(--text-sm);
    color: var(--color-lilla);
    margin: 0;
  }

  .prose {
    max-width: var(--max-width-prose);
    margin: 0 auto;
    font-size: var(--text-base);
    line-height: var(--leading-relaxed);
    color: var(--color-prugna);
  }

  .prose h2 {
    font-family: var(--font-serif);
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--color-notte);
    margin: var(--space-10) 0 var(--space-4);
    letter-spacing: var(--tracking-tight);
  }

  .prose h3 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-notte);
    margin: var(--space-6) 0 var(--space-3);
  }

  .prose p { margin-bottom: var(--space-4); }

  .prose ul {
    padding-left: var(--space-6);
    margin: var(--space-3) 0 var(--space-4);
  }

  .prose li { margin-bottom: var(--space-2); }

  .prose a {
    color: var(--color-viola);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .prose a:hover { color: var(--color-lavanda); }

  .prose code {
    font-family: monospace;
    font-size: 0.875em;
    background: var(--color-iris);
    padding: 1px 5px;
    border-radius: 4px;
    color: var(--color-viola);
  }

  .prose table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-sm);
    margin: var(--space-4) 0 var(--space-6);
  }

  .prose th {
    text-align: left;
    font-weight: 600;
    color: var(--color-notte);
    padding: var(--space-2) var(--space-3);
    border-bottom: 1.5px solid var(--color-bordo);
    background: var(--color-iris);
  }

  .prose td {
    padding: var(--space-3);
    border-bottom: 0.5px solid var(--color-bordo);
    vertical-align: top;
    line-height: 1.5;
  }

  .prose tr:last-child td { border-bottom: none; }

  @media (max-width: 640px) {
    .article-wrap { padding: var(--space-6) var(--space-4); }
    .prose table { font-size: 0.78rem; }
    .prose th, .prose td { padding: var(--space-2); }
  }
</style>
