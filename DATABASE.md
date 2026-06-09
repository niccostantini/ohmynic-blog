# Gestione Database — OhMyNic!

---

## Drizzle Studio — locale

Interfaccia web per esplorare e modificare il database locale.

```bash
npm run db:studio
```

Apri: **http://localhost:4983**

Cosa puoi fare:
- Visualizzare e modificare record
- Eseguire query SQL custom
- Esplorare le relazioni tra tabelle
- Vedere lo schema di tutte le tabelle

> **Nota:** usa il DB locale definito in `.env` — non tocca mai la produzione.

---

## Accesso al DB di produzione via Drizzle Studio

> **Attenzione: stai modificando dati reali — procedi con cautela.**

### 1. Avvia Studio sul server

In un terminale, SSH sul droplet e lancia Studio:

```bash
ssh root@64.225.70.212
cd ~/ohmynic-blog
npm run db:studio
```

Lascia questo terminale aperto — Studio deve restare in esecuzione.

### 2. Apri il tunnel verso Studio

In un **secondo terminale** sul tuo Mac:

```bash
ssh -L 4983:localhost:4983 root@64.225.70.212
```

Lascia aperto anche questo.

### 3. Apri nel browser

Vai su **https://local.drizzle.studio** — ora Studio è connesso al DB di produzione.

### 4. Chiudi quando hai finito

`Ctrl+C` in entrambi i terminali — nessuna porta rimane esposta.

---

## Client desktop alternativi

Se preferisci un client nativo invece del browser:

| Client | Piattaforma | Link | Tunnel SSH |
|---|---|---|---|
| **TablePlus** | macOS | tableplus.com | Nativo — configura in Connection → SSH |
| **Beekeeper Studio** | macOS / Windows / Linux | beekeeperstudio.io | Nativo — open source |

Parametri di connessione:

| Campo | Valore |
|---|---|
| Host | `localhost` |
| Port | `5433` |
| Database | `ohmynic_blog` |
| User | `ohmynic` |
| Password | vedi `.env.tunnel` |
| SSH Host | `64.225.70.212` |
| SSH User | `root` |

---

## Sicurezza

- Il tunnel è attivo solo mentre sei connesso — zero porte esposte su internet
- Drizzle Studio non richiede modifiche al server di produzione
