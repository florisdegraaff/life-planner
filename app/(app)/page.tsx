import Link from "next/link";
import { TodayTasks } from "@/components/overview/today-tasks";
import { button, Card, CardTitle, cx, Icon, Progress } from "@/components/ui";
import { finance, fitness, icons, overview, user } from "@/lib/data";

export default function OverviewPage() {
  const { budget, studentLoan } = finance;

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[13px] text-muted">{overview.date}</div>
          <h1 className="mt-1 font-display text-[34px] leading-tight font-semibold tracking-[-0.02em]">
            {overview.greeting}, {user.firstName}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="flex h-11 min-w-[260px] items-center gap-2 rounded-[10px] border border-line-strong bg-surface px-3.5 text-muted">
            <Icon d={icons.search} size={18} />
            <input
              type="search"
              aria-label="Search everything"
              placeholder="Search recipes, goals, transactions…"
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none"
            />
          </label>
          <button type="button" className={button.primary}>
            <Icon d={icons.plus} size={16} strokeWidth={2.4} />
            Quick add
          </button>
        </div>
      </header>

      <section
        aria-label="Suggestion from your calendar"
        className="flex flex-wrap items-center gap-4 rounded-2xl border border-accent-border bg-accent-soft px-5 py-[18px]"
      >
        <div aria-hidden="true" className="flex size-11 flex-none items-center justify-center rounded-[10px] bg-accent text-white">
          <Icon d={icons.calendar} size={22} />
        </div>
        <div className="flex-[1_1_320px]">
          <div className="text-[13px] font-semibold text-accent-text">{overview.suggestion.label}</div>
          <div className="mt-0.5 text-base font-medium">{overview.suggestion.text}</div>
        </div>
        <Link href="/lists" className={cx(button.strong, "no-underline hover:text-on-strong")}>
          Fill in Trip form
        </Link>
        <button
          type="button"
          className="min-h-11 rounded-[10px] border border-accent-border bg-transparent px-3.5 text-sm text-accent-text"
        >
          Dismiss
        </button>
      </section>

      <div className="flex flex-wrap gap-6">
        <Card className="flex min-w-0 flex-[2_1_460px] flex-col gap-[22px]">
          <div className="flex items-center justify-between">
            <CardTitle>Finance · October</CardTitle>
            <Link href="/finance" className="text-sm font-medium no-underline">
              Open Finance →
            </Link>
          </div>
          <div className="flex flex-wrap gap-9">
            <div>
              <div className="text-[13px] text-muted">Left to spend</div>
              <div className="mt-0.5 font-mono text-[34px] font-medium tracking-[-0.02em]">{budget.left}</div>
              <div className="mt-0.5 text-[13px] text-muted">
                of {budget.total} · {budget.daysLeft} days to go
              </div>
            </div>
            <div>
              <div className="text-[13px] text-muted">Net this month</div>
              <div className="mt-2 font-mono text-[22px] font-medium text-primary">{budget.net}</div>
            </div>
            <div className="flex-[1_1_180px]">
              <div className="text-[13px] text-muted">Student loan paid off</div>
              <div className="mt-2 font-mono text-[22px] font-medium">{studentLoan.pct}%</div>
              <Progress pct={studentLoan.pct} className="mt-2 h-1.5" barClassName="bg-accent" />
            </div>
          </div>
          <div>
            <div className="mb-2 flex justify-between text-[13px] text-muted">
              <span>Spent {budget.spent}</span>
              <span>{budget.pct}% of budget</span>
            </div>
            <Progress pct={budget.pct} />
          </div>
          <div>
            <h3 className="mb-1.5 text-sm font-semibold">Upcoming recurring</h3>
            {overview.upcoming.map((u) => (
              <div key={u.name} className="flex items-center gap-3.5 border-t border-track py-2.5 text-sm">
                <span className="w-12 font-mono text-[13px] text-muted">{u.date}</span>
                <span className="min-w-0 flex-1">{u.name}</span>
                <span className="rounded-md bg-track px-2 py-[3px] text-xs text-ink-2">{u.cat}</span>
                <span className="w-24 text-right font-mono">{u.amount}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex flex-[1_1_320px] flex-col gap-5">
          <div className="flex items-center justify-between">
            <CardTitle>Fitness</CardTitle>
            <Link href="/fitness" className="text-sm font-medium no-underline">
              Open →
            </Link>
          </div>
          <div className="flex items-baseline gap-3">
            <div className="font-mono text-[34px] font-medium tracking-[-0.02em]">
              {fitness.current.weight} <span className="text-base text-muted">kg</span>
            </div>
            <span className="rounded-md bg-primary-soft px-2 py-[3px] text-[13px] font-semibold text-primary">
              {fitness.current.weekDelta}
            </span>
          </div>
          <svg
            viewBox="0 0 240 64"
            role="img"
            aria-label="Weight over the last 12 weeks, trending down from 85,1 to 82,4 kg"
            className="h-16 w-full"
            preserveAspectRatio="none"
          >
            <polyline
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={overview.weightSparkline}
              className="stroke-primary"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div>
            <div className="mb-2 flex justify-between text-[13px] text-muted">
              <span>Intake today</span>
              <span className="font-mono">{fitness.current.intakeToday}</span>
            </div>
            <Progress pct={fitness.current.intakePct} barClassName="bg-strong" />
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-canvas p-3 text-[13px]">
            <Icon d={icons.fitness} className="text-accent" />
            <span className="flex-1">{fitness.latestActivity.name}</span>
            <span className="font-mono text-muted">{fitness.latestActivity.kcal}</span>
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap gap-6">
        <Card className="flex flex-[1_1_340px] flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <CardTitle>Meals this week</CardTitle>
            <Link href="/recipes" className="text-sm font-medium no-underline">
              Cart →
            </Link>
          </div>
          {overview.meals.map((m) => (
            <div key={m.day} className="flex items-center gap-3 text-sm">
              <span className="w-9 font-mono text-xs text-muted">{m.day}</span>
              <span className="min-w-0 flex-1">{m.name}</span>
              <span className="font-mono text-xs text-muted">{m.kcal}</span>
            </div>
          ))}
          <div className="mt-auto flex flex-wrap items-center gap-2.5 border-t border-track pt-3.5">
            <div className="flex-[1_1_140px] text-[13px] text-muted">Shopping list · 23 items · ≈ € 46</div>
            <button type="button" className={cx(button.secondary, "px-3.5")}>
              Send to Todoist
            </button>
          </div>
        </Card>

        <Card className="flex flex-[1_1_340px] flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <CardTitle>Goals</CardTitle>
            <Link href="/goals" className="text-sm font-medium no-underline">
              Tree →
            </Link>
          </div>
          <div className="flex items-center gap-2.5 text-[13px] text-muted">
            <div className="flex h-2 flex-1 overflow-hidden rounded bg-track">
              <div className="w-[36%] bg-primary" />
              <div className="w-[27%] bg-accent-muted" />
            </div>
            <span>4 of 11 done</span>
          </div>
          <div className="mt-1 text-[13px] font-semibold">Available now</div>
          {overview.availableGoals.map((g) => (
            <Link
              key={g.name}
              href="/goals"
              className="flex min-h-10 items-center gap-3 rounded-[10px] border-[1.5px] border-accent px-3 text-sm text-ink no-underline hover:bg-accent-soft hover:text-ink"
            >
              <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
              <span className="flex-1">{g.name}</span>
              <span className="text-xs text-muted">{g.module}</span>
            </Link>
          ))}
        </Card>

        <Card className="flex flex-[1_1_300px] flex-col gap-1.5">
          <div className="mb-2 flex items-center justify-between">
            <CardTitle>Today</CardTitle>
            <span className="text-xs text-muted">from Todoist</span>
          </div>
          <TodayTasks tasks={overview.tasks} />
        </Card>
      </div>
    </>
  );
}
