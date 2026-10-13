import type { Metadata } from "next";
import { Transactions } from "@/components/finance/transactions";
import { button, Card, CardTitle, cx, Icon, Legend, PageHeader, Progress, StatCard } from "@/components/ui";
import { finance, icons } from "@/lib/data";

export const metadata: Metadata = { title: "Finance" };

export default function FinancePage() {
  const { studentLoan, recurring } = finance;

  return (
    <>
      <PageHeader eyebrow="Debt, income & expenditure" title="Finance">
        <div className="flex h-11 items-center rounded-[10px] border border-line-strong bg-surface">
          <button type="button" aria-label="Previous month" className="flex h-[42px] w-11 items-center justify-center text-ink">
            <Icon d={icons.chevronLeft} size={16} strokeWidth={2.2} />
          </button>
          <span className="px-1.5 text-sm font-semibold">{finance.month}</span>
          <button type="button" aria-label="Next month" className="flex h-[42px] w-11 items-center justify-center text-ink">
            <Icon d={icons.chevronRight} size={16} strokeWidth={2.2} />
          </button>
        </div>
        <button type="button" className={button.secondary}>
          Connect bank
        </button>
        <button type="button" className={button.primary}>
          Add transaction
        </button>
      </PageHeader>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4">
        {finance.summary.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="flex flex-wrap gap-6">
        <Card className="flex-[2_1_480px]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Cash flow · last 6 months</CardTitle>
            <Legend
              items={[
                { label: "Income", className: "bg-primary" },
                { label: "Expenses", className: "bg-accent-muted" },
              ]}
            />
          </div>
          <div
            role="img"
            aria-label="Income stays near € 2.850 a month; expenses peaked at € 3.100 in July and are € 2.065 so far in October"
            className="mt-5 grid h-[200px] grid-cols-6 items-end gap-3 border-b border-line-strong px-2"
          >
            {finance.cashflow.map((m) => (
              <div key={m.month} className="flex h-full items-end justify-center gap-1">
                <div className="w-[22px] rounded-t bg-primary" style={{ height: m.income }} />
                <div
                  className={cx(
                    "w-[22px] rounded-t bg-accent-muted",
                    m.partial && "outline-[1.5px] -outline-offset-[1.5px] outline-accent outline-dashed",
                  )}
                  style={{ height: m.expenses }}
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-6 gap-3 px-2 pt-2 text-center font-mono text-xs text-muted">
            {finance.cashflow.map((m) => (
              <span key={m.month}>{m.month}</span>
            ))}
          </div>
        </Card>

        <Card className="flex flex-[1_1_320px] flex-col gap-3.5">
          <CardTitle>By category</CardTitle>
          {finance.categories.map((c) => (
            <div key={c.name} className="flex flex-col gap-1">
              <div className="flex justify-between text-sm">
                <span>{c.name}</span>
                <span className="font-mono">{c.amount}</span>
              </div>
              <Progress pct={c.pct} className="h-1.5" barClassName={c.flagged ? "bg-accent" : "bg-primary"} />
            </div>
          ))}
          <div className="text-xs text-accent-text">{finance.categoryNote}</div>
        </Card>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <Transactions transactions={finance.transactions} />

        <div className="flex flex-[1_1_320px] flex-col gap-6">
          <Card className="flex flex-col gap-4">
            <CardTitle>Debts</CardTitle>
            <div>
              <div className="flex justify-between text-sm font-medium">
                <span>{studentLoan.name}</span>
                <span className="font-mono">{studentLoan.remaining}</span>
              </div>
              <Progress pct={studentLoan.pct} className="mt-2 h-2.5" barClassName="bg-accent" />
              <div className="mt-1.5 flex justify-between text-xs text-muted">
                <span>
                  {studentLoan.pct}% of {studentLoan.total} paid
                </span>
                <span>
                  {studentLoan.monthly} · {studentLoan.eta}
                </span>
              </div>
            </div>
            {finance.paidOff.map((d) => (
              <div key={d.name} className="flex items-center gap-2.5 rounded-[10px] bg-primary-soft p-3 text-sm">
                <Icon d={icons.check} size={18} strokeWidth={2.4} className="text-primary" />
                <span className="flex-1">{d.name}</span>
                <span className="text-xs font-semibold text-primary-strong">Paid off · {d.when}</span>
              </div>
            ))}
          </Card>

          <Card className="flex flex-col gap-3.5">
            <CardTitle>Recurring vs one-off</CardTitle>
            <div className="flex h-3.5 overflow-hidden rounded-[7px]">
              <div className="bg-strong" style={{ width: `${recurring.pct}%` }} />
              <div className="flex-1 bg-track-3" />
            </div>
            <div className="flex justify-between text-sm">
              <span>Recurring · {recurring.recurringCount}</span>
              <span className="font-mono">{recurring.recurringAmount}</span>
            </div>
            <div className="flex justify-between text-sm text-ink-2">
              <span>One-off · {recurring.oneOffCount}</span>
              <span className="font-mono">{recurring.oneOffAmount}</span>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
