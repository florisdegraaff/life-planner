"use client";

import { useState } from "react";
import type { PickerOptions } from "@/components/finance/transaction-form";
import { TransactionTable } from "@/components/finance/transactions";
import { Modal } from "@/components/modal";
import { cx } from "@/components/ui";
import type { TransactionRow } from "@/lib/finance/transactions";

export type CategorySpending = {
  // null for uncategorised spending.
  name: string | null;
  total: string;
  pct: number;
};

/** The "By category" rows; clicking one lists the month's expenses in that category. */
export function CategoryBreakdown({
  spending,
  expenses,
  options,
}: {
  spending: CategorySpending[];
  expenses: TransactionRow[];
  options: PickerOptions;
}) {
  // undefined = closed; null = the uncategorised group.
  const [selected, setSelected] = useState<string | null>();
  const open = selected !== undefined;
  const current = spending.find((c) => c.name === selected);
  const rows = open ? expenses.filter((t) => t.category === selected) : [];

  return (
    <>
      {spending.map((c) => (
        <button
          key={c.name ?? ""}
          type="button"
          onClick={() => setSelected(c.name)}
          className="-mx-2 flex flex-col gap-1 rounded-[10px] px-2 py-1 text-left hover:bg-track/60"
        >
          <span className="flex w-full justify-between gap-3 text-sm">
            <span className={cx(!c.name && "text-muted")}>{c.name ?? "Uncategorised"}</span>
            <span className="font-mono">{c.total}</span>
          </span>
          {/* Same look as <Progress>, but with spans since a button may only contain phrasing content. */}
          <span className="block h-1.5 w-full overflow-hidden rounded-full bg-track">
            <span
              className={cx("block h-full rounded-full", c.name ? "bg-primary" : "bg-track-3")}
              style={{ width: `${c.pct}%` }}
            />
          </span>
        </button>
      ))}

      <Modal open={open} onClose={() => setSelected(undefined)} title={selected ?? "Uncategorised"} size="lg">
        <div className="flex flex-col gap-4">
          <div>
            <div className="font-mono text-[26px] font-medium">{current?.total}</div>
            <div className="text-xs text-muted">
              {rows.length} expense{rows.length === 1 ? "" : "s"} this month
            </div>
          </div>
          <TransactionTable
            transactions={rows}
            options={options}
            emptyMessage="No expenses in this category."
          />
        </div>
      </Modal>
    </>
  );
}
