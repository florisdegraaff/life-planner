ALTER TABLE "debts" ADD COLUMN "start_date" date DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "recurring_payments" ADD COLUMN "debt_id" uuid;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "debt_id" uuid;--> statement-breakpoint
ALTER TABLE "recurring_payments" ADD CONSTRAINT "recurring_payments_debt_id_debts_id_fk" FOREIGN KEY ("debt_id") REFERENCES "public"."debts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_debt_id_debts_id_fk" FOREIGN KEY ("debt_id") REFERENCES "public"."debts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transactions_debt_id_idx" ON "transactions" USING btree ("debt_id");--> statement-breakpoint
-- Existing debts' balances were entered when they were created, so that's their start date.
UPDATE "debts" SET "start_date" = ("created_at" AT TIME ZONE 'Europe/Amsterdam')::date;
