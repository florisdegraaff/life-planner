CREATE UNIQUE INDEX "debts_user_id_name_unique" ON "debts" USING btree ("user_id",lower("name"));--> statement-breakpoint
ALTER TABLE "debts" DROP COLUMN "start_date";