<svelte:head>
  <title>Cookie policy — OhMyNic!</title>
  <meta name="description" content="Informativa sull'uso di cookie e storage locale su OhMyNic!" />
  <meta name="robots" content="noindex" />
</svelte:head>

<article class="article-wrap is-page">
  <div class="article-header">
    <h1 class="article-title">Cookie policy</h1>
    <p class="article-updated">Ultimo aggiornamento: 13 giugno 2026</p>
  </div>

  <div class="prose">

    <h2>1. Titolare del trattamento</h2>
    <p>
      Il titolare del trattamento dei dati personali raccolti tramite questo sito è
      <strong>Niccolò Costantini</strong>, contattabile all'indirizzo
      <a href="mailto:privacy@ohmynic.co">privacy@ohmynic.co</a>.
    </p>

    <h2>2. Cosa sono cookie e storage locale</h2>
    <p>
      I <strong>cookie</strong> sono piccoli file di testo salvati dal browser sul tuo dispositivo quando visiti un sito.
      Questo sito usa anche il <strong>localStorage</strong> e il <strong>sessionStorage</strong> del browser,
      meccanismi analoghi ai cookie ma gestiti interamente dal tuo browser, non trasmessi automaticamente al server
      a ogni richiesta.
    </p>

    <h2>3. Cookie impostati da questo sito</h2>
    <p>
      Questo sito non usa cookie di profilazione, cookie pubblicitari o cookie di terze parti.
      I soli cookie impostati sono tecnici e strettamente necessari al funzionamento del servizio.
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
          <td>Sessione di autenticazione per gli utenti staff/admin del CMS. Impostato esclusivamente dopo il login su <code>/admin-login</code>; non riguarda i visitatori del blog.</td>
          <td>30 giorni (o fino al logout)</td>
          <td>HttpOnly, Secure, SameSite=Strict</td>
        </tr>
        <tr>
          <td><code>reader_session</code></td>
          <td>Sessione di autenticazione per i lettori registrati. Impostato solo dopo il login volontario su <code>/login</code>; i visitatori non registrati non ricevono questo cookie.</td>
          <td>30 giorni (o fino al logout)</td>
          <td>HttpOnly, Secure, SameSite=Lax</td>
        </tr>
      </tbody>
    </table>

    <p>
      Entrambi i cookie sono <strong>strettamente necessari</strong> per fornire il servizio di autenticazione
      richiesto esplicitamente dall'utente. Ai sensi dell'art. 5(3) della Direttiva ePrivacy non è richiesto
      il consenso per cookie strettamente necessari.
    </p>

    <h2>4. Storage locale (localStorage e sessionStorage)</h2>
    <p>
      Il sito salva alcune preferenze estetiche nel <strong>localStorage</strong> del tuo browser.
      Questi dati non vengono mai trasmessi al server e non contengono dati personali.
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
          <td>Preferenza tema: <code>light</code>, <code>dark</code> o <code>system</code></td>
          <td>Fino a cancellazione manuale</td>
        </tr>
        <tr>
          <td><code>ohmynic-theme-color</code></td>
          <td>Preferenza colore dell'interfaccia</td>
          <td>Fino a cancellazione manuale</td>
        </tr>
        <tr>
          <td><code>ohmynic-theme-hc</code></td>
          <td>Preferenza modalità alto contrasto (<code>on</code>/<code>off</code>)</td>
          <td>Fino a cancellazione manuale</td>
        </tr>
      </tbody>
    </table>

    <p>
      Nel <strong>sessionStorage</strong> viene salvato temporaneamente un identificativo di sessione
      per l'analytics interno (vedi sezione 5). Questo dato esiste solo per la durata della scheda del browser
      e viene eliminato automaticamente alla sua chiusura.
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
          <td>UUID casuale generato lato client, usato come identificativo di sessione per l'analytics. Non è collegato a nessun profilo o account.</td>
          <td>Durata della scheda del browser (sessionStorage)</td>
        </tr>
      </tbody>
    </table>

    <h2>5. Analytics interni</h2>
    <p>
      Questo sito raccoglie statistiche di utilizzo tramite un sistema di analytics sviluppato internamente,
      senza ricorrere a strumenti di terze parti (come Google Analytics).
    </p>

    <h3>Dati raccolti per ogni visita</h3>
    <ul>
      <li><strong>URL della pagina</strong> visitata</li>
      <li><strong>URL di provenienza</strong> (referrer), se presente</li>
      <li><strong>Paese</strong> di accesso, derivato dall'indirizzo IP tramite il servizio Cloudflare — <em>l'indirizzo IP non viene mai memorizzato</em></li>
      <li><strong>Identificativo di sessione</strong> (l'UUID da sessionStorage descritto sopra) — pseudonimo, non persistente oltre la sessione</li>
      <li><strong>Percentuale di lettura</strong> dell'articolo (25%, 50%, 75%, 100%), quando il lettore scorre la pagina</li>
    </ul>

    <h3>Dati NON raccolti</h3>
    <ul>
      <li>Indirizzo IP</li>
      <li>Dati del dispositivo o del browser (nessun fingerprinting)</li>
      <li>Dati comportamentali cross-sito</li>
      <li>Qualsiasi dato trasmesso a terze parti</li>
    </ul>

    <h3>Lettori registrati</h3>
    <p>
      Se sei loggato come lettore, le statistiche di visita vengono associate al tuo account.
      Questo consente funzionalità come la cronologia degli articoli letti nel tuo profilo.
    </p>

    <h3>Do Not Track</h3>
    <p>
      Questo sito rispetta il segnale <strong>Do Not Track (DNT)</strong> del browser.
      Se DNT è attivato nelle impostazioni del tuo browser, nessun dato di analytics viene raccolto né trasmesso.
    </p>

    <h3>Base giuridica</h3>
    <p>
      Il trattamento a fini di analytics si basa sul <strong>legittimo interesse</strong> del titolare
      (art. 6(1)(f) GDPR) a comprendere l'utilizzo del sito per migliorarne i contenuti.
      L'interesse legittimo è bilanciato con la minimizzazione dei dati: nessun IP memorizzato,
      nessuna terza parte coinvolta, identificativo non persistente, rispetto del segnale DNT.
    </p>

    <h3>Conservazione</h3>
    <p>
      I dati di analytics vengono conservati per un massimo di <strong>13 mesi</strong>,
      dopo i quali vengono eliminati automaticamente.
    </p>

    <h2>6. Nessun cookie di terze parti</h2>
    <p>
      Questo sito non carica contenuti da social network, reti pubblicitarie o servizi di analisi di terze parti
      che potrebbero impostare cookie sul tuo browser. Non sono presenti pulsanti di condivisione social
      con tracciamento esterno, pixel di conversione o script di profilazione.
    </p>

    <h2>7. Come gestire cookie e storage locale</h2>
    <p>
      Puoi controllare e cancellare cookie e storage locale direttamente dal tuo browser. I passaggi variano
      a seconda del browser utilizzato; in generale li trovi in <strong>Impostazioni → Privacy e sicurezza</strong>.
    </p>
    <p>
      Tieni presente che disabilitare i cookie tecnici (<code>auth_session</code>, <code>reader_session</code>)
      impedirà il corretto funzionamento del login.
    </p>

    <h2>8. I tuoi diritti</h2>
    <p>In qualità di interessato, hai il diritto di:</p>
    <ul>
      <li><strong>Accesso</strong> — ottenere conferma se stiamo trattando dati che ti riguardano e riceverne copia (art. 15 GDPR)</li>
      <li><strong>Rettifica</strong> — correggere dati inesatti (art. 16 GDPR)</li>
      <li><strong>Cancellazione</strong> — ottenere la cancellazione dei tuoi dati (art. 17 GDPR)</li>
      <li><strong>Limitazione</strong> — limitare il trattamento in determinati casi (art. 18 GDPR)</li>
      <li><strong>Portabilità</strong> — ricevere i tuoi dati in formato strutturato (art. 20 GDPR)</li>
      <li><strong>Opposizione</strong> — opporti al trattamento basato sul legittimo interesse (art. 21 GDPR)</li>
    </ul>
    <p>
      Per esercitare questi diritti scrivi a <a href="mailto:privacy@ohmynic.co">privacy@ohmynic.co</a>.
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

  .prose p {
    margin-bottom: var(--space-4);
  }

  .prose ul {
    padding-left: var(--space-6);
    margin: var(--space-3) 0 var(--space-4);
  }

  .prose li {
    margin-bottom: var(--space-2);
  }

  .prose a {
    color: var(--color-viola);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .prose a:hover {
    color: var(--color-lavanda);
  }

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

  .prose tr:last-child td {
    border-bottom: none;
  }

  @media (max-width: 640px) {
    .article-wrap {
      padding: var(--space-6) var(--space-4);
    }

    .prose table {
      font-size: 0.78rem;
    }

    .prose th,
    .prose td {
      padding: var(--space-2);
    }
  }
</style>
