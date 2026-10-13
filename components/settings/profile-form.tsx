"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "@/app/(app)/settings/actions";
import { button, cx } from "../ui";
import { Field } from "@/components/field";

export function ProfileForm({ initial }: { initial: { name: string; email: string } }) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(updateProfile, { values: initial });
  const values = state.values ?? initial;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      <Field
        label="Name"
        name="name"
        type="text"
        autoComplete="name"
        placeholder="Your name"
        defaultValue={values.name}
        error={state.errors?.name}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={values.email}
        error={state.errors?.email}
      />

      <div className="mt-1 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={cx(button.primary, "disabled:opacity-70")}>
          {pending ? "Saving…" : "Save changes"}
        </button>
        <p aria-live="polite" className={cx("m-0 text-[13px] font-medium text-primary-text", !state.message && "sr-only")}>
          {state.message}
        </p>
      </div>
    </form>
  );
}
