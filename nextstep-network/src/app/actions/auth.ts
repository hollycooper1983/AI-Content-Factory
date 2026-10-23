"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession, getCurrentUser } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { db } from "@/lib/db";
import { defaultVisibility, requiresVerification, SELF_SIGNUP_ROLES } from "@/lib/permissions";
import { rateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/queries";
import type { Role } from "@/lib/types";

export type FormState = { error?: string; ok?: string; fieldErrors?: Record<string, string> } | undefined;

const ip = () => headers().get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

const SignupSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(120),
  password: z.string().min(10, "Use at least 10 characters").max(200),
  role: z.enum(SELF_SIGNUP_ROLES as [Role, ...Role[]]),
  age: z.enum(["under13", "13to17", "18plus"], { errorMap: () => ({ message: "Select your age range" }) }),
  terms: z.literal("on", { errorMap: () => ({ message: "You must agree to the community guidelines" }) }),
});

export async function signup(_: FormState, form: FormData): Promise<FormState> {
  if (!rateLimit(`signup:${ip()}`, 5, 60 * 60 * 1000).ok) return { error: "Too many sign-up attempts. Try again later." };
  const parsed = SignupSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const i of parsed.error.issues) fe[String(i.path[0])] ??= i.message;
    return { error: "Please fix the highlighted fields.", fieldErrors: fe };
  }
  const { name, email, password, role, age } = parsed.data;
  if (age === "under13") {
    return { error: "NextStep Network is for students 13 and older. Ask a parent, guardian or school counselor about resources for younger students." };
  }
  const ageGroup = age === "18plus" ? "adult" : "minor";
  if (ageGroup === "minor" && role !== "student") return { error: "Accounts for people under 18 must be student accounts." };

  const store = await db();
  if (await store.find("users", { email })) return { error: "An account with that email already exists. Try signing in." };

  const user = await store.insert("users", {
    email, name, role, ageGroup, passwordHash: hashPassword(password), status: "active", verified: false,
  });
  await store.insert("profiles", {
    userId: user.id, headline: "", about: "", school: "", schoolLevel: role === "student" ? "high_school" : "other", gradYear: null,
    state: "", city: "", careerInterests: [], skills: [], education: [], experience: [], projects: [], volunteer: [], activities: [],
    awards: [], certifications: [], links: [], avatarUrl: "", bannerUrl: "", visibility: defaultVisibility(ageGroup),
    learningFormat: "", residencyStatus: "not_started", parentLinkCode: null,
  });
  if (requiresVerification(role)) {
    await store.insert("notifications", { userId: user.id, type: "system", text: "Your account is awaiting verification by our team. Some features stay locked until then.", href: "/settings", read: false });
  }
  await audit(user.id, "user.signup", user.id, role);
  await createSession(user.id);
  redirect(role === "student" ? "/profile/edit?welcome=1" : "/dashboard");
}

const LoginSchema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1).max(200) });

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const parsed = LoginSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Enter your email and password." };
  const { email, password } = parsed.data;
  if (!rateLimit(`login:${ip()}:${email}`, 8, 15 * 60 * 1000).ok) return { error: "Too many attempts. Wait a few minutes and try again." };
  const store = await db();
  const user = await store.find("users", { email });
  if (!user || !verifyPassword(password, user.passwordHash)) return { error: "Email or password is incorrect." };
  if (user.status !== "active") return { error: "This account is suspended. Contact support through the Help Center." };
  await createSession(user.id);
  const next = String(form.get("next") ?? "");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : user.role === "admin" ? "/admin" : "/feed");
}

export async function logout() {
  await destroySession();
  redirect("/");
}

export async function changePassword(_: FormState, form: FormData): Promise<FormState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  if (next.length < 10) return { error: "New password must be at least 10 characters." };
  const store = await db();
  const u = await store.get("users", me.id);
  if (!u || !verifyPassword(current, u.passwordHash)) return { error: "Current password is incorrect." };
  await store.update("users", me.id, { passwordHash: hashPassword(next) });
  await store.remove("sessions", { userId: me.id });
  await createSession(me.id);
  await audit(me.id, "user.password_change", me.id);
  return { ok: "Password updated. Other devices were signed out." };
}

export async function deleteAccount(_: FormState, form: FormData): Promise<FormState> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (String(form.get("confirm")) !== "DELETE") return { error: 'Type DELETE to confirm.' };
  if (me.role === "admin") return { error: "Administrator accounts must be removed by another administrator." };
  const store = await db();
  const owned = ["profiles", "sessions", "saved_items", "college_applications", "fafsa_progress", "aid_offers", "scholarship_applications", "job_applications", "tasks", "essays", "courses", "user_docs", "ai_usage", "notifications", "notification_prefs", "group_members", "follows", "reactions"] as const;
  for (const t of owned) await store.remove(t, { userId: me.id } as never);
  await store.remove("posts", { authorId: me.id });
  await store.remove("comments", { authorId: me.id });
  await store.remove("connections", { requesterId: me.id });
  await store.remove("connections", { addresseeId: me.id });
  await store.remove("parent_links", { parentId: me.id });
  await store.remove("parent_links", { studentId: me.id });
  await store.remove("users", { id: me.id });
  await audit(me.id, "user.delete", me.id);
  await destroySession();
  redirect("/?deleted=1");
}
