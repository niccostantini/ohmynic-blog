# Deploy su DigitalOcean — ohmynic.co

## Prerequisiti sul droplet (una volta sola)

### Node.js 20+
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### PM2
```bash
npm install -g pm2
```

### Caddy
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy
```

### PostgreSQL (se non già installato)
```bash
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres psql -c "CREATE USER ohmynic WITH PASSWORD 'SCEGLI-PASSWORD-SICURA';"
sudo -u postgres psql -c "CREATE DATABASE ohmynic_blog OWNER ohmynic;"
```

---

## Primo deploy

### 1. Clona il repository
```bash
cd ~
git clone git@github.com:TUO_USERNAME/ohmynic-blog.git
cd ohmynic-blog
```

### 2. Crea il file .env di produzione
```bash
cp .env.example .env
nano .env
```

Compila con i valori reali:
```bash
DATABASE_URL="postgresql://ohmynic:TUA-PASSWORD@localhost:5432/ohmynic_blog"
AUTH_SECRET="$(openssl rand -base64 32)"
ADMIN_USERNAME="tuonome"
ADMIN_PASSWORD="password-molto-sicura"
```

> **Non committare mai `.env`** — è già in `.gitignore`.

### 3. Installa le dipendenze e builda
```bash
npm install
npm run build
```

### 4. Applica le migrazioni e crea l'utente admin
```bash
npm run db:migrate
npm run db:seed
```

### 5. Configura Caddy
```bash
sudo cp Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

### 6. Avvia con PM2
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup   # segui le istruzioni per abilitare l'avvio automatico
```

### 7. Verifica
```bash
pm2 status
curl -I https://ohmynic.co
```

---

## Deploy successivi

SSH sul droplet e:
```bash
cd ~/ohmynic-blog
git pull origin main
npm install --omit=dev
npm run build
npm run db:migrate   # solo se ci sono nuove migrazioni
pm2 restart ohmynic-blog
```

Oppure usa lo script automatico:
```bash
./deploy.sh
```

---

## Script deploy.sh

Crea il file sul droplet (una volta sola):
```bash
cat > ~/ohmynic-blog/deploy.sh << 'EOF'
#!/bin/bash
set -e
cd ~/ohmynic-blog
git pull origin main
npm install --omit=dev
npm run build
npm run db:migrate
pm2 restart ohmynic-blog
echo "Deploy completato."
EOF
chmod +x ~/ohmynic-blog/deploy.sh
```

---

## Comandi utili sul droplet

```bash
# Logs in tempo reale
pm2 logs ohmynic-blog

# Stato processi
pm2 status

# Riavvio
pm2 restart ohmynic-blog

# Stop
pm2 stop ohmynic-blog

# Logs Caddy
sudo journalctl -u caddy -f

# Stato Caddy
sudo systemctl status caddy
```

---

## Troubleshooting

| Problema | Soluzione |
|---|---|
| 502 Bad Gateway | PM2 non è avviato — `pm2 start ecosystem.config.cjs` |
| Errore DB | Verifica `DATABASE_URL` in `.env` e che Postgres sia attivo |
| Certificato SSL mancante | Caddy lo genera automaticamente — attendi 30s e riprova |
| Porta 3000 occupata | `pm2 delete all && pm2 start ecosystem.config.cjs` |
