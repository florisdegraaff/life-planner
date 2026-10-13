import "server-only";

import { randomUUID } from "node:crypto";
import { and, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { recurringPayments, sources, transactions } from "@/lib/db/schema";
import { type Month, monthRange } from "./month";
import {
  type DetectTx,
  detectRecurring,
  type Interval,
  isActive,
  joinsSchedule,
  periodIndex,
  summarise,
} from "./recurring-detect";

type Tx = DetectTx & { type: "expense" | "income"; sourceId: string; recurringPaymentId: string | null };

// Today's date in the user's time zone, as YYYY-MM-DD.
function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(new Date());
}

/**
 * Links the user's transactions to recurring payments, automatically:
 * 1. unlinked transactions join an existing recurring payment of the same source and type when
 *    the amount is close (so price changes are followed);
 * 2. the rest are scanned for new patterns per source and type;
 * 3. every recurring payment's amount, last date, usual day and active flag are refreshed.
 * Names, categories and the "ignored" flag are the user's and are left alone.
 */
export async function syncRecurringPayments(userId: string) {
  const [rows, existing] = await Promise.all([
    db
      .select({
        id: transactions.id,
        date: transactions.date,
        amount: transactions.amount,
        type: transactions.type,
        sourceId: transactions.sourceId,
        sourceName: sources.name,
        recurringPaymentId: transactions.recurringPaymentId,
      })
      .from(transactions)
      .innerJoin(sources, eq(transactions.sourceId, sources.id))
      .where(eq(transactions.userId, userId)),
    db
      .select({
        id: recurringPayments.id,
        sourceId: recurringPayments.sourceId,
        type: recurringPayments.type,
        amount: recurringPayments.amount,
        interval: recurringPayments.interval,
      })
      .from(recurringPayments)
      .where(eq(recurringPayments.userId, userId)),
  ]);

  const txs: Tx[] = rows.map((r) => ({ ...r, sourceId: r.sourceId!, amount: Number(r.amount) }));
  const schedules = existing.map((r) => ({ ...r, amount: Number(r.amount) }));
  const sourceNames = new Map(rows.map((r) => [r.sourceId!, r.sourceName]));

  // Newly made links, by recurring payment id.
  const newLinks = new Map<string, string[]>();
  const link = (recurringId: string, tx: Tx) => {
    tx.recurringPaymentId = recurringId;
    newLinks.set(recurringId, [...(newLinks.get(recurringId) ?? []), tx.id]);
  };

  // How many payments each schedule has per period, to keep it at about one per period.
  const perPeriod = (scheduleId: string, interval: Interval, date: string) =>
    txs.filter(
      (t) => t.recurringPaymentId === scheduleId && periodIndex(interval, t.date) === periodIndex(interval, date),
    ).length;

  // Links unlinked transactions to a recurring payment of the same source and type, closest amount
  // first, in date order so a period's first payment is the one that joins. Returns the rest.
  const matchToSchedules = () => {
    const rest: Tx[] = [];
    const unlinked = txs.filter((t) => !t.recurringPaymentId).sort((a, b) => a.date.localeCompare(b.date));
    for (const tx of unlinked) {
      const match = schedules
        .filter(
          (s) =>
            s.sourceId === tx.sourceId &&
            s.type === tx.type &&
            joinsSchedule(s.amount, tx.amount, perPeriod(s.id, s.interval, tx.date)),
        )
        .sort((a, b) => Math.abs(a.amount - tx.amount) - Math.abs(b.amount - tx.amount))[0];
      if (match) link(match.id, tx);
      else rest.push(tx);
    }
    return rest;
  };

  // 1. Match unlinked transactions to existing recurring payments.
  const unmatched = matchToSchedules();

  // 2. Detect new recurring payments among what's left, per source and type.
  const groups = new Map<string, Tx[]>();
  for (const tx of unmatched) {
    const key = `${tx.sourceId}|${tx.type}`;
    groups.set(key, [...(groups.get(key) ?? []), tx]);
  }
  const created: (typeof recurringPayments.$inferInsert)[] = [];
  const byId = new Map(txs.map((t) => [t.id, t]));
  for (const group of groups.values()) {
    const { sourceId, type } = group[0];
    for (const found of detectRecurring(group)) {
      const id = randomUUID();
      created.push({
        id,
        userId,
        sourceId,
        type,
        name: sourceNames.get(sourceId) ?? "Recurring payment",
        interval: found.interval,
        amount: found.amount.toFixed(2),
        lastDate: found.lastDate,
        dayOfMonth: found.dayOfMonth,
        active: isActive(found.interval, found.lastDate, today()),
      });
      schedules.push({ id, sourceId, type, amount: found.amount, interval: found.interval });
      for (const txId of found.ids) link(id, byId.get(txId)!);
    }
  }
  // Payments detection left out may still fit a schedule it just created; matching again here
  // makes a single run complete, so running it again changes nothing.
  if (created.length) matchToSchedules();

  // 3. Refresh every recurring payment from its (now) linked transactions: new ones before they're
  //    inserted, existing ones with an update.
  const createdById = new Map(created.map((c) => [c.id!, c]));
  const refreshes = schedules.flatMap((s) => {
    const linked = txs.filter((t) => t.recurringPaymentId === s.id);
    if (linked.length === 0) return [];
    const summary = summarise(s.interval, linked);
    const fields = {
      amount: summary.amount.toFixed(2),
      lastDate: summary.lastDate,
      dayOfMonth: summary.dayOfMonth,
      active: isActive(s.interval, summary.lastDate, today()),
    };
    const isNew = createdById.get(s.id);
    if (isNew) {
      Object.assign(isNew, fields);
      return [];
    }
    return [db.update(recurringPayments).set(fields).where(eq(recurringPayments.id, s.id))];
  });

  const statements = [
    ...(created.length ? [db.insert(recurringPayments).values(created)] : []),
    ...[...newLinks].map(([recurringId, ids]) =>
      db
        .update(transactions)
        .set({ recurringPaymentId: recurringId })
        .where(and(eq(transactions.userId, userId), inArray(transactions.id, ids))),
    ),
    ...refreshes,
  ];
  // One batch is one database transaction, so a failure leaves nothing half-linked.
  if (statements.length) await db.batch(statements as [(typeof statements)[number], ...typeof statements]);

  return { created: created.length, linked: [...newLinks.values()].reduce((n, ids) => n + ids.length, 0) };
}

// The month's expenses split into recurring (linked to a recurring payment that isn't ignored)
// and one-off.
export async function getRecurringSplit(userId: string, month: Month) {
  const { start, end } = monthRange(month);
  const recurring = sql<boolean>`coalesce(${recurringPayments.ignored} = false, false)`;
  const rows = await db
    .select({ recurring, count: sql<number>`count(*)::int`, total: sql<string>`sum(${transactions.amount})` })
    .from(transactions)
    .leftJoin(recurringPayments, eq(transactions.recurringPaymentId, recurringPayments.id))
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, "expense"),
        gte(transactions.date, start),
        lt(transactions.date, end),
      ),
    )
    .groupBy(recurring);

  const part = (isRecurring: boolean) => {
    const row = rows.find((r) => r.recurring === isRecurring);
    return { count: row?.count ?? 0, total: Number(row?.total ?? 0) };
  };
  return { recurring: part(true), oneOff: part(false) };
}
