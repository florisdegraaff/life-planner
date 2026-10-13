import "server-only";

import { and, asc, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { alias } from "drizzle-orm/pg-core";
import { categories, recurringPayments, sources, transactions } from "@/lib/db/schema";
import { type Month, monthRange } from "./month";

export async function getCategoryNames(userId: string) {
  const rows = await db
    .select({ name: categories.name })
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(asc(categories.name));
  return rows.map((r) => r.name);
}

const sourceCategories = alias(categories, "source_categories");
const recurringCategories = alias(categories, "recurring_categories");

// The month's expenses per category, largest first. A transaction counts towards its own
// category, else its recurring payment's (unless marked not recurring), else its source's.
// `name` is null for uncategorised spending.
export async function getSpendingByCategory(userId: string, month: Month) {
  const { start, end } = monthRange(month);
  const name = sql<string | null>`coalesce(
    ${categories.name},
    case when ${recurringPayments.ignored} then null else ${recurringCategories.name} end,
    ${sourceCategories.name}
  )`;
  const total = sql<string>`sum(${transactions.amount})`;

  const rows = await db
    .select({ name, total })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .leftJoin(sources, eq(transactions.sourceId, sources.id))
    .leftJoin(sourceCategories, eq(sources.categoryId, sourceCategories.id))
    .leftJoin(recurringPayments, eq(transactions.recurringPaymentId, recurringPayments.id))
    .leftJoin(recurringCategories, eq(recurringPayments.categoryId, recurringCategories.id))
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, "expense"),
        gte(transactions.date, start),
        lt(transactions.date, end),
      ),
    )
    .groupBy(name)
    .orderBy(desc(total));

  return rows.map((r) => ({ name: r.name, total: Number(r.total) }));
}
