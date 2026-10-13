"use client";

import { useActionState, useEffect, useState } from "react";
import { type DebtState, loadDebtOverview, saveDebt } from "@/app/(app)/finance/actions";
import type { PickerOptions } from "@/components/finance/transaction-form";
import { TransactionTable } from "@/components/finance/transactions";
import { Field } from "@/components/field";
import { Modal } from "@/components/modal";
import { button, cx, Icon, Progress } from "@/components/ui";
import { icons } from "@/lib/data";
import type { DebtSummary } from "@/lib/finance/debts";
import type { TransactionRow } from "@/lib/finance/transactions";

export type EditableDebt = {
  id: string;
  name: string;
  totalAmount: string;
  remainingAmount: string;
  monthlyPayment: string | null;
};

export function NewDebtButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cx(button.secondary, "min-h-9 px-3")}>
        <Icon d={icons.plus} size={16} strokeWidth={2.2} />
        New debt
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="New debt">
        <DebtForm onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}

/**
 * Invisible button covering its `relative` parent, so the whole debt row opens the debt's popup:
 * its balance and every transaction that changed it, with an Edit button for the form.
 */
export function DebtButton({ debt, options }: { debt: EditableDebt; options: PickerOptions }) {
  const [view, setView] = useState<"overview" | "edit" | null>(null);

  return (
    <>
      <button
        type="button"
        aria-label={`Show ${debt.name}`}
        onClick={() => setView("overview")}
        className="absolute inset-0 rounded-[10px] hover:bg-current/5 focus-visible:outline-2 focus-visible:outline-primary"
      />
      <Modal
        open={view !== null}
        onClose={() => setView(null)}
        title={view === "edit" ? "Edit debt" : debt.name}
        size={view === "edit" ? "md" : "lg"}
      >
        {view === "overview" && (
          <DebtOverview debtId={debt.id} options={options} onEdit={() => setView("edit")} />
        )}
        {view === "edit" && <DebtForm debt={debt} onDone={() => setView("overview")} />}
      </Modal>
    </>
  );
}

const longDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const formatDate = (date: string) => longDate.format(new Date(`${date}T00:00:00Z`));
const euro = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });

function DebtOverview({
  debtId,
  options,
  onEdit,
}: {
  debtId: string;
  options: PickerOptions;
  onEdit: () => void;
}) {
  // undefined while loading, null when the debt doesn't exist (any more).
  const [data, setData] = useState<{ debt: DebtSummary; transactions: TransactionRow[] } | null>();

  useEffect(() => {
    let cancelled = false;
    loadDebtOverview(debtId).then((result) => {
      if (!cancelled) setData(result);
    });
    return () => {
      cancelled = true;
    };
  }, [debtId]);

  if (data === undefined) return <div className="h-[320px] animate-pulse rounded-[10px] bg-track" />;
  if (data === null) return <p className="m-0 text-sm text-muted">This debt no longer exists.</p>;

  const { debt, transactions } = data;
  const pct = debt.total ? Math.round(((debt.total - debt.remaining) / debt.total) * 100) : 0;
  const payments = transactions.filter((t) => t.type === "expense");
  const additions = transactions.filter((t) => t.type === "income");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-xs text-muted">Still to pay</div>
            <div className="font-mono text-[26px] font-medium">{euro.format(debt.remaining)}</div>
          </div>
          <button type="button" onClick={onEdit} className={cx(button.secondary, "min-h-9 px-3")}>
            Edit
          </button>
        </div>
        <Progress pct={pct} className="mt-3 h-2.5" barClassName="bg-accent" />
        <div className="mt-1.5 flex flex-wrap justify-between gap-x-3 text-xs text-muted">
          <span>
            {pct}% of {euro.format(debt.total)} paid
          </span>
          <span>
            {debt.firstDate ? `Since ${formatDate(debt.firstDate)}` : "No transactions yet"}
            {debt.openingRemaining > 0 && ` · ${euro.format(debt.openingRemaining)} owed before that`}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-[13px] text-muted">
          {payments.length} payment{payments.length === 1 ? "" : "s"}
          {additions.length > 0 && ` · ${additions.length} time${additions.length === 1 ? "" : "s"} borrowed`}
        </div>
        <TransactionTable
          transactions={transactions}
          options={options}
          emptyMessage="No transactions linked yet. Open a transaction (or its recurring payment) and pick this debt."
        />
      </div>
    </div>
  );
}

// Shows a stored "30000.00" as "30.000,00", the format people type in.
const amount = new Intl.NumberFormat("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const toInput = (value: string | null) => (value ? amount.format(Number(value)) : "");

function DebtForm({ debt, onDone }: { debt?: EditableDebt; onDone: () => void }) {
  const [state, formAction, pending] = useActionState<DebtState, FormData>(saveDebt, {});
  const values = state.values ?? {
    name: debt?.name ?? "",
    totalAmount: toInput(debt?.totalAmount ?? null),
    remainingAmount: toInput(debt?.remainingAmount ?? null),
    monthlyPayment: toInput(debt?.monthlyPayment ?? null),
  };

  useEffect(() => {
    if (state.saved) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      {debt && <input type="hidden" name="id" value={debt.id} />}
      <Field
        label="Name"
        name="name"
        placeholder="Student loan · DUO"
        defaultValue={values.name}
        error={state.errors?.name}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Borrowed before (€, optional)"
          name="totalAmount"
          inputMode="decimal"
          placeholder="30.000,00"
          defaultValue={values.totalAmount}
          error={state.errors?.totalAmount}
        />
        <Field
          label="Still owed before (€, optional)"
          name="remainingAmount"
          inputMode="decimal"
          placeholder="18.600,00"
          defaultValue={values.remainingAmount}
          error={state.errors?.remainingAmount}
        />
      </div>
      <p className="m-0 -mt-2 text-xs text-muted">
        What was owed before its first linked transaction; leave both empty if its transactions tell the whole
        story. Linked payments lower what&apos;s left, linked income adds to it.
      </p>
      <Field
        label="Monthly payment (€, optional)"
        name="monthlyPayment"
        inputMode="decimal"
        placeholder="210,00"
        defaultValue={values.monthlyPayment}
        error={state.errors?.monthlyPayment}
      />
      <div className="mt-1 flex justify-end gap-3">
        <button type="button" onClick={onDone} className={button.secondary}>
          Cancel
        </button>
        <button type="submit" disabled={pending} className={cx(button.primary, "disabled:opacity-70")}>
          {debt ? (pending ? "Saving…" : "Save changes") : pending ? "Adding…" : "Add debt"}
        </button>
      </div>
    </form>
  );
}
