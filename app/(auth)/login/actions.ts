"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DUMMY_HASH, verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { isValidEmail } from "@/lib/validation";

export type LoginState = {
  email?: string;
  errors?: { email?: string; password?: string };
  message?: string;
};

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const errors: LoginState["errors"] = {};
  if (!isValidEmail(email)) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Enter your password.";
  if (errors.email || errors.password) return { email, errors };

  // Matches the case-insensitive unique index on users.email.
  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(sql`lower(${users.email})`, email.toLowerCase()))
    .limit(1);

  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) return { email, message: "Incorrect email or password." };

  await createSession(user.id);
  // Drop pages cached in the browser for whoever was logged in before.
  revalidatePath("/", "layout");
  redirect("/");
}
