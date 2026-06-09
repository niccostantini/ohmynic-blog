-- 1. Add status column (default 'draft' for safety)
ALTER TABLE "articles" ADD COLUMN "status" text NOT NULL DEFAULT 'draft';

-- 2. Migrate existing data
UPDATE "articles" SET "status" = 'published' WHERE "published" = true;
-- articles with published=false keep status='draft' (already the default)

-- 3. Remove published column
ALTER TABLE "articles" DROP COLUMN "published";

-- 4. Add canPublish to users
ALTER TABLE "users" ADD COLUMN "can_publish" boolean NOT NULL DEFAULT false;

-- 5. Create article_status_log table
CREATE TABLE "article_status_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "article_id" uuid NOT NULL REFERENCES "articles"("id") ON DELETE CASCADE,
  "from_status" text,
  "to_status" text NOT NULL,
  "changed_by" text NOT NULL REFERENCES "users"("id"),
  "note" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
