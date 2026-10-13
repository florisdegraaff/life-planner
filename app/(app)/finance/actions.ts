"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { categories, debts, recurringPayments, sources, transactions } from "@/lib/db/schema";
import { parseAmountInput } from "@/lib/finance/format";
import { type DebtSummary, getDebts } from "@/lib/finance/debts";
import { parseIngCsv } from "@/lib/finance/ing-csv";
import { syncRecurringPayments } from "@/lib/finance/recurring";
import { sourceKey } from "@/lib/finance/source-key";
import { getSourceOverview, type SourceOverview } from "@/lib/finance/sources";
import { getDebtTransactions, type TransactionRow } from "@/lib/finance/transactions";

export type ImportState = { message?: string; error?: string };

// Postgres caps a statement at 65,535 parameters; 1,000 rows × 15 parameters stays well under it.
const CHUNK_SIZE = 1000;

export async function importTransactionsCsv(_prev: ImportState, formData: FormData): Promise<ImportState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a CSV file to import." };

  const parsed = parseIngCsv(await file.text());
  if (!parsed.ok) return { error: parsed.error };
  if (parsed.rows.length === 0) return { error: "The file has no transactions." };

  // One source per distinct description; existing ones (possibly renamed) are left alone.
  const newSources = [
    ...new Map(
      parsed.rows.map((r) => [
        sourceKey(r.description),
        { userId: user.id, key: sourceKey(r.description), name: r.description.trim().replace(/\s+/g, " ") },
      ]),
    ).values(),
  ];
  const sourceInserts = [];
  for (let i = 0; i < newSources.length; i += CHUNK_SIZE) {
    sourceInserts.push(db.insert(sources).values(newSources.slice(i, i + CHUNK_SIZE)).onConflictDoNothing());
  }

  const values = parsed.rows.map((r) => ({
    ...r,
    userId: user.id,
    sourceId: sql`(select ${sources.id} from ${sources} where ${sources.userId} = ${user.id} and ${sources.key} = ${sourceKey(r.description)})`,
  }));
  const inserts = [];
  for (let i = 0; i < values.length; i += CHUNK_SIZE) {
    inserts.push(
      db
        .insert(transactions)
        .values(values.slice(i, i + CHUNK_SIZE))
        // A row already imported from an earlier export isn't duplicated, but gets the bank details
        // filled in if it was imported before they were stored.
        .onConflictDoUpdate({
          target: [transactions.userId, transactions.importHash],
          set: {
            account: sql`excluded.account`,
            counterparty: sql`excluded.counterparty`,
            code: sql`excluded.code`,
            paymentMethod: sql`excluded.payment_method`,
            notes: sql`excluded.notes`,
          },
          setWhere: and(isNull(transactions.account), isNull(transactions.notes)),
        })
        // xmax is 0 for a freshly inserted row and non-zero for an updated one.
        .returning({ inserted: sql<boolean>`xmax = 0` }),
    );
  }

  // One batch runs as a single transaction, so a failure never leaves a half-imported file.
  // Sources go first so the transactions' source lookups find them.
  const results = await db.batch([...sourceInserts, ...inserts] as [
    (typeof sourceInserts)[number],
    ...(typeof sourceInserts | typeof inserts),
  ]);
  const rows = (results.slice(sourceInserts.length) as Awaited<(typeof inserts)[number]>[]).flat();
  const imported = rows.filter((r) => r.inserted).length;
  const updated = rows.length - imported;
  const skipped = values.length - rows.length;

  const recurring = await syncRecurringPayments(user.id);
  revalidatePath("/finance");

  return {
    message:
      `Imported ${imported} transaction${imported === 1 ? "" : "s"}` +
      (updated ? `, added details to ${updated} already imported` : "") +
      (skipped ? `, skipped ${skipped} already imported` : "") +
      "." +
      (recurring.created ? ` Found ${recurring.created} new recurring payment${recurring.created === 1 ? "" : "s"}.` : ""),
  };
}

export type DebtState = {
  values?: { name: string; totalAmount: string; remainingAmount: string; monthlyPayment: string };
  errors?: { name?: string; totalAmount?: string; remainingAmount?: string; monthlyPayment?: string };
  saved?: boolean;
};

// Creates a debt, or updates one when the form includes its `id`.
export async function saveDebt(_prev: DebtState, formData: FormData): Promise<DebtState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const values = {
    name: String(formData.get("name") ?? "").trim(),
    totalAmount: String(formData.get("totalAmount") ?? "").trim(),
    remainingAmount: String(formData.get("remainingAmount") ?? "").trim(),
    monthlyPayment: String(formData.get("monthlyPayment") ?? "").trim(),
  };
  // Both optional: empty means nothing was owed before its linked transactions.
  const total = values.totalAmount ? parseAmountInput(values.totalAmount) : "0";
  const remaining = values.remainingAmount ? parseAmountInput(values.remainingAmount) : "0";
  const id = String(formData.get("id") ?? "");
  const monthly = values.monthlyPayment ? parseAmountInput(values.monthlyPayment) : null;

  const errors: DebtState["errors"] = {};
  if (!values.name) errors.name = "Give the debt a name.";
  else if (values.name.length > 100) errors.name = "Keep the name under 100 characters.";
  if (!total) errors.totalAmount = "Enter an amount like 30000 or 30.000,00, or leave it empty.";
  if (!remaining) errors.remainingAmount = "Enter an amount like 18600 or 18.600,00, or leave it empty.";
  else if (total && Number(remaining) > Number(total)) errors.remainingAmount = "Can't be more than the total amount.";
  if (values.monthlyPayment && (!monthly || Number(monthly) <= 0)) {
    errors.monthlyPayment = "Enter an amount above € 0, or leave it empty.";
  }
  if (!errors.name && (await debtNameTaken(user.id, values.name, id))) {
    errors.name = "You already have a debt with this name.";
  }
  if (Object.keys(errors).length) return { values, errors };

  const debt = { name: values.name, totalAmount: total!, remainingAmount: remaining!, monthlyPayment: monthly };

  if (id) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return { values, errors: { name: "This debt no longer exists." } };
    // Scoped to the user so a tampered id can't edit someone else's debt.
    const updated = await db
      .update(debts)
      .set(debt)
      .where(and(eq(debts.id, id), eq(debts.userId, user.id)))
      .returning({ id: debts.id });
    if (updated.length === 0) return { values, errors: { name: "This debt no longer exists." } };
  } else {
    await db.insert(debts).values({ ...debt, userId: user.id });
  }
  revalidatePath("/finance");

  return { saved: true };
}

const isUuid = (id: string) => /^[0-9a-f-]{36}$/i.test(id);

// Resolves a category name to its id, creating the category if the user doesn't have it yet.
// An empty name resolves to null (no category).
async function findOrCreateCategory(
  userId: string,
  name: string,
): Promise<{ categoryId: string | null } | { error: string }> {
  const trimmed = name.trim();
  if (!trimmed) return { categoryId: null };
  if (trimmed.length > 50) return { error: "Keep the category under 50 characters." };

  // Names are unique per user ignoring case, so inserting an existing name is a no-op.
  await db.insert(categories).values({ userId, name: trimmed }).onConflictDoNothing();
  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.userId, userId), eq(sql`lower(${categories.name})`, trimmed.toLowerCase())))
    .limit(1);
  return { categoryId: category.id };
}

// Sets the default category for all of a source's transactions that don't have their own.
export async function setSourceCategory(sourceId: string, name: string): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!isUuid(sourceId)) return { error: "This source no longer exists." };
  const category = await findOrCreateCategory(user.id, name);
  if ("error" in category) return category;

  const updated = await db
    .update(sources)
    .set({ categoryId: category.categoryId })
    .where(and(eq(sources.id, sourceId), eq(sources.userId, user.id)))
    .returning({ id: sources.id });
  if (updated.length === 0) return { error: "This source no longer exists." };

  revalidatePath("/finance");
  return {};
}

// Sets a transaction's own category by name, creating the category if needed. An empty name
// clears it, so the transaction falls back to its source's category.
export async function setTransactionCategory(transactionId: string, name: string): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!isUuid(transactionId)) return { error: "This transaction no longer exists." };
  const category = await findOrCreateCategory(user.id, name);
  if ("error" in category) return category;
  const { categoryId } = category;

  const updated = await db
    .update(transactions)
    .set({ categoryId })
    .where(and(eq(transactions.id, transactionId), eq(transactions.userId, user.id)))
    .returning({ id: transactions.id });
  if (updated.length === 0) return { error: "This transaction no longer exists." };

  revalidatePath("/finance");
  return {};
}

// Read-only: loads a source's overview for the popup, which only knows the source id.
export async function loadSourceOverview(sourceId: string): Promise<SourceOverview | null> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isUuid(sourceId)) return null;
  return getSourceOverview(user.id, sourceId);
}

export async function renameSource(sourceId: string, name: string): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const trimmed = name.trim();
  if (!trimmed) return { error: "Give it a name." };
  if (trimmed.length > 100) return { error: "Keep the name under 100 characters." };
  if (!isUuid(sourceId)) return { error: "This source no longer exists." };

  const updated = await db
    .update(sources)
    .set({ name: trimmed })
    .where(and(eq(sources.id, sourceId), eq(sources.userId, user.id)))
    .returning({ id: sources.id });
  if (updated.length === 0) return { error: "This source no longer exists." };

  revalidatePath("/finance");
  return {};
}

// Sets the category for all of a recurring payment's transactions that don't have their own.
// It takes precedence over the source's category.
export async function setRecurringCategory(recurringId: string, name: string): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!isUuid(recurringId)) return { error: "This recurring payment no longer exists." };
  const category = await findOrCreateCategory(user.id, name);
  if ("error" in category) return category;

  const updated = await db
    .update(recurringPayments)
    .set({ categoryId: category.categoryId })
    .where(and(eq(recurringPayments.id, recurringId), eq(recurringPayments.userId, user.id)))
    .returning({ id: recurringPayments.id });
  if (updated.length === 0) return { error: "This recurring payment no longer exists." };

  revalidatePath("/finance");
  return {};
}

// "Not recurring" (or undoing it): an ignored recurring payment's transactions count as one-off.
export async function setRecurringIgnored(recurringId: string, ignored: boolean): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!isUuid(recurringId)) return { error: "This recurring payment no longer exists." };
  const updated = await db
    .update(recurringPayments)
    .set({ ignored })
    .where(and(eq(recurringPayments.id, recurringId), eq(recurringPayments.userId, user.id)))
    .returning({ id: recurringPayments.id });
  if (updated.length === 0) return { error: "This recurring payment no longer exists." };

  revalidatePath("/finance");
  return {};
}

// Links a transaction to a debt by name, creating the debt if needed: income adds to it, an
// expense pays it off. An empty name removes the link (falling back to the recurring payment's).
export async function setTransactionDebt(transactionId: string, name: string): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isUuid(transactionId)) return { error: "This transaction no longer exists." };

  const debt = await findOrCreateDebt(user.id, name);
  if ("error" in debt) return debt;

  const updated = await db
    .update(transactions)
    .set({ debtId: debt.debtId })
    .where(and(eq(transactions.id, transactionId), eq(transactions.userId, user.id)))
    .returning({ id: transactions.id });
  if (updated.length === 0) return { error: "This transaction no longer exists." };

  revalidatePath("/finance");
  return {};
}

// Links a recurring payment to a debt by name (creating it if needed), so all its transactions add
// to (income) or pay off (expense) it. An empty name removes the link.
export async function setRecurringDebt(recurringId: string, name: string): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isUuid(recurringId)) return { error: "This recurring payment no longer exists." };

  const debt = await findOrCreateDebt(user.id, name);
  if ("error" in debt) return debt;

  const updated = await db
    .update(recurringPayments)
    .set({ debtId: debt.debtId })
    .where(and(eq(recurringPayments.id, recurringId), eq(recurringPayments.userId, user.id)))
    .returning({ id: recurringPayments.id });
  if (updated.length === 0) return { error: "This recurring payment no longer exists." };

  revalidatePath("/finance");
  return {};
}

const debtByName = (userId: string, name: string) =>
  and(eq(debts.userId, userId), eq(sql`lower(${debts.name})`, name.trim().toLowerCase()));

// Resolves a debt name to its id like categories do, creating the debt if the user doesn't have it
// yet. A new debt starts at zero, so its linked transactions make up its balance. An empty name
// resolves to null (no debt).
async function findOrCreateDebt(
  userId: string,
  name: string,
): Promise<{ debtId: string | null } | { error: string }> {
  const trimmed = name.trim();
  if (!trimmed) return { debtId: null };
  if (trimmed.length > 100) return { error: "Keep the debt name under 100 characters." };

  // Names are unique per user ignoring case, so inserting an existing name is a no-op.
  await db
    .insert(debts)
    .values({ userId, name: trimmed, totalAmount: "0", remainingAmount: "0" })
    .onConflictDoNothing();
  const [debt] = await db.select({ id: debts.id }).from(debts).where(debtByName(userId, trimmed)).limit(1);
  return { debtId: debt.id };
}

async function debtNameTaken(userId: string, name: string, exceptId: string) {
  const [debt] = await db.select({ id: debts.id }).from(debts).where(debtByName(userId, name)).limit(1);
  return !!debt && debt.id !== exceptId;
}

// Read-only: a debt's balance and every transaction that changed it, for the debt popup.
export async function loadDebtOverview(
  debtId: string,
): Promise<{ debt: DebtSummary; transactions: TransactionRow[] } | null> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isUuid(debtId)) return null;

  const [all, rows] = await Promise.all([getDebts(user.id), getDebtTransactions(user.id, debtId)]);
  const debt = all.find((d) => d.id === debtId);
  return debt ? { debt, transactions: rows } : null;
}

export type TransactionFormState = {
  values?: { date: string; description: string; type: string; amount: string; category: string; debt: string };
  errors?: { date?: string; description?: string; type?: string; amount?: string; category?: string; debt?: string };
  saved?: boolean;
};

// Adds a transaction by hand, or updates one when the form includes its `id`. It gets a source like
// imported ones, so it joins that source's category and any matching recurring payment.
export async function saveTransaction(_prev: TransactionFormState, formData: FormData): Promise<TransactionFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "");
  const values = {
    date: String(formData.get("date") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim().replace(/\s+/g, " "),
    type: String(formData.get("type") ?? ""),
    amount: String(formData.get("amount") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    debt: String(formData.get("debt") ?? "").trim(),
  };
  const amount = parseAmountInput(values.amount);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(values.date) ? new Date(`${values.date}T00:00:00Z`) : null;

  const errors: TransactionFormState["errors"] = {};
  if (!date || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== values.date) {
    errors.date = "Pick a date.";
  }
  if (!values.description) errors.description = "Pick a source, or describe who you paid or who paid you.";
  else if (values.description.length > 200) errors.description = "Keep it under 200 characters.";
  if (values.type !== "expense" && values.type !== "income") errors.type = "Choose expense or income.";
  if (!amount || Number(amount) <= 0) errors.amount = "Enter an amount above € 0, like 12,50.";
  if (values.category.length > 50) errors.category = "Keep the category under 50 characters.";
  if (values.debt.length > 100) errors.debt = "Keep the debt name under 100 characters.";
  if (Object.keys(errors).length) return { values, errors };

  // When editing, the transaction as it is now.
  let existing: { sourceId: string | null; sourceName: string | null; description: string; type: string } | undefined;
  if (id) {
    if (!isUuid(id)) return { values, errors: { description: "This transaction no longer exists." } };
    [existing] = await db
      .select({
        sourceId: transactions.sourceId,
        sourceName: sources.name,
        description: transactions.description,
        type: transactions.type,
      })
      .from(transactions)
      .leftJoin(sources, eq(transactions.sourceId, sources.id))
      .where(and(eq(transactions.id, id), eq(transactions.userId, user.id)))
      .limit(1);
    if (!existing) return { values, errors: { description: "This transaction no longer exists." } };
  }

  // Only now, so a rejected form doesn't leave a new category or debt behind.
  const category = await findOrCreateCategory(user.id, values.category);
  if ("error" in category) return { values, errors: { category: category.error } };
  const debt = await findOrCreateDebt(user.id, values.debt);
  if ("error" in debt) return { values, errors: { debt: debt.error } };

  // An unchanged source keeps the transaction's own (bank) description; otherwise the text picks a
  // source by name, or is a new description.
  const sameSource = existing?.sourceName?.toLowerCase() === values.description.toLowerCase();
  const sourceId = sameSource ? existing!.sourceId! : await findOrCreateSource(user.id, values.description);
  const fields = {
    date: values.date,
    description: sameSource ? existing!.description : values.description,
    type: values.type as "expense" | "income",
    amount: amount!,
    sourceId,
    categoryId: category.categoryId,
    debtId: debt.debtId,
  };

  if (existing) {
    // A different source or type no longer fits its recurring payment; the sync below finds the right one.
    const relink = !sameSource || existing.type !== values.type;
    await db
      .update(transactions)
      .set({ ...fields, ...(relink ? { recurringPaymentId: null } : {}) })
      .where(and(eq(transactions.id, id), eq(transactions.userId, user.id)));
  } else {
    await db.insert(transactions).values({ ...fields, userId: user.id });
  }
  await syncRecurringPayments(user.id);
  revalidatePath("/finance");

  return { saved: true };
}

// A picked source is matched on its (possibly renamed) name. Otherwise the text is a description:
// it joins the source imported transactions with that description have, or starts a new one.
async function findOrCreateSource(userId: string, text: string) {
  const [named] = await db
    .select({ id: sources.id })
    .from(sources)
    .where(and(eq(sources.userId, userId), eq(sql`lower(${sources.name})`, text.toLowerCase())))
    .limit(1);
  if (named) return named.id;

  const key = sourceKey(text);
  await db.insert(sources).values({ userId, key, name: text }).onConflictDoNothing();
  const [source] = await db
    .select({ id: sources.id })
    .from(sources)
    .where(and(eq(sources.userId, userId), eq(sources.key, key)))
    .limit(1);
  return source.id;
}

// Deletes a transaction. Debts and recurring payments recalculate from what's left. An imported
// transaction comes back if the same CSV is imported again.
export async function deleteTransaction(transactionId: string): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isUuid(transactionId)) return { error: "This transaction no longer exists." };

  const deleted = await db
    .delete(transactions)
    .where(and(eq(transactions.id, transactionId), eq(transactions.userId, user.id)))
    .returning({ id: transactions.id });
  if (deleted.length === 0) return { error: "This transaction no longer exists." };

  await syncRecurringPayments(user.id);
  revalidatePath("/finance");
  return {};
}
