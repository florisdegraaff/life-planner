CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "source_id" uuid;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sources_user_id_key_unique" ON "sources" USING btree ("user_id","key");--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transactions_source_id_idx" ON "transactions" USING btree ("source_id");--> statement-breakpoint
-- Backfill: one source per distinct bank description, named after its most recent spelling.
INSERT INTO "sources" ("user_id", "key", "name")
SELECT "user_id",
       regexp_replace(lower(trim("description")), '\s+', ' ', 'g'),
       (array_agg(regexp_replace(trim("description"), '\s+', ' ', 'g') ORDER BY "date" DESC))[1]
FROM "transactions"
GROUP BY "user_id", regexp_replace(lower(trim("description")), '\s+', ' ', 'g');--> statement-breakpoint
UPDATE "transactions" t
SET "source_id" = s."id"
FROM "sources" s
WHERE s."user_id" = t."user_id"
  AND s."key" = regexp_replace(lower(trim(t."description")), '\s+', ' ', 'g');
