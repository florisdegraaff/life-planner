"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { deleteOtherSessions, deleteSession, getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { isValidEmail } from "@/lib/validation";

export type ProfileState = {
  values?: { name: string; email: string };
  errors?: { name?: string; email?: string };
  message?: string;
  saved?: boolean;
};

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const values = {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
  };

  const errors: ProfileState["errors"] = {};
  if (values.name.length > 100) errors.name = "Keep your name under 100 characters.";
  if (!isValidEmail(values.email)) errors.email = "Enter a valid email address.";
  if (errors.name || errors.email) return { values, errors };

  const [taken] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(sql`lower(${users.email})`, values.email.toLowerCase()), ne(users.id, user.id)))
    .limit(1);
  if (taken) return { values, errors: { email: "Another account already uses this email." } };

  await db
    .update(users)
    .set({ name: values.name || null, email: values.email })
    .where(eq(users.id, user.id));
  revalidatePath("/settings");

  return { values, saved: true, message: "Profile saved." };
}

export type PasswordState = {
  errors?: { currentPassword?: string; newPassword?: string; confirmPassword?: string };
  message?: string;
};

const MIN_PASSWORD_LENGTH = 8;

export async function changePassword(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const errors: PasswordState["errors"] = {};
  if (!currentPassword) errors.currentPassword = "Enter your current password.";
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    errors.newPassword = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  } else if (newPassword === currentPassword) {
    errors.newPassword = "Choose a password different from your current one.";
  }
  if (confirmPassword !== newPassword) errors.confirmPassword = "Passwords don't match.";
  if (errors.currentPassword || errors.newPassword || errors.confirmPassword) return { errors };

  const [row] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, user.id));
  if (!row || !(await verifyPassword(currentPassword, row.passwordHash))) {
    return { errors: { currentPassword: "That's not your current password." } };
  }

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(newPassword) })
    .where(eq(users.id, user.id));
  await deleteOtherSessions(user.id);

  return { message: "Password updated. Other devices have been logged out." };
}

export async function logout() {
  await deleteSession();
  // Drop pages cached in the browser so the next user never sees this one's data.
  revalidatePath("/", "layout");
  redirect("/login");
}
