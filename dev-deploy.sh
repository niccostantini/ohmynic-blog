#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "→ Build dev in locale (base=/blog-dev)..."
BASE_PATH=/blog-dev npm run build

echo "→ Rsync build/ sul server (dev)..."
rsync -avz --delete build/ root@64.225.70.212:/root/ohmynic-blog-dev/build/

echo "→ Restart PM2 dev..."
ssh root@64.225.70.212 "pm2 restart ohmynic-blog-dev --update-env"

echo "✓ Deploy dev completato — https://ohmynic.co/blog-dev/"
