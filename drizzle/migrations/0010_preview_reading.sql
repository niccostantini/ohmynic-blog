ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "preview_token" text;
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "reading_time_minutes" integer;

-- Seed preview token for existing articles
UPDATE "articles" SET "preview_token" = gen_random_uuid()::text WHERE "preview_token" IS NULL;
