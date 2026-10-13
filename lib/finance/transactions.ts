import "server-only";

import { and, desc, eq, gte, lt, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { alias } from "drizzle-orm/pg-core";
import { categories, debts, recurringPayments, sources, transactions } from "@/lib/db/schema";
import { effectiveDebtId } from "./debts";
import { formatEuro } from "./format";
import { type Month, monthRange } from "./month";

const sourceCategories = alias(categories, "source_categories");
const recurringCategories = alias(categories, "recurring_categories");
const recurringDebts = alias(debts, "recurring_debts");

const longDate = new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeZone: "UTC" });

const intervalLabel = { weekly: "Weekly", monthly: "Monthly", quarterly: "Quarterly", yearly: "Yearly" } as const;

export type TransactionRow = {
  id: string;
  date: string;
  longDate: string;
  // Unformatted, for the edit form: "2026-09-29" and "9.99".
  isoDate: string;
  plainAmount: string;
  description: string;
  sourceId: string | null;
  // The source's (possibly renamed) name; falls back to the bank description.
  source: string;
  // The category in effect: the transaction's own, else its recurring payment's, else its source's.
  category: string | null;
  // Where `category` comes from, when it isn't the transaction's own.
  categoryFrom: "recurring" | "source" | null;
  ownCategory: string | null;
  // What the transaction would fall back to without its own category.
  inheritedCategory: string | null;
  recurring: {
    id: string;
    name: string;
    // "Monthly", "Yearly", …
    interval: string;
    amount: string;
    dayOfMonth: number | null;
    category: string | null;
    active: boolean;
    // Marked "not recurring": the transaction counts as one-off.
    ignored: boolean;
    // Name of the debt all its payments add to or pay off.
    debt: string | null;
  } | null;
  // The debt this transaction adds to (income) or pays off (expense): its own, else its recurring payment's.
  debt: { id: string; name: string; via: "transaction" | "recurring" } | null;
  // Name of the debt set on the transaction itself.
  ownDebt: string | null;
  type: (typeof transactions.$inferSelect)["type"];
  amount: string;
  account: string | null;
  counterparty: string | null;
  code: string | null;
  paymentMethod: string | null;
  notes: string | null;
};

// The user's transactions in the given month, newest first, formatted for display.
export async function getTransactions(userId: string, month: Month): Promise<TransactionRow[]> {
  const { start, end } = monthRange(month);
  return queryTransactions(userId, and(gte(transactions.date, start), lt(transactions.date, end))!);
}

// Every transaction that adds to or pays off a debt, across all months, newest first.
export async function getDebtTransactions(userId: string, debtId: string): Promise<TransactionRow[]> {
  return queryTransactions(userId, eq(effectiveDebtId, debtId));
}

async function queryTransactions(userId: string, where: SQL): Promise<TransactionRow[]> {
  const rows = await db
    .select({
      id: transactions.id,
      date: transactions.date,
      description: transactions.description,
      sourceId: transactions.sourceId,
      sourceName: sources.name,
      ownCategory: categories.name,
      sourceCategory: sourceCategories.name,
      recurringId: recurringPayments.id,
      recurringName: recurringPayments.name,
      recurringInterval: recurringPayments.interval,
      recurringAmount: recurringPayments.amount,
      recurringDay: recurringPayments.dayOfMonth,
      recurringActive: recurringPayments.active,
      recurringIgnored: recurringPayments.ignored,
      recurringCategory: recurringCategories.name,
      recurringDebt: recurringDebts.name,
      ownDebtId: transactions.debtId,
      debtId: debts.id,
      debtName: debts.name,
      type: transactions.type,
      amount: transactions.amount,
      account: transactions.account,
      counterparty: transactions.counterparty,
      code: transactions.code,
      paymentMethod: transactions.paymentMethod,
      notes: transactions.notes,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .leftJoin(sources, eq(transactions.sourceId, sources.id))
    .leftJoin(sourceCategories, eq(sources.categoryId, sourceCategories.id))
    .leftJoin(recurringPayments, eq(transactions.recurringPaymentId, recurringPayments.id))
    .leftJoin(recurringCategories, eq(recurringPayments.categoryId, recurringCategories.id))
    .leftJoin(recurringDebts, eq(recurringPayments.debtId, recurringDebts.id))
    .leftJoin(debts, eq(debts.id, effectiveDebtId))
    .where(and(eq(transactions.userId, userId), where))
    .orderBy(desc(transactions.date), desc(transactions.createdAt));

  return rows.map((r) => {
    const [year, month, day] = r.date.split("-");
    // An ignored recurring payment doesn't lend its category.
    const recurringCategory = r.recurringIgnored ? null : r.recurringCategory;
    const inheritedCategory = recurringCategory ?? r.sourceCategory;
    return {
      id: r.id,
      date: `${day}-${month}`,
      longDate: longDate.format(Date.UTC(Number(year), Number(month) - 1, Number(day))),
      isoDate: r.date,
      plainAmount: r.amount,
      description: r.description,
      sourceId: r.sourceId,
      source: r.sourceName ?? r.description,
      category: r.ownCategory ?? inheritedCategory,
      categoryFrom: r.ownCategory ? null : recurringCategory ? "recurring" : r.sourceCategory ? "source" : null,
      ownCategory: r.ownCategory,
      inheritedCategory,
      recurring: r.recurringId
        ? {
            id: r.recurringId,
            name: r.recurringName!,
            interval: intervalLabel[r.recurringInterval!],
            amount: formatEuro(Number(r.recurringAmount)),
            dayOfMonth: r.recurringDay,
            category: r.recurringCategory,
            active: r.recurringActive!,
            ignored: r.recurringIgnored!,
            debt: r.recurringDebt,
          }
        : null,
      debt: r.debtId ? { id: r.debtId, name: r.debtName!, via: r.ownDebtId ? "transaction" : "recurring" } : null,
      ownDebt: r.ownDebtId ? r.debtName : null,
      type: r.type,
      amount: `${r.type === "income" ? "+" : "−"} ${formatEuro(Number(r.amount))}`,
      account: r.account,
      counterparty: r.counterparty,
      code: r.code,
      paymentMethod: r.paymentMethod,
      notes: r.notes,
    };
  });
}
