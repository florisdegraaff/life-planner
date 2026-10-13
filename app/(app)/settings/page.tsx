import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PasswordForm } from "@/components/settings/password-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { button, Card, CardTitle, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/session";
import { logout } from "./actions";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader eyebrow="Account" title="Settings" />
      <Card className="max-w-[640px]">
        <CardTitle>Profile</CardTitle>
        <p className="mt-1 mb-6 text-muted">How you appear in Life Planner and the email you log in with.</p>
        <Suspense fallback={<div className="h-[232px] animate-pulse rounded-[10px] bg-track" />}>
          <Profile />
        </Suspense>
      </Card>
      <Card className="max-w-[640px]">
        <CardTitle>Password</CardTitle>
        <p className="mt-1 mb-6 text-muted">Changing it logs you out on all your other devices.</p>
        <PasswordForm />
      </Card>
      <Card className="flex max-w-[640px] flex-wrap items-center justify-between gap-4">
        <div>
          <CardTitle>Log out</CardTitle>
          <p className="mt-1 mb-0 text-muted">End your session on this device.</p>
        </div>
        <form action={logout}>
          <button type="submit" className={button.secondary}>
            Log out
          </button>
        </form>
      </Card>
    </>
  );
}

// Reads the session cookie, so it streams in behind the Suspense boundary.
async function Profile() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <ProfileForm initial={{ name: user.name ?? "", email: user.email }} />;
}
