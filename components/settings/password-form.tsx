"use client";

import { useActionState } from "react";
import { changePassword, type PasswordState } from "@/app/(app)/settings/actions";
import { button, cx } from "../ui";
import { Field } from "./field";

// Password fields are never echoed back from the server, so React's automatic form
// reset after each submit clears them.
export function PasswordForm() {
  const [state, formAction, pending] = useActionState<PasswordState, FormData>(changePassword, {});

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      <Field
        label="Current password"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        error={state.errors?.currentPassword}
      />
      <Field
        label="New password"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        error={state.errors?.newPassword}
      />
      <Field
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        error={state.errors?.confirmPassword}
      />

      <div className="mt-1 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={cx(button.primary, "disabled:opacity-70")}>
          {pending ? "Updating…" : "Update password"}
        </button>
        <p aria-live="polite" className={cx("m-0 text-[13px] font-medium text-primary-text", !state.message && "sr-only")}>
          {state.message}
        </p>
      </div>
    </form>
  );
}
