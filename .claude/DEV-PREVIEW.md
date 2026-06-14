# Dev Preview — ohmynic-blog-dev

Ambiente di anteprima separato dalla produzione, usato per testare
feature branch prima del deploy. Gira sullo stesso server ma su porta
e path diversi.

## URL

| Ambiente   | URL                              | Porta |
|------------|----------------------------------|-------|
| Produzione | https://ohmynic.co/blog/         | 3000  |
| Dev        | https://ohmynic.co/blog-dev/     | 3008  |

Il dev ha una password JavaScript (`Amoras3r!`) e meta noindex.
Il server usa `PUBLIC_DEV_PASSWORD` e `PUBLIC_NOINDEX` da `/root/ohmynic-blog-dev/.env`.

## Script locali

```
./dev-deploy.sh   # build locale + rsync + restart PM2
./dev-start.sh    # avvia PM2 dev (se stoppato)
./dev-stop.sh     # stoppa PM2 dev
./deploy-local.sh # deploy PRODUZIONE (branch main)
```

Eseguire sempre dalla root del progetto (`/Users/niccolo/Sites/OhMyNic/blog`).

## Workflow tipico

```bash
# 1. Crea / switcha al branch di feature
git checkout -b feat/mia-feature

# 2. Fai le modifiche al codice

# 3. Deploya sull'ambiente dev per vedere il risultato
./dev-deploy.sh
#    → apri https://ohmynic.co/blog-dev/
#    → password: Amoras3r!

# 4. Itera (step 2-3) finché soddisfatto

# 5. Stoppa il dev quando non ti serve
./dev-stop.sh

# 6. Mergia su main e deploya in produzione
git checkout main && git merge feat/mia-feature
./deploy-local.sh
```

## Come funziona la build dev

`svelte.config.js` legge `process.env.BASE_PATH` (default `/blog`).
`dev-deploy.sh` passa `BASE_PATH=/blog-dev` prima di `npm run build`,
producendo un bundle con tutti i link prefissati `/blog-dev/`.

La build di produzione (`./deploy-local.sh` → `npm run build` senza var)
usa sempre `/blog` — non è influenzata.

## Server — struttura

```
/root/ohmynic-blog/         ← produzione (branch main)
  build/
  .env                      ← PORT=3000, segreti
  ecosystem.config.cjs

/root/ohmynic-blog-dev/     ← dev preview (branch feature)
  build/
  .env                      ← PORT=3008, PUBLIC_DEV_PASSWORD, PUBLIC_NOINDEX
  ecosystem.config.cjs
  package.json              ← copiato da produzione (stessa versione)
```

## Nginx

File: `/etc/nginx/sites-enabled/ohmynic`

Il blocco `/blog-dev` deve stare **prima** di `/blog` (nginx usa first-match):

```nginx
location /blog-dev {
    proxy_pass http://localhost:3008;
    ...
}
location /blog {
    proxy_pass http://localhost:3000;
    ...
}
```

## PM2

```bash
# Sul server
pm2 status                          # stato di tutti i processi
pm2 logs ohmynic-blog-dev --lines 50  # log dev
pm2 logs ohmynic-blog --lines 50      # log produzione
```

## Aggiornare la password dev

```bash
# Sul server
sed -i 's/^PUBLIC_DEV_PASSWORD=.*/PUBLIC_DEV_PASSWORD=NuovaPassword/' \
    /root/ohmynic-blog-dev/.env
pm2 restart ohmynic-blog-dev --update-env
```
