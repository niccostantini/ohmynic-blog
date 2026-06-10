ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "visible_to" text[] NOT NULL DEFAULT '{public}';
