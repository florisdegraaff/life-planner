"use client";

import { useState } from "react";
import { button, cx, Icon, PageHeader, SectionLabel } from "@/components/ui";
import { icons, type Goal } from "@/lib/data";

type GoalState = "done" | "avail" | "locked";

const NODE_W = 200;
const NODE_H = 72;
const edgeColor: Record<GoalState, string> = { done: "#7B52C4", avail: "#C2633A", locked: "#8E8899" };

export function GoalsView({ goals, initialDone }: { goals: Goal[]; initialDone: Record<string, boolean> }) {
  const [done, setDone] = useState(initialDone);
  const [selId, setSelId] = useState("run10");
  const [view, setView] = useState<"tree" | "list">("tree");

  const byId = Object.fromEntries(goals.map((g) => [g.id, g]));
  const stateOf = (g: Goal): GoalState => (done[g.id] ? "done" : g.deps.every((d) => done[d]) ? "avail" : "locked");

  const sel = byId[selId];
  const selState = stateOf(sel);
  const reqs = sel.deps.map((d) => byId[d]);
  const unlocks = goals.filter((g) => g.deps.includes(sel.id));
  const doneCount = goals.filter((g) => done[g.id]).length;
  const availCount = goals.filter((g) => stateOf(g) === "avail").length;

  function undoSelected() {
    const next = { ...done };
    // Undoing a goal also undoes everything that depended on it.
    const clear = (id: string) => {
      delete next[id];
      goals.filter((g) => g.deps.includes(id)).forEach((g) => clear(g.id));
    };
    clear(selId);
    setDone(next);
  }

  const width = Math.max(...goals.map((g) => g.x)) + NODE_W + 40;
  const height = Math.max(...goals.map((g) => g.y)) + NODE_H + 68;

  return (
    <>
      <PageHeader eyebrow={`${doneCount} of ${goals.length} completed · ${availCount} available`} title="Goals">
        <div role="group" aria-label="View" className="flex rounded-[10px] bg-track-2 p-[3px]">
          {(["tree", "list"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={cx(
                "min-h-[38px] rounded-lg px-4 text-sm capitalize",
                view === v ? "bg-surface font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.08)]" : "text-ink-2",
              )}
            >
              {v}
            </button>
          ))}
        </div>
        <button type="button" className={button.primary}>
          New goal
        </button>
      </PageHeader>

      <div className="-mt-1 flex flex-wrap gap-5 text-[13px] text-ink-2">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="size-3.5 rounded bg-primary" />
          Completed
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="size-3.5 rounded border-2 border-accent bg-surface" />
          Available — all requirements met
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="size-3.5 rounded border border-dashed border-locked-line bg-locked" />
          Locked
        </span>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        {view === "tree" ? (
          <section
            aria-label="Goal tree"
            className="h-[600px] min-w-0 flex-[3_1_560px] overflow-auto rounded-2xl border border-line bg-surface-2 bg-[radial-gradient(var(--line-strong)_1px,transparent_1px)] bg-size-[20px_20px]"
          >
            <div className="relative" style={{ width, height }}>
              <svg width={width} height={height} aria-hidden="true" className="absolute top-0 left-0">
                {goals.flatMap((t) =>
                  t.deps.map((sid) => {
                    const s = byId[sid];
                    const x1 = s.x + NODE_W, y1 = s.y + NODE_H / 2, x2 = t.x, y2 = t.y + NODE_H / 2;
                    const st = stateOf(t);
                    return (
                      <path
                        key={`${sid}-${t.id}`}
                        d={`M${x1} ${y1} C${x1 + 30} ${y1}, ${x2 - 30} ${y2}, ${x2} ${y2}`}
                        fill="none"
                        stroke={edgeColor[st]}
                        strokeWidth={2.5}
                        strokeDasharray={st === "locked" ? "6 6" : undefined}
                        strokeLinecap="round"
                      />
                    );
                  }),
                )}
              </svg>
              {goals.map((g) => (
                <GoalNode
                  key={g.id}
                  goal={g}
                  state={stateOf(g)}
                  selected={g.id === selId}
                  onSelect={() => setSelId(g.id)}
                />
              ))}
            </div>
          </section>
        ) : (
          <section aria-label="Goal list" className="min-w-0 flex-[3_1_560px] rounded-2xl border border-line bg-surface px-6 pt-2 pb-4">
            {(
              [
                ["avail", "Available"],
                ["locked", "Locked"],
                ["done", "Completed"],
              ] as const
            ).map(([state, label]) => (
              <div key={state} className="mt-4">
                <SectionLabel className="mb-1">{label}</SectionLabel>
                {goals
                  .filter((g) => stateOf(g) === state)
                  .map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelId(g.id)}
                      className="flex min-h-12 w-full items-center gap-3 border-b border-track bg-transparent text-left text-sm text-ink"
                    >
                      <span className="flex-1 font-medium">{g.name}</span>
                      <span className="text-xs text-muted">{g.module}</span>
                      <span className="w-[170px] text-right text-xs text-muted">
                        {g.deps.length ? `needs ${g.deps.map((d) => byId[d].name).join(", ")}` : "starting goal"}
                      </span>
                    </button>
                  ))}
              </div>
            ))}
          </section>
        )}

        <aside aria-label="Selected goal" className="flex flex-[1_1_280px] flex-col gap-[18px] rounded-2xl border border-line bg-surface p-6">
          <div>
            <SectionLabel>{sel.module}</SectionLabel>
            <h2 className="mt-1 mb-2 font-display text-2xl leading-[1.15] font-semibold">{sel.name}</h2>
            {selState === "done" && (
              <span className="rounded-md bg-primary-soft px-2.5 py-1 text-[13px] font-semibold text-primary-strong">Completed</span>
            )}
            {selState === "avail" && (
              <span className="rounded-md bg-accent-soft px-2.5 py-1 text-[13px] font-semibold text-accent-text">Available now</span>
            )}
            {selState === "locked" && (
              <span className="rounded-md bg-locked px-2.5 py-1 text-[13px] font-semibold text-ink-2">Locked</span>
            )}
          </div>
          <div className="text-sm leading-normal text-ink-2">{sel.track}</div>
          <div>
            <div className="mb-1.5 text-[13px] font-semibold">Requires</div>
            {reqs.map((r) => (
              <div key={r.id} className="flex min-h-8 items-center gap-2 text-sm">
                <span className={cx("w-[18px] font-bold", done[r.id] ? "text-primary-text" : "text-accent-text")}>
                  {done[r.id] ? "✓" : "✗"}
                </span>
                {r.name}
              </div>
            ))}
            {reqs.length === 0 && <div className="text-sm text-muted">Nothing — a starting goal.</div>}
          </div>
          <div>
            <div className="mb-1.5 text-[13px] font-semibold">Unlocks</div>
            {unlocks.map((u) => (
              <div key={u.id} className="flex min-h-8 items-center gap-2 text-sm">
                <span aria-hidden="true" className="text-muted">
                  →
                </span>
                {u.name}
              </div>
            ))}
            {unlocks.length === 0 && <div className="text-sm text-muted">End goal.</div>}
          </div>
          <div className="mt-auto flex flex-col gap-2">
            {selState === "avail" && (
              <button type="button" onClick={() => setDone({ ...done, [selId]: true })} className={button.primary}>
                Mark as completed
              </button>
            )}
            {selState === "done" && (
              <button type="button" onClick={undoSelected} className={cx(button.secondary, "font-normal")}>
                Undo completion
              </button>
            )}
            <button type="button" className={button.secondary}>
              Link Todoist tasks
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}

function GoalNode({
  goal,
  state,
  selected,
  onSelect,
}: {
  goal: Goal;
  state: GoalState;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      style={{ left: goal.x, top: goal.y, width: NODE_W, height: NODE_H }}
      className={cx(
        "absolute flex flex-col justify-center gap-0.5 rounded-xl px-3.5 py-2.5 text-left outline-offset-[3px]",
        selected && "outline-[3px] outline-ink outline-solid",
        state === "done" && "bg-primary text-white",
        state === "avail" && "border-2 border-accent bg-surface text-ink shadow-[0_4px_14px_rgba(180,83,42,0.18)]",
        state === "locked" && "border-[1.5px] border-dashed border-locked-line bg-locked text-ink-2",
      )}
    >
      <span
        className={cx(
          "flex items-center gap-1 text-[11px] tracking-[0.08em] uppercase",
          state === "done" && "text-on-primary-muted",
          state === "avail" && "text-accent-text",
          state === "locked" && "text-muted",
        )}
      >
        {state === "done" && `✓ ${goal.module}`}
        {state === "avail" && `● ${goal.module} · available`}
        {state === "locked" && (
          <>
            <Icon d={icons.lock} size={11} strokeWidth={2.6} />
            {goal.module}
          </>
        )}
      </span>
      <span className={cx("text-sm", state === "locked" ? "font-medium" : "font-semibold")}>{goal.name}</span>
    </button>
  );
}
