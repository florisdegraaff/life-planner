"use client";

import Link from "next/link";
import { useState } from "react";
import { useTheme } from "@/components/theme";
import { button, Icon, SectionLabel } from "@/components/ui";
import { icons, type Aisle } from "@/lib/data";

export function ShoppingList({
  groups,
  initialGot,
  subtitle,
}: {
  groups: { aisle: Aisle; items: { name: string; amount: string }[] }[];
  initialGot: Record<string, boolean>;
  subtitle: string;
}) {
  const [got, setGot] = useState(initialGot);
  const { isDark, toggleTheme } = useTheme();

  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const done = groups.reduce((n, g) => n + g.items.filter((it) => got[it.name]).length, 0);
  const pct = Math.round((done / total) * 100);

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col overflow-hidden bg-canvas text-ink">
      <header className="flex flex-col gap-3.5 bg-inverse px-5 pt-5 pb-[18px] text-white">
        <div className="flex items-center gap-2">
          <Link
            href="/recipes"
            aria-label="Back to recipes"
            className="-ml-3 flex size-11 items-center justify-center text-white hover:text-white"
          >
            <Icon d={icons.chevronLeft} strokeWidth={2.2} />
          </Link>
          <div className="flex-1">
            <div className="text-xs text-inverse-muted">{subtitle}</div>
            <h1 className="font-display text-2xl font-semibold">Shopping list</h1>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            aria-pressed={isDark}
            className="flex size-11 items-center justify-center rounded-[10px] text-white"
          >
            <Icon d={isDark ? icons.sun : icons.moon} />
          </button>
          <span className="font-mono text-sm">
            {done}/{total}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-[3px] bg-[#332B42]">
          <div className="h-1.5 rounded-[3px] bg-positive-on-dark transition-[width]" style={{ width: `${pct}%` }} />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-4">
        {groups.map((g) => (
          <div key={g.aisle} className="mt-3.5">
            <SectionLabel className="px-1 pb-1.5">{g.aisle}</SectionLabel>
            <div className="overflow-hidden rounded-[14px] border border-line bg-surface">
              {g.items.map((it) => {
                const isGot = !!got[it.name];
                return (
                  <label
                    key={it.name}
                    className="flex min-h-[54px] cursor-pointer items-center gap-3.5 border-t border-track px-4 first:border-t-0"
                  >
                    <input
                      type="checkbox"
                      checked={isGot}
                      onChange={() => setGot((s) => ({ ...s, [it.name]: !isGot }))}
                      className="m-0 size-[22px] accent-primary"
                    />
                    <span className={isGot ? "flex-1 text-base text-faint line-through" : "flex-1 text-base"}>{it.name}</span>
                    <span className={isGot ? "font-mono text-sm text-faint" : "font-mono text-sm text-ink-2"}>{it.amount}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <footer className="flex items-center gap-2.5 border-t border-line bg-surface px-4 pt-3 pb-5">
        <div className="flex flex-1 items-center gap-2 text-[13px] text-muted">
          <span aria-hidden="true" className="size-2 rounded-full bg-[#5FB98A]" />
          Synced with Todoist
        </div>
        <button type="button" className={button.secondary}>
          Add item
        </button>
      </footer>
    </div>
  );
}
