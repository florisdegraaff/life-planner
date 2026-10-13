import { Suspense, type ReactNode } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Sidebar } from "@/components/sidebar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas md:flex-row">
      <Suspense>
        <AuthGuard />
      </Suspense>
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 pt-8 pb-14 sm:px-10">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-6">{children}</div>
      </main>
    </div>
  );
}
