import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

// Renders nothing; redirects to /login when the session cookie is missing, expired or
// unknown. Place it inside a <Suspense> boundary, since it reads the request cookies.
export async function AuthGuard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return null;
}
