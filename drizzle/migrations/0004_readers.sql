CREATE TABLE "readers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" text NOT NULL UNIQUE,
  "display_name" text NOT NULL,
  "password_hash" text NOT NULL,
  "email_verified" boolean NOT NULL DEFAULT false,
  "verification_token" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "reader_sessions" (
  "id" text PRIMARY KEY,
  "reader_id" uuid NOT NULL REFERENCES "readers"("id") ON DELETE CASCADE,
  "expires_at" timestamptz NOT NULL
);

CREATE TABLE "reader_bookmarks" (
  "reader_id" uuid NOT NULL REFERENCES "readers"("id") ON DELETE CASCADE,
  "article_id" uuid NOT NULL REFERENCES "articles"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now() NOT NULL,
  PRIMARY KEY ("reader_id", "article_id")
);

ALTER TABLE "comments" ADD COLUMN "reader_id" uuid REFERENCES "readers"("id");
