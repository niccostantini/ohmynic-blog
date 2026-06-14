#!/bin/bash
set -e
echo "→ Stopping ohmynic-blog-dev on server..."
ssh root@64.225.70.212 "pm2 stop ohmynic-blog-dev && pm2 status ohmynic-blog-dev"
echo "✓ Dev server stopped."
