"use client";

import { type ReactNode, useEffect, useId, useRef } from "react";
import { cx, Icon } from "@/components/ui";
import { icons } from "@/lib/data";

/**
 * Popup built on the native <dialog>, which traps focus, closes on Escape and returns
 * focus to the opener. The parent owns `open`; children only mount while it's open, so
 * forms inside start fresh every time.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** "lg" fits wider content such as a table. */
  size?: "md" | "lg";
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Start in an element marked data-autofocus, else the first field, rather than on the close button.
      (
        dialog.querySelector<HTMLElement>("[data-autofocus]") ??
        dialog.querySelector<HTMLElement>("input, select, textarea")
      )?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // Fires for Escape as well as dialog.close(), keeping the parent's state in sync.
      onClose={onClose}
      // The dialog element itself only receives clicks on its backdrop.
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className={cx(
        "m-auto max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] rounded-2xl border border-line bg-surface p-0 text-ink shadow-xl backdrop:bg-black/40",
        size === "lg" ? "max-w-[760px]" : "max-w-[480px]",
        className,
      )}
    >
      {open && (
        <div className="flex flex-col gap-5 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 id={titleId} className="m-0 font-display text-xl font-semibold">
              {title}
            </h2>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="-mr-2 flex size-10 items-center justify-center rounded-[10px] text-muted hover:bg-track hover:text-ink"
            >
              <Icon d={icons.close} size={18} strokeWidth={2.2} />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
