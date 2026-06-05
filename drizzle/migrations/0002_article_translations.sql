-- Create article_translations table
CREATE TABLE "article_translations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "article_id" uuid NOT NULL,
  "locale" text NOT NULL,
  "title" text NOT NULL,
  "content" text NOT NULL,
  "excerpt" text,
  "published" boolean DEFAULT false NOT NULL,
  "published_at" timestamp,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Migrate existing data: copy current articles data as Italian translations
INSERT INTO "article_translations" ("article_id", "locale", "title", "content", "excerpt", "published", "published_at", "updated_at")
SELECT "id", 'it', "title", "content", "excerpt", "published", "published_at", "updated_at"
FROM "articles";
--> statement-breakpoint

-- Add foreign key constraint
ALTER TABLE "article_translations" ADD CONSTRAINT "article_translations_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint

-- Add composite unique constraint
ALTER TABLE "article_translations" ADD CONSTRAINT "article_translations_article_locale_unique" UNIQUE("article_id","locale");
--> statement-breakpoint

-- Remove locale-specific columns from articles
ALTER TABLE "articles" DROP COLUMN "title";
--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "content";
--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "excerpt";
--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "published";
--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "published_at";
