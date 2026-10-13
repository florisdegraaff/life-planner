import "server-only";

import { and, asc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { debts, recurringPayments, transactions } from "@/lib/db/schema";

/**
 * The debt a transaction counts towards: its own, else its recurring payment's (unless that's
 * marked not recurring). Use with transactions left-joined to recurring_payments.
 */
export const effectiveDebtId = sql<string | null>`coalesce(
  ${transactions.debtId},
  case when ${recurringPayments.ignored} then null else ${recurringPayments.debtId} end
)`;

export type DebtSummary = {
  id: string;
  name: string;
  // The balance as entered: before its first linked transaction.
  openingTotal: number;
  openingRemaining: number;
  // The debt's date: when its first linked transaction happened (null until one is linked).
  firstDate: string | null;
  monthlyPayment: string | null;
  // Including all linked transactions.
  total: number;
  remaining: number;
  // Monthly payment as entered, else the amount of its active recurring payments.
  monthly: number | null;
  // When the last payment went out; for "Paid off · Mar 2026".
  lastPaymentDate: string | null;
  updatedAt: Date;
};

/**
 * The user's debts with their current balance: the balance entered (what was owed before its
 * transactions), plus linked income (borrowed more) and minus linked expenses (paid off).
 */
export async function getDebts(userId: string): Promise<DebtSummary[]> {
  const [rows, movements, recurring] = await Promise.all([
    db.select().from(debts).where(eq(debts.userId, userId)).orderBy(asc(debts.createdAt)),
    db
      .select({
        debtId: effectiveDebtId,
        borrowed: sql<string>`coalesce(sum(${transactions.amount}) filter (where ${transactions.type} = 'income'), 0)`,
        paid: sql<string>`coalesce(sum(${transactions.amount}) filter (where ${transactions.type} = 'expense'), 0)`,
        firstDate: sql<string>`min(${transactions.date})`,
        lastPaymentDate: sql<string | null>`max(${transactions.date}) filter (where ${transactions.type} = 'expense')`,
      })
      .from(transactions)
      .leftJoin(recurringPayments, eq(transactions.recurringPaymentId, recurringPayments.id))
      .innerJoin(debts, eq(debts.id, effectiveDebtId))
      .where(eq(transactions.userId, userId))
      .groupBy(effectiveDebtId),
    db
      .select({ debtId: recurringPayments.debtId, amount: sql<string>`sum(${recurringPayments.amount})` })
      .from(recurringPayments)
      .where(
        and(
          eq(recurringPayments.userId, userId),
          isNotNull(recurringPayments.debtId),
          eq(recurringPayments.type, "expense"),
          eq(recurringPayments.active, true),
          eq(recurringPayments.ignored, false),
        ),
      )
      .groupBy(recurringPayments.debtId),
  ]);

  return rows.map((d) => {
    const m = movements.find((x) => x.debtId === d.id);
    const borrowed = Number(m?.borrowed ?? 0);
    const paid = Number(m?.paid ?? 0);
    const recurringMonthly = recurring.find((r) => r.debtId === d.id)?.amount;
    return {
      id: d.id,
      name: d.name,
      openingTotal: Number(d.totalAmount),
      openingRemaining: Number(d.remainingAmount),
      firstDate: m?.firstDate ?? null,
      monthlyPayment: d.monthlyPayment,
      total: Number(d.totalAmount) + borrowed,
      remaining: Math.max(0, Number(d.remainingAmount) + borrowed - paid),
      monthly: d.monthlyPayment ? Number(d.monthlyPayment) : recurringMonthly ? Number(recurringMonthly) : null,
      lastPaymentDate: m?.lastPaymentDate ?? null,
      updatedAt: d.updatedAt,
    };
  });
}

/** Debt names for the "adds to / pays off" pickers. */
export async function getDebtNames(userId: string) {
  const rows = await db
    .select({ name: debts.name })
    .from(debts)
    .where(eq(debts.userId, userId))
    .orderBy(asc(debts.name));
  return rows.map((r) => r.name);
}
