import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";

// Optimistic check: only looks for the cookie, so it stays fast. <AuthGuard> in the
// layouts verifies the session against the database and handles expired ones.
export function proxy(request: NextRequest) {
  if (!request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  // Everything except the login page, Next.js internals and files in public/.
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico|.*\\.\\w+$).*)"],
};
