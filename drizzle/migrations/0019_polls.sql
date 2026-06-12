CREATE TABLE IF NOT EXISTS "polls" (
  "id" uuid PRIMARY KEY,
  "article_id" uuid NOT NULL REFERENCES "articles"("id") ON DELETE CASCADE,
  "question" text NOT NULL,
  "allow_multiple" boolean NOT NULL DEFAULT false,
  "closed" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "poll_options" (
  "id" uuid PRIMARY KEY,
  "poll_id" uuid NOT NULL REFERENCES "polls"("id") ON DELETE CASCADE,
  "label" text NOT NULL,
  "position" integer NOT NULL DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "poll_votes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "poll_id" uuid NOT NULL REFERENCES "polls"("id") ON DELETE CASCADE,
  "option_id" uuid NOT NULL REFERENCES "poll_options"("id") ON DELETE RESTRICT,
  "reader_id" uuid NOT NULL REFERENCES "readers"("id") ON DELETE CASCADE,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "poll_votes_reader_option_unique" UNIQUE("reader_id", "option_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "poll_options_poll_id_idx" ON "poll_options"("poll_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "poll_votes_poll_id_idx" ON "poll_votes"("poll_id");
