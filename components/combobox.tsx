"use client";

import { type KeyboardEvent, useId, useState } from "react";
import { cx } from "@/components/ui";

type Item = { label: string; value: string };

/**
 * Text input with a filtered dropdown. Pick an option, or type something new and choose
 * "Add …". `onCommit` only fires on an explicit choice (click or Enter); clicking away or
 * pressing Escape restores `value`. An empty input committed with Enter commits "".
 *
 * With `name` it's a form field instead: the input submits its text under that name, and
 * clicking away keeps (and commits) what was typed rather than restoring `value`.
 */
export function Combobox({
  label,
  options,
  value,
  onCommit,
  name,
  autoFocus,
  placeholder,
  disabled,
  createLabel = (text) => `Add “${text}”`,
}: {
  label: string;
  options: string[];
  value: string;
  onCommit: (value: string) => void;
  name?: string;
  /** Marks the input for <Modal> to focus when it opens. */
  autoFocus?: boolean;
  placeholder?: string;
  disabled?: boolean;
  createLabel?: (text: string) => string;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  // Follow `value` when the parent changes it, e.g. reverting after a failed save.
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setQuery(value);
  }

  const text = query.trim();
  const needle = text.toLowerCase();
  const items: Item[] = options
    .filter((o) => o.toLowerCase().includes(needle))
    .map((o) => ({ label: o, value: o }));
  if (text && !options.some((o) => o.toLowerCase() === needle)) {
    items.push({ label: createLabel(text), value: text });
  }

  function commit(next: string) {
    setQuery(next);
    setOpen(false);
    if (next !== value) onCommit(next);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return setOpen(true);
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (items.length ? (i + step + items.length) % items.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      commit(open && items[active] ? items[active].value : text);
    } else if (e.key === "Escape" && open) {
      // Close just the list, not a surrounding dialog.
      e.preventDefault();
      setOpen(false);
      setQuery(value);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-ink-2">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          data-autofocus={autoFocus || undefined}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && items[active] ? `${id}-${active}` : undefined}
          autoComplete="off"
          value={query}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            if (name) return commit(text);
            setOpen(false);
            setQuery(value);
          }}
          onKeyDown={onKeyDown}
          className="h-11 w-full rounded-[10px] border border-line-strong bg-surface px-3.5 text-sm text-ink outline-none placeholder:text-faint focus:border-primary focus:ring-2 focus:ring-primary-soft disabled:opacity-70"
        />
        {open && items.length > 0 && (
          <ul
            id={listId}
            role="listbox"
            className="absolute top-full right-0 left-0 z-10 m-0 mt-1 max-h-56 list-none overflow-auto rounded-[10px] border border-line bg-surface p-1 shadow-lg"
          >
            {items.map((item, i) => (
              <li
                key={item.label}
                id={`${id}-${i}`}
                role="option"
                aria-selected={i === active}
                // Keep focus in the input so its blur doesn't close the list before the click lands.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commit(item.value)}
                onMouseEnter={() => setActive(i)}
                className={cx(
                  "cursor-pointer rounded-md px-2.5 py-2 text-sm",
                  i === active && "bg-track",
                  item.label !== item.value && "font-medium text-primary-text",
                )}
              >
                {item.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
