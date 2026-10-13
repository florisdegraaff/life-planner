import type { ComponentProps, ReactNode } from "react";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function Icon({
  d,
  size = 20,
  strokeWidth = 2,
  className,
}: {
  d: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cx("flex-none", className)}
    >
      <path d={d} />
    </svg>
  );
}

export const button = {
  primary:
    "inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-primary px-[18px] text-sm font-semibold text-white",
  secondary:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-line-strong bg-surface px-4 text-sm font-medium text-ink",
  strong:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-strong px-[18px] text-sm font-semibold text-on-strong",
};

export function Card({ className, ...props }: ComponentProps<"section">) {
  return <section className={cx("rounded-2xl border border-line bg-surface p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentProps<"h2">) {
  return <h2 className={cx("m-0 font-display text-xl font-semibold", className)} {...props} />;
}

export function SectionLabel({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("text-xs uppercase tracking-[0.08em] text-muted", className)} {...props} />;
}

export function PageHeader({ eyebrow, title, children }: { eyebrow: ReactNode; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="text-[13px] text-muted">{eyebrow}</div>
        <h1 className="mt-1 font-display text-[34px] leading-tight font-semibold tracking-[-0.02em]">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2.5">{children}</div>}
    </header>
  );
}

export function StatCard({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone?: "accent" | "inverse" | "positive";
}) {
  const inverse = tone === "inverse";
  return (
    <div
      className={cx(
        "rounded-[14px] px-5 py-[18px]",
        inverse ? "bg-inverse text-white" : "border border-line bg-surface",
      )}
    >
      <div className={cx("text-[13px]", inverse ? "text-inverse-muted" : "text-muted")}>{label}</div>
      <div
        className={cx(
          "mt-1.5 font-mono text-[26px] font-medium",
          tone === "accent" && "text-accent-text",
          inverse && "text-positive-on-dark",
        )}
      >
        {value}
      </div>
      <div
        className={cx(
          "mt-1 text-xs",
          inverse ? "text-inverse-muted" : tone === "positive" ? "font-semibold text-primary-strong" : "text-muted",
        )}
      >
        {note}
      </div>
    </div>
  );
}

export function Progress({
  pct,
  className = "h-2.5",
  barClassName = "bg-primary",
}: {
  pct: number;
  className?: string;
  barClassName?: string;
}) {
  return (
    <div className={cx("overflow-hidden rounded-full bg-track", className)}>
      <div className={cx("h-full rounded-full", barClassName)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Legend({ items }: { items: { label: string; className: string }[] }) {
  return (
    <div className="flex gap-4 text-[13px] text-ink-2">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span aria-hidden="true" className={cx("size-2.5 rounded-[2px]", item.className)} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

/** Rounded toggle chip used for filters and tag pickers. */
export function Chip({
  on,
  className,
  ...props
}: ComponentProps<"button"> & { on: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      className={cx(
        "min-h-9 rounded-full px-3.5 text-[13px]",
        on ? "bg-strong font-medium text-on-strong" : "border border-line-strong bg-surface text-ink",
        className,
      )}
      {...props}
    />
  );
}

/** Square-ish option in a single-choice group (radio semantics). */
export function OptionButton({
  on,
  className,
  ...props
}: ComponentProps<"button"> & { on: boolean }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      className={cx(
        "min-h-11 rounded-[10px] text-sm",
        on ? "border-[1.5px] border-ink bg-strong font-medium text-on-strong" : "border border-line-strong bg-surface text-ink",
        className,
      )}
      {...props}
    />
  );
}

export function Checkbox({ className, ...props }: ComponentProps<"input">) {
  return <input type="checkbox" className={cx("m-0 size-[18px] accent-primary", className)} {...props} />;
}
