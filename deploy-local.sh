#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "→ Build in locale..."
npm run build

echo "→ Rsync build/ sul server..."
rsync -avz --delete build/ root@64.225.70.212:/root/ohmynic-blog/build/

echo "→ Git pull + migrate + restart sul server..."
ssh root@64.225.70.212 "cd /root/ohmynic-blog && git pull && npm install --omit=dev --prefer-offline && npm run db:migrate; pm2 restart ohmynic-blog"

echo "✓ Deploy completato."
