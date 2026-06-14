#!/bin/bash
set -e
echo "→ Starting ohmynic-blog-dev on server..."
ssh root@64.225.70.212 "pm2 start ohmynic-blog-dev && pm2 status ohmynic-blog-dev"
echo "✓ Dev server started — https://ohmynic.co/blog-dev/"
