ALTER TABLE "article_status_log" DROP COLUMN IF EXISTS "note";

CREATE TABLE "editorial_comments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "article_id" uuid NOT NULL REFERENCES "articles"("id") ON DELETE CASCADE,
  "author_id" text NOT NULL REFERENCES "users"("id"),
  "content" text NOT NULL,
  "parent_id" uuid REFERENCES "editorial_comments"("id"),
  "workflow_event" text,
  "from_status" text,
  "to_status" text,
  "block_id" text,
  "block_snapshot" text,
  "block_type" text,
  "block_orphaned" boolean NOT NULL DEFAULT false,
  "block_content_changed" boolean NOT NULL DEFAULT false,
  "resolved_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now()
);
