import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ImportCsvButton } from "@/components/finance/import-csv-button";
import { AddTransactionButton, type PickerOptions } from "@/components/finance/transaction-form";
import { CategoryBreakdown } from "@/components/finance/category-breakdown";
import { DebtButton, NewDebtButton } from "@/components/finance/debt-form";
import { Transactions } from "@/components/finance/transactions";
import { button, Card, CardTitle, cx, Icon, Legend, PageHeader, Progress, StatCard } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/session";
import { icons } from "@/lib/data";
import { getCashflow } from "@/lib/finance/cashflow";
import { getCategoryNames, getSpendingByCategory } from "@/lib/finance/categories";
import { type DebtSummary, getDebtNames, getDebts } from "@/lib/finance/debts";
import { formatEuro } from "@/lib/finance/format";
import { addMonths, currentMonth, monthLabel, monthParam, monthShortLabel, parseMonth } from "@/lib/finance/month";
import { getRecurringSplit } from "@/lib/finance/recurring";
import { getSourceNames } from "@/lib/finance/sources";
import { getTransactions } from "@/lib/finance/transactions";

export const metadata: Metadata = { title: "Finance" };

export default function FinancePage({ searchParams }: PageProps<"/finance">) {

  return (
    <>
      <PageHeader eyebrow="Debt, income & expenditure" title="Finance">
        <Suspense fallback={<div className="h-11 w-[214px] rounded-[10px] border border-line-strong bg-surface" />}>
          <MonthSelector searchParams={searchParams} />
        </Suspense>
        <button type="button" className={button.secondary}>
          Connect bank
        </button>
        <ImportCsvButton />
        <Suspense
          fallback={
            <button type="button" disabled className={button.primary}>
              Add transaction
            </button>
          }
        >
          <AddTransactionSection />
        </Suspense>
      </PageHeader>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4">
        <Suspense fallback={<SummarySkeleton />}>
          <SummarySection searchParams={searchParams} />
        </Suspense>
      </div>

      <div className="flex flex-wrap gap-6">
        <Suspense fallback={<div className="h-[300px] min-w-0 flex-[2_1_480px] animate-pulse rounded-2xl bg-track" />}>
          <CashflowSection searchParams={searchParams} />
        </Suspense>

        <Suspense fallback={<div className="h-[300px] min-w-0 flex-[1_1_320px] animate-pulse rounded-2xl bg-track" />}>
          <CategoriesSection searchParams={searchParams} />
        </Suspense>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <Suspense fallback={<div className="h-[320px] min-w-0 flex-[2_1_560px] animate-pulse rounded-[10px] bg-track" />}>
          <TransactionsSection searchParams={searchParams} />
        </Suspense>

        <div className="flex flex-[1_1_320px] flex-col gap-6">
          <Suspense fallback={<div className="h-[180px] animate-pulse rounded-2xl bg-track" />}>
            <DebtsSection />
          </Suspense>

          <Suspense fallback={<div className="h-[150px] animate-pulse rounded-2xl bg-track" />}>
            <RecurringSplitSection searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </>
  );
}

type SearchParamsProps = Pick<PageProps<"/finance">, "searchParams">;

// The selected month lives in the URL (`?month=YYYY-MM`), so the arrows are plain links.
async function MonthSelector({ searchParams }: SearchParamsProps) {
  const { month: param } = await searchParams;
  // Defaulting to today's month reads the clock, which must happen at request time, not while prerendering.
  await connection();
  const month = parseMonth(param);

  return (
    <div className="flex h-11 items-center rounded-[10px] border border-line-strong bg-surface">
      <Link
        href={`/finance?month=${monthParam(addMonths(month, -1))}`}
        aria-label="Previous month"
        className="flex h-[42px] w-11 items-center justify-center text-ink"
      >
        <Icon d={icons.chevronLeft} size={16} strokeWidth={2.2} />
      </Link>
      <span className="min-w-[126px] px-1.5 text-center text-sm font-semibold">{monthLabel(month)}</span>
      <Link
        href={`/finance?month=${monthParam(addMonths(month, 1))}`}
        aria-label="Next month"
        className="flex h-[42px] w-11 items-center justify-center text-ink"
      >
        <Icon d={icons.chevronRight} size={16} strokeWidth={2.2} />
      </Link>
    </div>
  );
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

// Income, expenses and net for the selected month, plus what's left on all debts today.
async function SummarySection({ searchParams }: SearchParamsProps) {
  const [user, { month }] = await Promise.all([getCurrentUser(), searchParams]);
  if (!user) redirect("/login");

  const [[m], allDebts] = await Promise.all([getCashflow(user.id, parseMonth(month), 1), getDebts(user.id)]);
  const net = m.income - m.expenses;
  const openDebts = allDebts.filter((d) => d.remaining > 0);
  const debtLeft = openDebts.reduce((sum, d) => sum + d.remaining, 0);
  const debtMonthly = openDebts.reduce((sum, d) => sum + (d.monthly ?? 0), 0);

  return (
    <>
      <StatCard label="Income" value={formatEuro(m.income)} note={plural(m.incomeCount, "transaction")} />
      <StatCard label="Expenses" value={formatEuro(m.expenses)} note={plural(m.expenseCount, "transaction")} />
      <StatCard
        label="Debt remaining"
        tone="accent"
        value={formatEuro(debtLeft)}
        note={
          plural(openDebts.length, "open debt") + (debtMonthly ? ` · ${formatEuro(debtMonthly)} / month` : "")
        }
      />
      <StatCard
        label="Net"
        tone="inverse"
        value={`${net < 0 ? "−" : "+"} ${formatEuro(Math.abs(net))}`}
        note={m.partial ? "income − expenses so far" : "income − expenses"}
      />
    </>
  );
}

function SummarySkeleton() {
  return Array.from({ length: 4 }, (_, i) => <div key={i} className="h-[106px] animate-pulse rounded-[14px] bg-track" />);
}

const monthYear = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "Europe/Amsterdam" });

// Only the fields the edit form needs: the balance as entered, before its transactions.
const toEditable = (d: DebtSummary) => ({
  id: d.id,
  name: d.name,
  totalAmount: d.openingTotal.toFixed(2),
  remainingAmount: d.openingRemaining.toFixed(2),
  monthlyPayment: d.monthlyPayment,
});

async function DebtsSection() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [all, options] = await Promise.all([getDebts(user.id), getPickerOptions(user.id)]);
  const open = all.filter((d) => d.remaining > 0);
  const paidOff = all.filter((d) => d.remaining === 0);
  const now = currentMonth();

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <CardTitle>Debts</CardTitle>
        <NewDebtButton />
      </div>
      {all.length === 0 && <p className="m-0 text-sm text-muted">No debts yet.</p>}
      {open.map((d) => {
        const pct = d.total ? Math.round(((d.total - d.remaining) / d.total) * 100) : 0;
        const eta = d.monthly ? monthLabel(addMonths(now, Math.ceil(d.remaining / d.monthly))) : null;
        return (
          <div key={d.id} className="relative -m-2 p-2">
            <div className="flex justify-between gap-3 text-sm font-medium">
              <span>{d.name}</span>
              <span className="font-mono">{formatEuro(d.remaining)}</span>
            </div>
            <Progress pct={pct} className="mt-2 h-2.5" barClassName="bg-accent" />
            <div className="mt-1.5 flex justify-between gap-3 text-xs text-muted">
              <span>
                {pct}% of {formatEuro(d.total)} paid
              </span>
              {d.monthly && (
                <span>
                  {formatEuro(d.monthly)} / month · ≈ {eta}
                </span>
              )}
            </div>
            <DebtButton debt={toEditable(d)} options={options} />
          </div>
        );
      })}
      {paidOff.map((d) => (
        <div key={d.id} className="relative flex items-center gap-2.5 rounded-[10px] bg-primary-soft p-3 text-sm">
          <Icon d={icons.check} size={18} strokeWidth={2.4} className="text-primary" />
          <span className="flex-1">{d.name}</span>
          <span className="text-xs font-semibold text-primary-strong">
            Paid off · {monthYear.format(d.lastPaymentDate ? new Date(`${d.lastPaymentDate}T12:00:00Z`) : d.updatedAt)}
          </span>
          <DebtButton debt={toEditable(d)} options={options} />
        </div>
      ))}
    </Card>
  );
}

// The selected month's spending per category; bars are relative to the biggest category.
async function CategoriesSection({ searchParams }: SearchParamsProps) {
  const [user, { month }] = await Promise.all([getCurrentUser(), searchParams]);
  if (!user) redirect("/login");

  const selected = parseMonth(month);
  const [spending, transactions, options] = await Promise.all([
    getSpendingByCategory(user.id, selected),
    getTransactions(user.id, selected),
    getPickerOptions(user.id),
  ]);
  const max = spending[0]?.total ?? 0;

  return (
    <Card className="flex min-w-0 flex-[1_1_320px] flex-col gap-3.5">
      <CardTitle>By category</CardTitle>
      {spending.length === 0 && <p className="m-0 text-sm text-muted">No expenses this month.</p>}
      <CategoryBreakdown
        spending={spending.map((c) => ({
          name: c.name,
          total: formatEuro(c.total),
          pct: Math.round((c.total / max) * 100),
        }))}
        expenses={transactions.filter((t) => t.type === "expense")}
        options={options}
      />
    </Card>
  );
}

// How much of the selected month's spending is recurring (subscriptions, bills) vs one-off.
async function RecurringSplitSection({ searchParams }: SearchParamsProps) {
  const [user, { month }] = await Promise.all([getCurrentUser(), searchParams]);
  if (!user) redirect("/login");

  const { recurring, oneOff } = await getRecurringSplit(user.id, parseMonth(month));
  const total = recurring.total + oneOff.total;
  const pct = total ? Math.round((recurring.total / total) * 100) : 0;

  return (
    <Card className="flex flex-col gap-3.5">
      <CardTitle>Recurring vs one-off</CardTitle>
      <div
        role="img"
        aria-label={total ? `${pct}% of this month's spending is recurring` : "No expenses this month"}
        className="flex h-3.5 overflow-hidden rounded-[7px] bg-track-3"
      >
        <div className="bg-strong" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-sm">
        <span>Recurring · {recurring.count}</span>
        <span className="font-mono">{formatEuro(recurring.total)}</span>
      </div>
      <div className="flex justify-between text-sm text-ink-2">
        <span>One-off · {oneOff.count}</span>
        <span className="font-mono">{formatEuro(oneOff.total)}</span>
      </div>
    </Card>
  );
}

// The lists the pickers in forms and popups offer: sources, categories and debts by name.
async function getPickerOptions(userId: string): Promise<PickerOptions> {
  const [sources, categories, debts] = await Promise.all([
    getSourceNames(userId),
    getCategoryNames(userId),
    getDebtNames(userId),
  ]);
  return { sources, categories, debts };
}

const CHART_HEIGHT = 200;

// Six months of income vs expenses ending with the selected month.
async function CashflowSection({ searchParams }: SearchParamsProps) {
  const [user, { month }] = await Promise.all([getCurrentUser(), searchParams]);
  if (!user) redirect("/login");

  const cashflow = await getCashflow(user.id, parseMonth(month));
  const max = Math.max(...cashflow.flatMap((m) => [m.income, m.expenses]));
  const height = (amount: number) => (max ? Math.round((amount / max) * CHART_HEIGHT) : 0);
  const summary = cashflow
    .map((m) => `${monthLabel(m.month)}: ${formatEuro(m.income)} in, ${formatEuro(m.expenses)} out${m.partial ? " so far" : ""}`)
    .join("; ");

  return (
    <Card className="min-w-0 flex-[2_1_480px]">
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
        aria-label={`Income and expenses per month. ${summary}.`}
        className="mt-5 grid grid-cols-6 items-end gap-3 border-b border-line-strong px-2"
        style={{ height: CHART_HEIGHT }}
      >
        {cashflow.map((m) => (
          <div key={monthParam(m.month)} className="flex h-full items-end justify-center gap-1">
            <div
              title={`Income ${formatEuro(m.income)}`}
              className="w-[22px] rounded-t bg-primary"
              style={{ height: height(m.income) }}
            />
            <div
              title={`Expenses ${formatEuro(m.expenses)}${m.partial ? " so far" : ""}`}
              className={cx(
                "w-[22px] rounded-t bg-accent-muted",
                m.partial && "outline-[1.5px] -outline-offset-[1.5px] outline-accent outline-dashed",
              )}
              style={{ height: height(m.expenses) }}
            />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-6 gap-3 px-2 pt-2 text-center font-mono text-xs text-muted">
        {cashflow.map((m) => (
          <span key={monthParam(m.month)}>{monthShortLabel(m.month)}</span>
        ))}
      </div>
    </Card>
  );
}

// The header's "Add transaction" button; its form needs the user's sources, categories and debts.
async function AddTransactionSection() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <AddTransactionButton options={await getPickerOptions(user.id)} />;
}

// Reads the session cookie and the URL, so it streams in behind the Suspense boundary.
async function TransactionsSection({ searchParams }: SearchParamsProps) {
  const [user, { month }] = await Promise.all([getCurrentUser(), searchParams]);
  if (!user) redirect("/login");

  const [transactions, options] = await Promise.all([
    getTransactions(user.id, parseMonth(month)),
    getPickerOptions(user.id),
  ]);
  return <Transactions transactions={transactions} options={options} />;
}
