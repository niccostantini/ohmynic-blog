-- Multi-author system: roles, user profile fields, authorId on articles

ALTER TABLE "users"
  ADD COLUMN "role" text NOT NULL DEFAULT 'contributor',
  ADD COLUMN "display_name" text,
  ADD COLUMN "bio" text,
  ADD COLUMN "avatar_url" text,
  ADD COLUMN "active" boolean NOT NULL DEFAULT true,
  ADD COLUMN "must_change_password" boolean NOT NULL DEFAULT false;

-- Promuovi l'utente esistente ad admin
UPDATE "users" SET "role" = 'admin' WHERE "role" = 'contributor';

ALTER TABLE "articles"
  ADD COLUMN "author_id" text REFERENCES "users"("id");

-- Assegna gli articoli esistenti all'unico utente admin
UPDATE "articles" SET "author_id" = (SELECT "id" FROM "users" LIMIT 1) WHERE "author_id" IS NULL;
