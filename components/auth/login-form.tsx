"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/(auth)/login/actions";
import { button, cx } from "../ui";

const input =
  "h-11 w-full rounded-[10px] border bg-surface px-3.5 text-sm text-ink outline-none placeholder:text-faint focus:border-primary focus:ring-2 focus:ring-primary-soft";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-[13px] font-medium text-ink-2">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={state.email}
          aria-invalid={!!state.errors?.email}
          aria-describedby={state.errors?.email ? "email-error" : undefined}
          className={cx(input, state.errors?.email ? "border-accent" : "border-line-strong")}
        />
        {state.errors?.email && (
          <p id="email-error" className="m-0 text-[13px] text-accent-text">
            {state.errors.email}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-[13px] font-medium text-ink-2">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!state.errors?.password}
          aria-describedby={state.errors?.password ? "password-error" : undefined}
          className={cx(input, state.errors?.password ? "border-accent" : "border-line-strong")}
        />
        {state.errors?.password && (
          <p id="password-error" className="m-0 text-[13px] text-accent-text">
            {state.errors.password}
          </p>
        )}
      </div>

      <p aria-live="polite" className={cx("m-0 text-[13px] text-accent-text", !state.message && "sr-only")}>
        {state.message}
      </p>

      <button type="submit" disabled={pending} className={cx(button.primary, "mt-1 w-full disabled:opacity-70")}>
        {pending ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
