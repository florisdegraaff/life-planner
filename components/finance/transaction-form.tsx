"use client";

import { useActionState, useEffect, useState } from "react";
import { saveTransaction, type TransactionFormState } from "@/app/(app)/finance/actions";
import { Combobox } from "@/components/combobox";
import { Field } from "@/components/field";
import { Modal } from "@/components/modal";
import { button, cx } from "@/components/ui";
import type { TransactionRow } from "@/lib/finance/transactions";

export type PickerOptions = { sources: string[]; categories: string[]; debts: string[] };

/** The "Add transaction" button in the Finance header, opening the form in a popup. */
export function AddTransactionButton({ options }: { options: PickerOptions }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={button.primary}>
        Add transaction
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add transaction">
        <TransactionForm options={options} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}

const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(new Date());

// Shows a stored "1234.50" as "1.234,50", the format people type in.
const amountInput = new Intl.NumberFormat("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Form for adding a transaction or, given `transaction`, editing it. Category and debt are the
 * transaction's own; leaving them empty falls back to its recurring payment's and source's.
 */
export function TransactionForm({
  transaction: t,
  options,
  onDone,
}: {
  transaction?: TransactionRow;
  options: PickerOptions;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<TransactionFormState, FormData>(saveTransaction, {});
  const [initialDate] = useState(today);
  const values = state.values ?? {
    date: t?.isoDate ?? initialDate,
    description: t?.source ?? "",
    type: t?.type ?? "expense",
    amount: t ? amountInput.format(Number(t.plainAmount)) : "",
    category: t?.ownCategory ?? "",
    debt: t?.ownDebt ?? "",
  };
  // Controlled so the debt label can follow it ("pays off" vs "adds to").
  const [type, setType] = useState(values.type);
  const [category, setCategory] = useState(values.category);
  const [description, setDescription] = useState(values.description);
  const [debt, setDebt] = useState(values.debt);

  useEffect(() => {
    if (state.saved) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      {t && <input type="hidden" name="id" value={t.id} />}
      <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
        <legend className="mb-1.5 p-0 text-[13px] font-medium text-ink-2">Type</legend>
        <div className="grid grid-cols-2 gap-1 rounded-[10px] border border-line-strong p-1">
          {(["expense", "income"] as const).map((option) => (
            <label
              key={option}
              className={cx(
                "flex h-9 cursor-pointer items-center justify-center rounded-[7px] text-sm font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary",
                type === option ? "bg-strong text-on-strong" : "text-ink-2 hover:bg-track",
              )}
            >
              <input
                type="radio"
                name="type"
                value={option}
                checked={type === option}
                onChange={() => setType(option)}
                className="sr-only"
              />
              {option === "expense" ? "Expense" : "Income"}
            </label>
          ))}
        </div>
        {state.errors?.type && <p className="m-0 text-[13px] text-accent-text">{state.errors.type}</p>}
      </fieldset>

      <div>
        <Combobox
          label="Source or description"
          name="description"
          options={options.sources}
          value={description}
          onCommit={setDescription}
          // Editing usually means fixing an amount or category, so don't pop the source list open.
          autoFocus={!t}
          placeholder={type === "expense" ? "Albert Heijn" : "Salary"}
          createLabel={(text) => `New: “${text}”`}
        />
        <p
          className={cx("m-0 mt-1.5 text-xs", state.errors?.description ? "text-[13px] text-accent-text" : "text-muted")}
        >
          {state.errors?.description ??
            (t && t.source !== t.description
              ? `Bank description: ${t.description}`
              : "Pick one of your sources, or type a description to start a new one.")}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Amount (€)"
          name="amount"
          inputMode="decimal"
          placeholder="12,50"
          data-autofocus={t ? true : undefined}
          defaultValue={values.amount}
          error={state.errors?.amount}
        />
        <Field label="Date" name="date" type="date" defaultValue={values.date} error={state.errors?.date} />
      </div>
      <div>
        <Combobox
          label="Category (optional)"
          name="category"
          options={options.categories}
          value={category}
          onCommit={setCategory}
          placeholder={t?.inheritedCategory ?? "From its source, if it has one"}
        />
        {state.errors?.category && (
          <p className="m-0 mt-1.5 text-[13px] text-accent-text">{state.errors.category}</p>
        )}
      </div>
      <div>
        <Combobox
          label={type === "income" ? "Adds to debt (optional)" : "Pays off debt (optional)"}
          name="debt"
          options={options.debts}
          value={debt}
          onCommit={setDebt}
          placeholder={t?.debt?.via === "recurring" ? t.debt.name : "No debt"}
          createLabel={(text) => `Add debt “${text}”`}
        />
        {state.errors?.debt && <p className="m-0 mt-1.5 text-[13px] text-accent-text">{state.errors.debt}</p>}
      </div>

      <div className="mt-1 flex justify-end gap-3">
        <button type="button" onClick={onDone} className={button.secondary}>
          Cancel
        </button>
        <button type="submit" disabled={pending} className={cx(button.primary, "disabled:opacity-70")}>
          {t ? (pending ? "Saving…" : "Save changes") : pending ? "Adding…" : "Add transaction"}
        </button>
      </div>
    </form>
  );
}
