-- Add columns to articles table
ALTER TABLE "articles"
  ADD COLUMN IF NOT EXISTS "type" text NOT NULL DEFAULT 'article',
  ADD COLUMN IF NOT EXISTS "show_comments" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "show_in_feed" boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "show_in_navbar" boolean NOT NULL DEFAULT false;

-- Index on type for fast filtering
CREATE INDEX IF NOT EXISTS "articles_type_idx" ON "articles" ("type");

-- Explicitly set existing records
UPDATE "articles" SET "type" = 'article' WHERE "type" != 'page';

-- Nav items table
CREATE TABLE IF NOT EXISTS "nav_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "label" text NOT NULL,
  "url" text,
  "page_id" uuid REFERENCES "articles"("id") ON DELETE SET NULL,
  "type" text NOT NULL DEFAULT 'external',
  "position" integer NOT NULL DEFAULT 0,
  "visible" boolean NOT NULL DEFAULT true,
  "open_in_new_tab" boolean NOT NULL DEFAULT false
);

-- Seed fixed nav items
INSERT INTO "nav_items" ("label", "url", "type", "position", "visible", "open_in_new_tab")
SELECT 'Articoli', '/blog', 'fixed', 0, true, false
WHERE NOT EXISTS (SELECT 1 FROM "nav_items" WHERE "type" = 'fixed' AND "url" = '/blog');

INSERT INTO "nav_items" ("label", "url", "type", "position", "visible", "open_in_new_tab")
SELECT 'Cerca', '/blog/search', 'fixed', 1, true, false
WHERE NOT EXISTS (SELECT 1 FROM "nav_items" WHERE "type" = 'fixed' AND "url" = '/blog/search');
