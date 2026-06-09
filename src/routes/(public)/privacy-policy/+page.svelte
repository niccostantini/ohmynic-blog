<svelte:head>
  <title>Privacy Policy — OhMyNic!</title>
  <meta name="description" content="Informativa sulla privacy di OhMyNic! — come raccogliamo e utilizziamo i dati." />
</svelte:head>

<div class="privacy-page">
  <div class="privacy-content">
    <h1>Privacy Policy</h1>
    <p class="last-updated">Ultimo aggiornamento: giugno 2025</p>

    <section>
      <h2>1. Titolare del trattamento</h2>
      <p>
        OhMyNic! è un blog personale gestito da Niccolò Borgioli. Per qualsiasi domanda relativa alla privacy puoi contattarmi via email all'indirizzo indicato nel sito.
      </p>
    </section>

    <section>
      <h2>2. Dati raccolti e finalità</h2>

      <h3>2.1 Analytics interni (senza cookie)</h3>
      <p>
        Questo sito raccoglie in modo anonimo alcune statistiche di utilizzo per capire quali articoli vengono letti e come gli utenti navigano il sito. Nello specifico registriamo:
      </p>
      <ul>
        <li>La pagina visitata (path URL)</li>
        <li>Il referrer (da dove arriva la visita)</li>
        <li>Un identificatore di sessione anonimo, generato nel tuo browser e valido solo per la sessione corrente (non persiste alla chiusura della scheda)</li>
        <li>La percentuale di lettura degli articoli (25%, 50%, 75%, 100%)</li>
      </ul>
      <p>
        <strong>Non utilizziamo cookie di tracciamento.</strong> Il session ID è salvato in <code>sessionStorage</code> e viene eliminato automaticamente alla chiusura della scheda. Non raccogliamo indirizzi IP in forma identificabile, né utilizziamo servizi di analytics di terze parti (Google Analytics, Meta Pixel, ecc.).
      </p>
      <p>
        <strong>Do Not Track:</strong> se il tuo browser invia l'intestazione <code>DNT: 1</code>, nessun dato viene registrato.
      </p>

      <h3>2.2 Account lettore (opzionale)</h3>
      <p>
        Se scegli di registrarti come lettore, raccogliamo:
      </p>
      <ul>
        <li>Indirizzo email (per l'accesso e le notifiche)</li>
        <li>Nome visualizzato scelto da te</li>
        <li>I commenti che pubblichi</li>
      </ul>
      <p>
        La registrazione è completamente facoltativa. Puoi leggere tutti i contenuti del sito senza creare un account.
      </p>

      <h3>2.3 Commenti</h3>
      <p>
        I commenti pubblicati sono visibili pubblicamente insieme al nome visualizzato dell'autore. Non condividiamo email o altri dati personali con terze parti.
      </p>
    </section>

    <section>
      <h2>3. Base giuridica</h2>
      <p>
        Il trattamento dei dati analytics anonimi è basato sul legittimo interesse (art. 6 par. 1 lett. f GDPR) a comprendere l'utilizzo del sito, senza impatto sui diritti degli utenti data l'assenza di profilazione individuale.
      </p>
      <p>
        Il trattamento dei dati dell'account lettore è basato sul consenso esplicito fornito in fase di registrazione.
      </p>
    </section>

    <section>
      <h2>4. Conservazione dei dati</h2>
      <p>
        I dati analytics anonimi sono conservati per un massimo di 24 mesi. I dati dell'account lettore sono conservati finché l'account è attivo; puoi richiederne la cancellazione in qualsiasi momento.
      </p>
    </section>

    <section>
      <h2>5. Diritti dell'interessato</h2>
      <p>
        Ai sensi del GDPR hai diritto di accedere, rettificare, cancellare i tuoi dati personali, nonché di opporti al trattamento o richiederne la portabilità. Per esercitare questi diritti contattami direttamente via email.
      </p>
    </section>

    <section>
      <h2>6. Hosting e sicurezza</h2>
      <p>
        Il sito è ospitato su un server dedicato (DigitalOcean, UE). Le comunicazioni sono protette tramite HTTPS. Il database non è esposto pubblicamente.
      </p>
    </section>

    <section>
      <h2>7. Modifiche a questa policy</h2>
      <p>
        Eventuali modifiche saranno pubblicate su questa pagina con aggiornamento della data in cima. Non effettuiamo comunicazioni proattive per modifiche minori.
      </p>
    </section>
  </div>
</div>

<style>
  .privacy-page {
    max-width: var(--max-width-prose);
    margin: 0 auto;
    padding: var(--space-12) var(--space-8);
  }

  .privacy-content h1 {
    font-family: var(--font-serif);
    font-size: var(--text-3xl);
    font-weight: 700;
    color: var(--color-notte);
    margin-bottom: var(--space-2);
  }

  .last-updated {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    color: var(--color-lilla);
    margin-bottom: var(--space-10);
  }

  section {
    margin-bottom: var(--space-10);
  }

  h2 {
    font-family: var(--font-serif);
    font-size: var(--text-xl);
    font-weight: 700;
    color: var(--color-notte);
    margin-bottom: var(--space-4);
    margin-top: var(--space-8);
  }

  h3 {
    font-family: var(--font-sans);
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
    margin-bottom: var(--space-2);
    margin-top: var(--space-6);
  }

  p {
    font-family: var(--font-sans);
    font-size: var(--text-base);
    line-height: 1.7;
    color: var(--color-grafite);
    margin-bottom: var(--space-4);
  }

  ul {
    font-family: var(--font-sans);
    font-size: var(--text-base);
    line-height: 1.7;
    color: var(--color-grafite);
    padding-left: var(--space-6);
    margin-bottom: var(--space-4);
  }

  li {
    margin-bottom: var(--space-1);
  }

  code {
    font-family: var(--font-mono);
    font-size: 0.875em;
    background: var(--color-iris);
    color: var(--color-lavanda);
    padding: 1px 5px;
    border-radius: 3px;
  }

  strong {
    font-weight: var(--weight-semibold);
    color: var(--color-notte);
  }
</style>
