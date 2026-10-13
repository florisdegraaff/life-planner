// Drizzle table definitions. Add tables here and run `npm run db:generate`
// followed by `npm run db:migrate` to apply them.

import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name"),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  // Case-insensitive so "Me@example.com" and "me@example.com" can't both sign up.
  (t) => [uniqueIndex("users_email_unique").on(sql`lower(${t.email})`)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const sessions = pgTable(
  "sessions",
  {
    // SHA-256 of the token in the session cookie, never the token itself.
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);

export type Session = typeof sessions.$inferSelect;

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  // Category names are unique per user, ignoring case.
  (t) => [uniqueIndex("categories_user_id_name_unique").on(t.userId, sql`lower(${t.name})`)],
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

// Who a transaction was with, e.g. "Netflix". Imports match on `key`, so renaming `name` keeps
// future transactions from the same bank description on this source.
export const sources = pgTable(
  "sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // The bank description, lowercased with whitespace collapsed (see sourceKey()).
    key: text("key").notNull(),
    name: text("name").notNull(),
    // Default category for its transactions; a transaction's own category takes precedence.
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex("sources_user_id_key_unique").on(t.userId, t.key)],
);

export type Source = typeof sources.$inferSelect;

export const transactionType = pgEnum("transaction_type", ["expense", "income"]);

export const recurringInterval = pgEnum("recurring_interval", ["weekly", "monthly", "quarterly", "yearly"]);

// A payment that repeats, e.g. a Netflix subscription or a salary. Detected automatically from
// imported transactions (see lib/finance/recurring.ts), which link to it via recurringPaymentId.
export const recurringPayments = pgTable(
  "recurring_payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: transactionType("type").notNull(),
    // The latest amount; matching new transactions allows for price changes around it.
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    interval: recurringInterval("interval").notNull(),
    // Typical day of the month it's paid; null for weekly payments.
    dayOfMonth: integer("day_of_month"),
    lastDate: date("last_date").notNull(),
    // False once it stops showing up; its history stays linked.
    active: boolean("active").notNull().default(true),
    // Marked "not recurring" by the user: its transactions count as one-off, and it stays so
    // the sync keeps them linked here instead of detecting the pattern again.
    ignored: boolean("ignored").notNull().default(false),
    // Between a transaction's own category and its source's in precedence.
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    // All its transactions add to (income) or pay off (expense) this debt, unless they set their own.
    debtId: uuid("debt_id").references(() => debts.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("recurring_payments_user_id_idx").on(t.userId), index("recurring_payments_source_id_idx").on(t.sourceId)],
);

export type RecurringPayment = typeof recurringPayments.$inferSelect;

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Each transaction has at most one category; deleting a category leaves its transactions uncategorised.
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
    recurringPaymentId: uuid("recurring_payment_id").references(() => recurringPayments.id, { onDelete: "set null" }),
    // Income borrowed into this debt, or an expense paying it off. Overrides the recurring payment's debt.
    debtId: uuid("debt_id").references(() => debts.id, { onDelete: "set null" }),
    date: date("date").notNull(),
    description: text("description").notNull(),
    type: transactionType("type").notNull(),
    // Always positive; `type` determines whether it adds or subtracts. Returned as a string to avoid float rounding.
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    // Extra details from the bank export; null for manual entries.
    account: text("account"),
    counterparty: text("counterparty"),
    code: text("code"),
    paymentMethod: text("payment_method"),
    notes: text("notes"),
    // Hash of the source CSV row, so importing an overlapping export twice doesn't duplicate rows. Null for manual entries.
    importHash: text("import_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("transactions_user_id_date_idx").on(t.userId, t.date),
    index("transactions_category_id_idx").on(t.categoryId),
    index("transactions_source_id_idx").on(t.sourceId),
    index("transactions_recurring_payment_id_idx").on(t.recurringPaymentId),
    index("transactions_debt_id_idx").on(t.debtId),
    uniqueIndex("transactions_user_id_import_hash_unique").on(t.userId, t.importHash),
  ],
);

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export const debts = pgTable(
  "debts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    // The balance before its first linked transaction: amount borrowed and still to pay. Every linked
    // transaction is added on top (income borrows more, expenses pay off), see lib/finance/debts.ts.
    totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
    remainingAmount: numeric("remaining_amount", { precision: 12, scale: 2 }).notNull(),
    // Optional, used to estimate when the debt will be paid off; falls back to a linked recurring payment.
    monthlyPayment: numeric("monthly_payment", { precision: 12, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("debts_user_id_idx").on(t.userId),
    // Debts are picked by name (like categories), so names are unique per user, ignoring case.
    uniqueIndex("debts_user_id_name_unique").on(t.userId, sql`lower(${t.name})`),
  ],
);

export type Debt = typeof debts.$inferSelect;
export type NewDebt = typeof debts.$inferInsert;

export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
}));

export const sourcesRelations = relations(sources, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  category: one(categories, { fields: [transactions.categoryId], references: [categories.id] }),
  source: one(sources, { fields: [transactions.sourceId], references: [sources.id] }),
  recurringPayment: one(recurringPayments, {
    fields: [transactions.recurringPaymentId],
    references: [recurringPayments.id],
  }),
}));

export const recurringPaymentsRelations = relations(recurringPayments, ({ one, many }) => ({
  source: one(sources, { fields: [recurringPayments.sourceId], references: [sources.id] }),
  transactions: many(transactions),
}));
