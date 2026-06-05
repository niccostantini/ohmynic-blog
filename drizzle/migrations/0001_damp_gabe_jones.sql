ALTER TABLE "comments" ADD COLUMN "reply_text" text;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "replied_at" timestamp;