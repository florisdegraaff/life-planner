"use client";

import { useState } from "react";
import { Card, CardTitle, Chip } from "@/components/ui";
import type { Transaction, TransactionType } from "@/lib/data";

const filters: { id: TransactionType | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "income", label: "Income" },
  { id: "expense", label: "Expenses" },
  { id: "debt", label: "Debt" },
];

const typeLabel: Record<TransactionType, string> = { income: "Income", expense: "Expense", debt: "Debt payment" };

export function Transactions({ transactions }: { transactions: Transaction[] }) {
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
            {rows.map((r) => (
              <tr key={r.date + r.desc} className="border-t border-track">
                <td className="py-3 pr-2 font-mono text-[13px] text-muted">{r.date}</td>
                <td className="px-2 py-3">{r.desc}</td>
                <td className="px-2 py-3">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-track px-2 py-[3px] text-xs text-ink-2">
                    {r.cat}
                    <span className="font-mono text-[10px] text-muted">{r.by}</span>
                  </span>
                </td>
                <td className="px-2 py-3 text-[13px]">{typeLabel[r.type]}</td>
                <td className="px-2 py-3 text-[13px] text-muted">{r.rec}</td>
                <td className="py-3 pl-2 text-right font-mono">{r.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-muted">
        Category tags: <span className="font-mono">rule</span> = matched by your rules, <span className="font-mono">AI</span> =
        suggested by Claude. Click a category to override.
      </div>
    </Card>
  );
}
