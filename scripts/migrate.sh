#!/bin/bash
# Applica le migrazioni Drizzle direttamente via psql.
# Usa SHA256 del contenuto SQL per evitare doppia applicazione.
# Più affidabile di drizzle-kit migrate sul server di produzione.
set -euo pipefail

DB_URL="${DATABASE_URL:-}"
if [ -z "$DB_URL" ]; then
  if [ -f .env ]; then
    DB_URL=$(grep '^DATABASE_URL=' .env | cut -d'=' -f2- | tr -d '"')
  fi
fi
if [ -z "$DB_URL" ]; then
  echo "ERROR: DATABASE_URL non trovato" >&2
  exit 1
fi

# Crea la tabella se non esiste ancora
psql "$DB_URL" -c "
  CREATE TABLE IF NOT EXISTS __drizzle_migrations (
    id serial PRIMARY KEY,
    hash text NOT NULL UNIQUE,
    created_at bigint
  );
" -q

applied=0
for sql_file in drizzle/migrations/*.sql; do
  [ -f "$sql_file" ] || continue
  hash=$(sha256sum "$sql_file" | awk '{print $1}')
  exists=$(psql "$DB_URL" -tAc "SELECT COUNT(*) FROM __drizzle_migrations WHERE hash = '$hash'")
  if [ "$exists" = "0" ]; then
    echo "→ Applying: $(basename "$sql_file")"
    psql "$DB_URL" -f "$sql_file" -q
    psql "$DB_URL" -c "INSERT INTO __drizzle_migrations (hash, created_at) VALUES ('$hash', $(date +%s)000)" -q
    applied=$((applied + 1))
  fi
done

if [ "$applied" -eq 0 ]; then
  echo "✓ Migrations: nessuna nuova migrazione da applicare."
else
  echo "✓ Migrations: $applied migrazione/i applicata/e."
fi
