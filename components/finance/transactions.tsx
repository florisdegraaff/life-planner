"use client";

import { type FormEvent, useEffect, useState, useTransition } from "react";
import {
  deleteTransaction,
  loadSourceOverview,
  renameSource,
  setRecurringCategory,
  setRecurringDebt,
  setRecurringIgnored,
  setSourceCategory,
  setTransactionCategory,
  setTransactionDebt,
} from "@/app/(app)/finance/actions";
import { Combobox } from "@/components/combobox";
import { Field } from "@/components/field";
import { type PickerOptions, TransactionForm } from "@/components/finance/transaction-form";
import { Modal } from "@/components/modal";
import { button, Card, CardTitle, Chip, cx, Icon } from "@/components/ui";
import { icons } from "@/lib/data";
import type { SourceOverview } from "@/lib/finance/sources";
import type { TransactionRow } from "@/lib/finance/transactions";

type TransactionType = TransactionRow["type"];

const filters: { id: TransactionType | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "income", label: "Income" },
  { id: "expense", label: "Expenses" },
];

const typeLabel: Record<TransactionType, string> = { income: "Income", expense: "Expense" };

// "Monthly", "Yearly", … for a transaction of a recurring payment, else "One-off".
const repeatsLabel = (t: TransactionRow) => (t.recurring && !t.recurring.ignored ? t.recurring.interval : "One-off");

export function Transactions({ transactions, options }: { transactions: TransactionRow[]; options: PickerOptions }) {
  const [filter, setFilter] = useState<TransactionType | "all">("all");
  const rows = filter === "all" ? transactions : transactions.filter((t) => t.type === filter);

  return (
    <Card className="flex min-w-0 flex-[2_1_560px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle>Transactions</CardTitle>
        <div role="group" aria-label="Filter by type" className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <Chip key={f.id} on={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
            </Chip>
          ))}
        </div>
      </div>
      <TransactionTable
        transactions={rows}
        options={options}
        emptyMessage={transactions.length === 0 ? "No transactions this month." : "No transactions of this type."}
      />
    </Card>
  );
}

/**
 * Table of transactions. Clicking a row opens its details, clicking the source name opens the
 * source's overview; both in a popup that stacks on top of any popup the table is shown in.
 */
export function TransactionTable({
  transactions,
  options,
  emptyMessage = "No transactions.",
}: {
  transactions: TransactionRow[];
  options: PickerOptions;
  emptyMessage?: string;
}) {
  const { categories, debts } = options;
  // What the popup shows. The transaction is looked up by id so it's fresh after an edit refreshes the page.
  const [view, setView] = useState<
    | { kind: "transaction" | "edit"; id: string }
    | { kind: "source"; id: string; fromTransaction?: string }
    | null
  >(null);
  const selected =
    view?.kind === "transaction" || view?.kind === "edit" ? (transactions.find((t) => t.id === view.id) ?? null) : null;
  const setSelectedId = (id: string) => setView({ kind: "transaction", id });

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs tracking-[0.06em] text-muted uppercase">
              <th className="py-2 pr-2 font-medium">Date</th>
              <th className="p-2 font-medium">Description</th>
              <th className="p-2 font-medium">Category</th>
              <th className="p-2 font-medium">Type</th>
              <th className="p-2 font-medium">Repeats</th>
              <th className="py-2 pl-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((r) => (
              // Clicking the row opens the transaction (the date button does the same for keyboard users);
              // clicking the source name opens the source instead.
              <tr key={r.id} onClick={() => setSelectedId(r.id)} className="cursor-pointer border-t border-track hover:bg-track/50">
                <td className="py-3 pr-2 font-mono text-[13px] text-muted">
                  <button
                    type="button"
                    aria-label={`Transaction details: ${r.source}, ${r.longDate}, ${r.amount}`}
                    className="hover:text-ink"
                  >
                    {r.date}
                  </button>
                </td>
                <td className="px-2 py-3">
                  {r.sourceId ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setView({ kind: "source", id: r.sourceId! });
                      }}
                      className="text-left font-medium text-primary-text hover:underline"
                    >
                      {r.source}
                    </button>
                  ) : (
                    r.source
                  )}
                </td>
                <td className="px-2 py-3">
                  {r.ownCategory ? (
                    <span className="inline-flex items-center rounded-md bg-track px-2 py-[3px] text-xs text-ink-2">
                      {r.category}
                    </span>
                  ) : r.category ? (
                    // Inherited from the recurring payment or source: same chip, outlined instead of filled.
                    <span
                      title={r.categoryFrom === "recurring" ? `From the recurring payment ${r.recurring!.name}` : `From ${r.source}`}
                      className="inline-flex items-center rounded-md border border-dashed border-line-strong px-2 py-[2px] text-xs text-ink-2"
                    >
                      {r.category}
                    </span>
                  ) : (
                    <span className="text-xs text-muted">Uncategorised</span>
                  )}
                </td>
                <td className="px-2 py-3 text-[13px]">{typeLabel[r.type]}</td>
                <td className="px-2 py-3 text-[13px] text-muted">{repeatsLabel(r)}</td>
                <td className="py-3 pl-2 text-right font-mono">{r.amount}</td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr className="border-t border-track">
                <td colSpan={6} className="py-6 text-center text-muted">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Modal
        open={!!selected || view?.kind === "source"}
        onClose={() => setView(null)}
        title={view?.kind === "source" ? "Source" : view?.kind === "edit" ? "Edit transaction" : "Transaction"}
      >
        {selected && view?.kind === "transaction" && (
          <TransactionDetails
            transaction={selected}
            categories={categories}
            debts={debts}
            onOpenSource={(id) => setView({ kind: "source", id, fromTransaction: selected.id })}
            onEdit={() => setView({ kind: "edit", id: selected.id })}
            onDeleted={() => setView(null)}
          />
        )}
        {selected && view?.kind === "edit" && (
          <TransactionForm transaction={selected} options={options} onDone={() => setSelectedId(selected.id)} />
        )}
        {view?.kind === "source" && (
          <SourceDetails
            key={view.id}
            sourceId={view.id}
            categories={categories}
            onBack={view.fromTransaction ? () => setSelectedId(view.fromTransaction!) : undefined}
          />
        )}
      </Modal>
    </>
  );
}

function TransactionDetails({
  transaction: t,
  categories,
  debts,
  onOpenSource,
  onEdit,
  onDeleted,
}: {
  transaction: TransactionRow;
  categories: string[];
  debts: string[];
  onOpenSource: (sourceId: string) => void;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const [category, setCategory] = useState(t.ownCategory ?? "");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function saveCategory(name: string) {
    const previous = category;
    setCategory(name);
    setError(undefined);
    startTransition(async () => {
      const result = await setTransactionCategory(t.id, name);
      if (result.error) {
        setCategory(previous);
        setError(result.error);
      }
    });
  }

  // Where the fallback category comes from: the recurring payment wins over the source.
  const inheritedFrom =
    t.recurring && !t.recurring.ignored && t.recurring.category
      ? `the recurring payment ${t.recurring.name}`
      : t.source;

  const details: [label: string, value: string | null][] = [
    ["Date", t.longDate],
    ["Type", typeLabel[t.type]],
    ["Payment method", t.paymentMethod],
    ["Code", t.code],
    ["Your account", t.account],
    ["Counterparty", t.counterparty],
  ];

  return (
    <div className="flex flex-col gap-5">
      <div>
        {t.sourceId ? (
          <button
            type="button"
            onClick={() => onOpenSource(t.sourceId!)}
            className="inline-flex items-center gap-1 text-left text-base font-medium break-words text-primary-text hover:underline"
          >
            {t.source}
            <Icon d={icons.chevronRight} size={16} strokeWidth={2.2} />
          </button>
        ) : (
          <div className="text-base font-medium break-words">{t.source}</div>
        )}
        {t.source !== t.description && <div className="mt-0.5 text-xs text-muted">{t.description}</div>}
        <div className="mt-1 font-mono text-[26px] font-medium">{t.amount}</div>
      </div>
      <div>
        <Combobox
          label="Category"
          options={categories}
          value={category}
          onCommit={saveCategory}
          placeholder={t.inheritedCategory ?? "Uncategorised"}
        />
        <p aria-live="polite" className={cx("m-0 mt-1.5 text-xs", error ? "text-accent-text" : "text-muted")}>
          {error ??
            (pending
              ? "Saving…"
              : !category && t.inheritedCategory
                ? `Using “${t.inheritedCategory}” from ${inheritedFrom}. Pick a category to override it for this transaction.`
                : t.inheritedCategory
                  ? `Overrides “${t.inheritedCategory}” from ${inheritedFrom}. Clear it and press Enter to use that again.`
                  : "Pick a category or type a new one. Clear it and press Enter to remove.")}
        </p>
      </div>
      <DebtLink transaction={t} debts={debts} />
      {t.recurring && <RecurringSection recurring={t.recurring} type={t.type} categories={categories} debts={debts} />}
      <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-sm">
        {details
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted">{label}</dt>
              <dd className="m-0 font-medium break-all">{value}</dd>
            </div>
          ))}
      </dl>
      {t.notes ? (
        <div>
          <div className="mb-1.5 text-[13px] text-muted">Bank note</div>
          <p className="m-0 rounded-[10px] bg-track px-3.5 py-3 font-mono text-xs leading-relaxed break-words text-ink-2">
            {t.notes}
          </p>
        </div>
      ) : (
        <p className="m-0 text-xs text-muted">
          No bank details stored for this transaction. Import its CSV again to add them.
        </p>
      )}
      <TransactionActions transactionId={t.id} imported={!!t.notes} onEdit={onEdit} onDeleted={onDeleted} />
    </div>
  );
}

// Edit and Delete for a transaction. Delete asks for confirmation first.
function TransactionActions({
  transactionId,
  imported,
  onEdit,
  onDeleted,
}: {
  transactionId: string;
  imported: boolean;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function remove() {
    setError(undefined);
    startTransition(async () => {
      const result = await deleteTransaction(transactionId);
      if (result.error) setError(result.error);
      else onDeleted();
    });
  }

  if (confirming) {
    return (
      <div className="flex flex-col gap-3 rounded-[10px] border border-accent-border bg-accent-soft p-4">
        <p className="m-0 text-sm">
          Delete this transaction? Debts and recurring payments are recalculated without it.
          {imported && " Importing the same CSV again would bring it back."}
        </p>
        {error && <p className="m-0 text-[13px] text-accent-text">{error}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => setConfirming(false)} className={button.secondary}>
            Keep it
          </button>
          <button
            type="button"
            autoFocus
            disabled={pending}
            onClick={remove}
            className="inline-flex h-11 items-center justify-center rounded-[10px] bg-accent px-[18px] text-sm font-semibold text-white disabled:opacity-70"
          >
            {pending ? "Deleting…" : "Delete transaction"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end gap-3 border-t border-track pt-4">
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-line-strong bg-surface px-4 text-sm font-medium text-accent-text"
      >
        Delete
      </button>
      <button type="button" onClick={onEdit} className={button.primary}>
        Edit
      </button>
    </div>
  );
}

// Whether this transaction adds to (income) or pays off (expense) a debt. Its own link wins over
// its recurring payment's. Like categories: pick a debt, or type a name to create one.
function DebtLink({ transaction: t, debts }: { transaction: TransactionRow; debts: string[] }) {
  const [value, setValue] = useState(t.ownDebt ?? "");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const viaRecurring = !t.ownDebt && t.debt?.via === "recurring" ? t.debt.name : null;

  function change(next: string) {
    const previous = value;
    setValue(next);
    setError(undefined);
    startTransition(async () => {
      const result = await setTransactionDebt(t.id, next);
      if (result.error) {
        setValue(previous);
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <Combobox
        label={t.type === "income" ? "Adds to debt" : "Pays off debt"}
        options={debts}
        value={value}
        onCommit={change}
        placeholder={viaRecurring ?? "No debt"}
        createLabel={(text) => `Add debt “${text}”`}
      />
      <p aria-live="polite" className={cx("m-0 mt-1.5 text-xs", error ? "text-accent-text" : "text-muted")}>
        {error ??
          (pending
            ? "Saving…"
            : viaRecurring && !value
              ? `Counts towards “${viaRecurring}” through its recurring payment. Pick a debt to override it.`
              : t.type === "income"
                ? "For money you borrowed, like a loan payout. Type a name to start a new debt."
                : "For a payment that lowers what you still owe.")}
      </p>
    </div>
  );
}

// The recurring payment a transaction belongs to: its schedule, its category (used by its
// transactions that don't have their own) and a way to mark it as not recurring.
function RecurringSection({
  recurring,
  type,
  categories,
  debts,
}: {
  recurring: NonNullable<TransactionRow["recurring"]>;
  type: TransactionType;
  categories: string[];
  debts: string[];
}) {
  const [category, setCategory] = useState(recurring.category ?? "");
  const [debt, setDebt] = useState(recurring.debt ?? "");
  const [ignored, setIgnored] = useState(recurring.ignored);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  // Optimistic update of one field, rolled back if the save fails.
  function save<T>(set: (value: T) => void, previous: T, next: T, action: () => Promise<{ error?: string }>) {
    set(next);
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        set(previous);
        setError(result.error);
      }
    });
  }

  const schedule = [
    recurring.interval,
    `about ${recurring.amount}`,
    recurring.dayOfMonth && `around day ${recurring.dayOfMonth}`,
    !recurring.active && "no longer active",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section aria-label="Recurring payment" className="flex flex-col gap-3 rounded-[10px] border border-line p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[13px] text-muted">{ignored ? "Marked as not recurring" : "Recurring payment"}</div>
          <div className={cx("mt-0.5 text-sm font-medium", ignored && "text-muted line-through")}>{schedule}</div>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => save(setIgnored, ignored, !ignored, () => setRecurringIgnored(recurring.id, !ignored))}
          className={cx(button.secondary, "min-h-9 flex-none px-3 text-[13px] disabled:opacity-60")}
        >
          {ignored ? "Recurring after all" : "Not recurring"}
        </button>
      </div>
      {!ignored && (
        <div>
          <Combobox
            label="Category for this recurring payment"
            options={categories}
            value={category}
            onCommit={(name) => save(setCategory, category, name, () => setRecurringCategory(recurring.id, name))}
            placeholder="Uncategorised"
          />
          <p className="m-0 mt-1.5 text-xs text-muted">
            Used for all its payments that don&apos;t have their own category, ahead of the source&apos;s.
          </p>
        </div>
      )}
      {!ignored && (
        <Combobox
          label={type === "income" ? "Its payments add to debt" : "Its payments pay off debt"}
          options={debts}
          value={debt}
          onCommit={(name) => save(setDebt, debt, name, () => setRecurringDebt(recurring.id, name))}
          placeholder="No debt"
          createLabel={(text) => `Add debt “${text}”`}
        />
      )}
      <p aria-live="polite" className={cx("m-0 text-xs text-accent-text", !error && "sr-only")}>
        {error ?? (pending ? "Saving…" : "")}
      </p>
    </section>
  );
}

function SourceDetails({
  sourceId,
  categories,
  onBack,
}: {
  sourceId: string;
  categories: string[];
  onBack?: () => void;
}) {
  // undefined while loading, null when the source doesn't exist (any more).
  const [source, setSource] = useState<SourceOverview | null>();
  const [name, setName] = useState("");
  const [message, setMessage] = useState<{ error?: boolean; text: string }>();
  const [pending, startTransition] = useTransition();
  const [categoryError, setCategoryError] = useState<string>();
  const [categoryPending, startCategoryTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    loadSourceOverview(sourceId).then((data) => {
      if (cancelled) return;
      setSource(data);
      setName(data?.name ?? "");
    });
    return () => {
      cancelled = true;
    };
  }, [sourceId]);

  function saveCategory(category: string) {
    const previous = source?.category ?? null;
    setSource((s) => s && { ...s, category: category || null });
    setCategoryError(undefined);
    startCategoryTransition(async () => {
      const result = await setSourceCategory(sourceId, category);
      if (result.error) {
        setSource((s) => s && { ...s, category: previous });
        setCategoryError(result.error);
      }
    });
  }

  function rename(e: FormEvent) {
    e.preventDefault();
    setMessage(undefined);
    startTransition(async () => {
      const result = await renameSource(sourceId, name);
      if (result.error) return setMessage({ error: true, text: result.error });
      setSource((s) => s && { ...s, name: name.trim() });
      setMessage({ text: "Renamed." });
    });
  }

  const back = onBack && (
    <button
      type="button"
      onClick={onBack}
      className="inline-flex items-center gap-1 self-start text-sm text-muted hover:text-ink"
    >
      <Icon d={icons.chevronLeft} size={16} strokeWidth={2.2} />
      Back to transaction
    </button>
  );

  if (source === undefined) return <div className="h-[280px] animate-pulse rounded-[10px] bg-track" />;
  if (source === null) {
    return (
      <div className="flex flex-col gap-4">
        {back}
        <p className="m-0 text-sm text-muted">This source no longer exists.</p>
      </div>
    );
  }

  const stats: [label: string, value: string][] = [
    ["Transactions", String(source.count)],
    ["Spent", source.spent],
    ["Received", source.received],
    ["Average", source.average],
  ];

  return (
    <div className="flex flex-col gap-5">
      {back}
      <div>
        <div className="font-display text-2xl font-semibold break-words">{source.name}</div>
        {source.count > 0 && (
          <div className="mt-1 text-xs text-muted">
            {source.first === source.last ? source.first : `${source.first} – ${source.last}`}
          </div>
        )}
      </div>

      <div>
        <Combobox
          label="Category"
          options={categories}
          value={source.category ?? ""}
          onCommit={saveCategory}
          placeholder="Uncategorised"
        />
        <p aria-live="polite" className={cx("m-0 mt-1.5 text-xs", categoryError ? "text-accent-text" : "text-muted")}>
          {categoryError ??
            (categoryPending
              ? "Saving…"
              : "Used for all its transactions, except ones you gave their own category.")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-[10px] bg-track px-3.5 py-2.5">
            <div className="text-xs text-muted">{label}</div>
            <div className="mt-0.5 font-mono text-sm font-medium">{value}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="mb-1.5 text-[13px] text-muted">When</div>
        <ul className="m-0 max-h-56 list-none overflow-auto rounded-[10px] border border-line p-0">
          {source.transactions.map((t) => (
            <li
              key={t.id}
              className="flex justify-between gap-3 border-t border-track px-3.5 py-2 text-sm first:border-t-0"
            >
              <span className="text-ink-2">{t.date}</span>
              <span className="font-mono">{t.amount}</span>
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={rename} className="flex flex-col gap-2">
        <div className="flex items-end gap-2.5">
          <div className="flex-1">
            <Field label="Name" name="sourceName" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <button
            type="submit"
            disabled={pending || !name.trim() || name.trim() === source.name}
            className={cx(button.secondary, "disabled:opacity-50")}
          >
            {pending ? "Saving…" : "Rename"}
          </button>
        </div>
        <p aria-live="polite" className={cx("m-0 text-xs", message?.error ? "text-accent-text" : "text-muted")}>
          {message?.text ?? "Renaming applies to all its transactions, including future imports."}
        </p>
      </form>
    </div>
  );
}
