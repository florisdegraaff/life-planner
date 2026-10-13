import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, sources, transactions } from "@/lib/db/schema";
import { formatEuro } from "./format";

const shortDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const formatDate = (date: string) => shortDate.format(new Date(`${date}T00:00:00Z`));

export type SourceOverview = {
  id: string;
  name: string;
  category: string | null;
  count: number;
  first: string;
  last: string;
  spent: string;
  received: string;
  average: string;
  transactions: { id: string; date: string; amount: string; type: "expense" | "income" }[];
};

// Everything from one source across all months, newest first. Null if it isn't the user's.
export async function getSourceOverview(userId: string, sourceId: string): Promise<SourceOverview | null> {
  const [source] = await db
    .select({ id: sources.id, name: sources.name, category: categories.name })
    .from(sources)
    .leftJoin(categories, eq(sources.categoryId, categories.id))
    .where(and(eq(sources.id, sourceId), eq(sources.userId, userId)))
    .limit(1);
  if (!source) return null;

  const rows = await db
    .select({ id: transactions.id, date: transactions.date, amount: transactions.amount, type: transactions.type })
    .from(transactions)
    .where(and(eq(transactions.sourceId, sourceId), eq(transactions.userId, userId)))
    .orderBy(desc(transactions.date), desc(transactions.createdAt));

  const sum = (type: "expense" | "income") =>
    rows.filter((r) => r.type === type).reduce((n, r) => n + Number(r.amount), 0);
  const spent = sum("expense");
  const received = sum("income");

  return {
    ...source,
    count: rows.length,
    first: rows.length ? formatDate(rows[rows.length - 1].date) : "",
    last: rows.length ? formatDate(rows[0].date) : "",
    spent: formatEuro(spent),
    received: formatEuro(received),
    average: formatEuro(rows.length ? (spent + received) / rows.length : 0),
    transactions: rows.map((r) => ({
      id: r.id,
      date: formatDate(r.date),
      type: r.type,
      amount: `${r.type === "income" ? "+" : "−"} ${formatEuro(Number(r.amount))}`,
    })),
  };
}

/** Source names, for picking one when adding a transaction by hand. */
export async function getSourceNames(userId: string) {
  const rows = await db
    .select({ name: sources.name })
    .from(sources)
    .where(eq(sources.userId, userId))
    .orderBy(asc(sources.name));
  // Two sources can share a (renamed) name; list it once.
  return [...new Set(rows.map((r) => r.name))];
}
