import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { syncRecurringPayments } from "@/lib/finance/recurring";

// Re-runs recurring payment detection for the logged-in user. Imports already do this; this is
// for existing data (e.g. after the detection rules change). POST so a link or prefetch can't trigger it.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not logged in." }, { status: 401 });

  const result = await syncRecurringPayments(user.id);
  revalidatePath("/finance");
  return Response.json(result);
}
