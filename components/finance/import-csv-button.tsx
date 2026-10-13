"use client";

import { useActionState, useRef } from "react";
import { importTransactionsCsv, type ImportState } from "@/app/(app)/finance/actions";
import { button, cx } from "@/components/ui";

export function ImportCsvButton() {
  const [state, formAction, pending] = useActionState<ImportState, FormData>(importTransactionsCsv, {});
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form ref={formRef} action={formAction} className="relative">
      {/* The file input is hidden; picking a file submits the form straight away. */}
      <input
        ref={inputRef}
        type="file"
        name="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => e.currentTarget.files?.length && formRef.current?.requestSubmit()}
      />
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          // Clear the previous pick so choosing the same file again still triggers onChange.
          if (!inputRef.current) return;
          inputRef.current.value = "";
          inputRef.current.click();
        }}
        className={cx(button.secondary, "disabled:opacity-70")}
      >
        {pending ? "Importing…" : "Import CSV"}
      </button>
      <p
        aria-live="polite"
        className={cx(
          "absolute top-full right-0 z-10 m-0 mt-2 w-max max-w-[320px] rounded-[10px] border border-line bg-surface px-3 py-2 text-[13px] font-medium shadow-sm",
          state.error ? "text-accent-text" : "text-primary-text",
          !(state.error || state.message) && "sr-only",
        )}
      >
        {state.error ?? state.message}
      </p>
    </form>
  );
}
