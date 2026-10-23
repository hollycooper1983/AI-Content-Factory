import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { newToken, sha256 } from "./crypto";
import type { Profile, Role, User } from "./types";

export const SESSION_COOKIE = "ns_session";
const SESSION_DAYS = 14;

export type SafeUser = Omit<User, "passwordHash">;

export function toSafe(u: User): SafeUser {
  const { passwordHash: _p, ...rest } = u;
  return rest;
}

export async function createSession(userId: string) {
  const store = await db();
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);
  await store.insert("sessions", { userId, tokenHash: sha256(token), expiresAt: expiresAt.toISOString() });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    const store = await db();
    await store.remove("sessions", { tokenHash: sha256(token) });
  }
  cookies().delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const store = await db();
  const session = await store.find("sessions", { tokenHash: sha256(token) });
  if (!session || new Date(session.expiresAt) < new Date()) return null;
  const user = await store.get("users", session.userId);
  if (!user || user.status !== "active") return null;
  return toSafe(user);
}

export async function requireUser(): Promise<SafeUser> {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  return u;
}

export async function requireRole(...roles: Role[]): Promise<SafeUser> {
  const u = await requireUser();
  if (!roles.includes(u.role)) redirect("/feed?denied=1");
  return u;
}

export async function getViewer(): Promise<{ user: SafeUser; profile: Profile | null } | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const store = await db();
  const profile = await store.find("profiles", { userId: user.id });
  return { user, profile };
}
