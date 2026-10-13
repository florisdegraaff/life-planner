import type { ComponentProps } from "react";
import { cx } from "../ui";

/** Labelled text input with an optional error message underneath. */
export function Field({ label, name, error, ...props }: ComponentProps<"input"> & { label: string; name: string; error?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-[13px] font-medium text-ink-2">
        {label}
      </label>
      <input
        id={name}
        name={name}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        className={cx(
          "h-11 w-full rounded-[10px] border bg-surface px-3.5 text-sm text-ink outline-none placeholder:text-faint focus:border-primary focus:ring-2 focus:ring-primary-soft",
          error ? "border-accent" : "border-line-strong",
        )}
        {...props}
      />
      {error && (
        <p id={`${name}-error`} className="m-0 text-[13px] text-accent-text">
          {error}
        </p>
      )}
    </div>
  );
}
