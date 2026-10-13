import "server-only";

import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { addMonths, currentMonth, type Month, monthParam } from "./month";

export type CashflowMonth = {
  month: Month;
  income: number;
  expenses: number;
  incomeCount: number;
  expenseCount: number;
  // The month is still running, so its totals are incomplete.
  partial: boolean;
};

// Income and expense totals for `count` months ending with (and including) `last`, oldest first.
export async function getCashflow(userId: string, last: Month, count = 6): Promise<CashflowMonth[]> {
  const first = addMonths(last, -(count - 1));
  const monthKey = sql<string>`to_char(${transactions.date}, 'YYYY-MM')`;

  const rows = await db
    .select({
      month: monthKey,
      type: transactions.type,
      total: sql<string>`sum(${transactions.amount})`,
      count: sql<number>`count(*)::int`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.date, `${monthParam(first)}-01`),
        lt(transactions.date, `${monthParam(addMonths(last, 1))}-01`),
      ),
    )
    .groupBy(monthKey, transactions.type);

  const now = monthParam(currentMonth());

  return Array.from({ length: count }, (_, i) => {
    const month = addMonths(first, i);
    const key = monthParam(month);
    const income = rows.find((r) => r.month === key && r.type === "income");
    const expense = rows.find((r) => r.month === key && r.type === "expense");
    return {
      month,
      income: Number(income?.total ?? 0),
      expenses: Number(expense?.total ?? 0),
      incomeCount: income?.count ?? 0,
      expenseCount: expense?.count ?? 0,
      partial: key === now,
    };
  });
}
