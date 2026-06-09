CREATE TABLE IF NOT EXISTS "page_views" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "article_id" uuid REFERENCES "articles"("id") ON DELETE SET NULL,
  "path" text NOT NULL,
  "referrer" text,
  "user_agent" text,
  "country" text,
  "reader_id" uuid REFERENCES "readers"("id") ON DELETE SET NULL,
  "session_id" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "article_read_completions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "article_id" uuid NOT NULL REFERENCES "articles"("id") ON DELETE CASCADE,
  "session_id" text NOT NULL,
  "percentage" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "pv_created_at_idx"  ON "page_views" ("created_at");
CREATE INDEX IF NOT EXISTS "pv_article_id_idx"  ON "page_views" ("article_id");
CREATE INDEX IF NOT EXISTS "pv_session_id_idx"  ON "page_views" ("session_id");
CREATE INDEX IF NOT EXISTS "arc_article_id_idx" ON "article_read_completions" ("article_id");
