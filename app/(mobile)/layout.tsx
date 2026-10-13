import { Suspense, type ReactNode } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function MobileLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense>
        <AuthGuard />
      </Suspense>
      {children}
    </>
  );
}
