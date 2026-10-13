import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { Icon } from "@/components/ui";
import { icons } from "@/lib/data";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-12">
      <div className="flex w-full max-w-[400px] flex-col gap-6">
        <div className="flex items-center justify-center gap-2.5">
          <div aria-hidden="true" className="flex size-[34px] items-center justify-center rounded-[9px] bg-primary text-white">
            <Icon d={icons.goals} />
          </div>
          <div className="font-display text-lg font-semibold tracking-[-0.01em]">Life Planner</div>
        </div>

        <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <h1 className="m-0 font-display text-[26px] leading-tight font-semibold tracking-[-0.02em]">Welcome back</h1>
          <p className="mt-1.5 mb-6 text-muted">Log in to pick up where you left off.</p>
          <LoginForm />
        </section>
      </div>
    </main>
  );
}
