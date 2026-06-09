CREATE TABLE IF NOT EXISTS "feedback" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "type" text NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "url" text,
  "author_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "reader_id" uuid REFERENCES "readers"("id") ON DELETE SET NULL,
  "status" text NOT NULL DEFAULT 'new',
  "created_at" timestamp DEFAULT now() NOT NULL
);
