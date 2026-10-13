import type { Metadata } from "next";
import { button, Card, CardTitle, Chip, cx, Icon, Legend, PageHeader, Progress, StatCard } from "@/components/ui";
import { fitness } from "@/lib/data";

export const metadata: Metadata = { title: "Fitness" };

const logInput =
  "h-11 rounded-[10px] border border-line-strong bg-surface px-3 font-mono text-[15px] font-normal text-ink";

export default function FitnessPage() {
  const { weightTrend } = fitness;
  const lastPoint = weightTrend.points.split(" ").at(-1)!.split(",");

  return (
    <>
      <PageHeader eyebrow="Weight, intake & energy balance" title="Fitness">
        <form aria-label="Log today" className="flex flex-wrap items-end gap-2.5">
          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-2">
            Weight (kg)
            <input type="text" inputMode="decimal" placeholder="82,4" className={cx(logInput, "w-[100px]")} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-2">
            Intake (kcal)
            <input type="text" inputMode="numeric" placeholder="2.200" className={cx(logInput, "w-[110px]")} />
          </label>
          <button type="button" className={button.primary}>
            Log today
          </button>
        </form>
      </PageHeader>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4">
        {fitness.summary.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="flex flex-wrap gap-6">
        <Card className="min-w-0 flex-[3_1_520px]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Weight trend</CardTitle>
            <div role="group" aria-label="Range" className="flex gap-1.5">
              {fitness.ranges.map((r) => (
                <Chip key={r} on={r === "12 wk"}>
                  {r}
                </Chip>
              ))}
            </div>
          </div>
          <svg
            viewBox="0 0 640 230"
            role="img"
            aria-label="Weekly average weight over 12 weeks, from 85,1 kg down to 82,4 kg"
            className="mt-4 h-auto w-full"
          >
            <g strokeWidth="1" className="stroke-track">
              {weightTrend.yLabels.map((_, i) => (
                <line key={i} x1="40" y1={20 + i * 36} x2="630" y2={20 + i * 36} />
              ))}
            </g>
            <g fontSize="11" textAnchor="end" className="fill-muted font-mono">
              {weightTrend.yLabels.map((label, i) => (
                <text key={label} x="32" y={24 + i * 36}>
                  {label}
                </text>
              ))}
            </g>
            <polygon points={`${weightTrend.points} 620,200 40,200`} className="fill-primary-soft" />
            <polyline
              fill="none"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={weightTrend.points}
              className="stroke-primary"
            />
            <circle cx={lastPoint[0]} cy={lastPoint[1]} r="5" stroke="#FFFFFF" strokeWidth="2" className="fill-primary" />
            <g fontSize="11" textAnchor="middle" className="fill-muted font-mono">
              {weightTrend.xLabels.map((l) => (
                <text key={l.label} x={l.x} y="222">
                  {l.label}
                </text>
              ))}
            </g>
          </svg>
        </Card>

        <Card className="flex flex-[2_1_320px] flex-col gap-4">
          <CardTitle>Resting burn estimate</CardTitle>
          <div className="flex flex-col gap-3">
            {fitness.restingBurn.map((row) => (
              <div key={row.label} className="flex items-baseline justify-between border-b border-track pb-3">
                <div>
                  <div className="text-sm font-medium">{row.label}</div>
                  <div className="text-xs text-muted">{row.note}</div>
                </div>
                <span className="font-mono text-[17px]">{row.value}</span>
              </div>
            ))}
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-sm font-semibold">Used estimate</div>
                <div className="text-xs text-muted">{fitness.usedEstimate.note}</div>
              </div>
              <span className="font-mono text-[22px] font-medium text-primary">{fitness.usedEstimate.value}</span>
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex justify-between text-xs text-muted">
              <span>Confidence</span>
              <span>{fitness.confidence.label}</span>
            </div>
            <Progress pct={fitness.confidence.pct} className="h-2" />
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap gap-6">
        <Card className="min-w-0 flex-[3_1_520px]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Intake vs expenditure · this week</CardTitle>
            <Legend
              items={[
                { label: "Intake", className: "bg-strong" },
                { label: "Burned (rest + Strava)", className: "bg-accent-muted" },
              ]}
            />
          </div>
          <div
            role="img"
            aria-label="Daily intake was below expenditure on 5 of 7 days"
            className="mt-5 grid h-[170px] grid-cols-7 items-end gap-2.5 border-b border-line-strong"
          >
            {fitness.week.map((d) => (
              <div key={d.day} className="flex h-full items-end justify-center gap-1">
                <div className={cx("w-[18px] rounded-t bg-strong", d.partial && "opacity-45")} style={{ height: d.intake }} />
                <div className="w-[18px] rounded-t bg-accent-muted" style={{ height: d.burned }} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2.5 pt-2 text-center font-mono text-xs text-muted">
            {fitness.week.map((d) => (
              <span key={d.day}>{d.day}</span>
            ))}
          </div>
        </Card>

        <Card className="flex flex-[2_1_320px] flex-col gap-1">
          <div className="mb-2 flex items-center justify-between">
            <CardTitle>Strava</CardTitle>
            <span className="text-xs text-muted">synced {fitness.stravaSynced}</span>
          </div>
          {fitness.activities.map((a) => (
            <div key={a.name} className="flex min-h-[52px] items-center gap-3 border-t border-track">
              <div aria-hidden="true" className="flex size-9 items-center justify-center rounded-[10px] bg-accent-soft text-accent">
                <Icon d={a.icon} size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{a.name}</div>
                <div className="text-xs text-muted">{a.meta}</div>
              </div>
              <span className="font-mono text-[13px]">{a.kcal}</span>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}
