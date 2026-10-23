// Role-based access control and youth-safety rules.
// Pure functions so they can be unit tested and reused by every server action.

import type { AgeGroup, Group, Profile, Role, Visibility } from "./types";

export interface Actor {
  id: string;
  role: Role;
  ageGroup: AgeGroup;
  verified: boolean;
  status?: "active" | "suspended";
}

const ORG_ROLES: Role[] = ["college", "employer"];
const TRUSTED_ADULT_ROLES: Role[] = ["mentor", "counselor"];

export const isAdmin = (a: Actor) => a.role === "admin";
export const isMinor = (a: Actor) => a.ageGroup === "minor";

/** Verified mentors, counselors and organization accounts. */
export function isVerifiedProfessional(a: Actor): boolean {
  return a.verified && [...TRUSTED_ADULT_ROLES, ...ORG_ROLES].includes(a.role);
}

/** Minors can never have a public profile. Their maximum visibility is "network". */
export function effectiveVisibility(owner: Actor, requested: Visibility): Visibility {
  if (isMinor(owner) && requested === "public") return "network";
  return requested;
}

/** Default visibility for a new account: private for minors, network for adults. */
export function defaultVisibility(ageGroup: AgeGroup): Visibility {
  return ageGroup === "minor" ? "private" : "network";
}

export function canViewProfile(
  viewer: Actor | null,
  owner: Actor,
  profile: Pick<Profile, "visibility">,
  ctx: { connected: boolean; blocked: boolean; isLinkedParent?: boolean },
): boolean {
  if (viewer && viewer.id === owner.id) return true;
  if (viewer && isAdmin(viewer)) return true;
  if (ctx.blocked) return false;
  if (viewer && ctx.isLinkedParent) return true;
  const vis = effectiveVisibility(owner, profile.visibility);
  if (!viewer) return vis === "public";
  if (vis === "private") return false;
  if (vis === "network") return ctx.connected;
  return true;
}

/**
 * Connection requests.
 * - Minors may connect with other minors, and may request connections with verified
 *   mentors and counselors (never with unverified adults or employer accounts;
 *   they follow organization pages instead).
 * - Adults (except verified professionals responding to a minor's request) cannot
 *   initiate connections with minors.
 */
export function canRequestConnection(from: Actor, to: Actor, ctx: { blocked: boolean }): { ok: boolean; reason?: string } {
  if (from.id === to.id) return { ok: false, reason: "You can't connect with yourself." };
  if (ctx.blocked) return { ok: false, reason: "This member is unavailable." };
  if (from.status === "suspended") return { ok: false, reason: "Your account is suspended." };
  if (isAdmin(to) || isAdmin(from)) return { ok: false, reason: "Administrator accounts don't use connections." };
  if (isMinor(to) && !isMinor(from)) {
    return { ok: false, reason: "For student safety, adults can't send connection requests to students under 18." };
  }
  if (isMinor(from) && !isMinor(to) && !(to.verified && TRUSTED_ADULT_ROLES.includes(to.role)) && to.role !== "student") {
    return { ok: false, reason: "Students under 18 can connect with verified mentors and counselors. Follow organization pages instead." };
  }
  if (isMinor(from) && !isMinor(to) && to.role === "student") {
    return { ok: false, reason: "Students under 18 can connect with other students under 18 and verified professionals." };
  }
  return { ok: true };
}

/**
 * Direct messaging. Release 1 policy: messaging is disabled for anyone under 18 until
 * supervised youth messaging (guardian visibility, moderation queue) is built.
 * Adults may message accepted connections only.
 */
export const MINOR_MESSAGING_ENABLED = false;

export function canMessage(from: Actor, to: Actor, ctx: { connected: boolean; blocked: boolean }): { ok: boolean; reason?: string } {
  if (from.id === to.id) return { ok: false, reason: "You can't message yourself." };
  if (ctx.blocked) return { ok: false, reason: "Messaging is unavailable with this member." };
  if ((isMinor(from) || isMinor(to)) && !MINOR_MESSAGING_ENABLED) {
    return { ok: false, reason: "Direct messaging is turned off for members under 18 while youth safety protections are completed." };
  }
  if (!ctx.connected) return { ok: false, reason: "You can message members you're connected with." };
  return { ok: true };
}

export function canJoinGroup(a: Actor, g: Pick<Group, "adultsOnly">): { ok: boolean; reason?: string } {
  if (g.adultsOnly && isMinor(a)) return { ok: false, reason: "This group is for members 18 and older." };
  return { ok: true };
}

export function canPostOpportunity(a: Actor): boolean {
  return isAdmin(a) || (a.role === "employer" && a.verified) || (a.role === "college" && a.verified);
}

export function canPostAsOrganization(a: Actor, orgOwnerId: string | null | undefined): boolean {
  return isAdmin(a) || (a.verified && orgOwnerId === a.id);
}

export function canModerate(a: Actor, ctx?: { groupRole?: "admin" | "moderator" | "member" }): boolean {
  return isAdmin(a) || ctx?.groupRole === "admin" || ctx?.groupRole === "moderator";
}

/** Whether a member may appear in search results for this viewer. */
export function searchable(viewer: Actor | null, member: Actor, profile: Pick<Profile, "visibility">, connected: boolean): boolean {
  if (viewer && viewer.id === member.id) return true;
  if (viewer && isAdmin(viewer)) return true;
  if (isMinor(member)) {
    // Minors are hidden from guests and adults; other minors find them only if not private.
    if (!viewer || !isMinor(viewer)) return connected && !!viewer;
    return profile.visibility !== "private" || connected;
  }
  if (!viewer) return profile.visibility === "public";
  return profile.visibility !== "private" || connected;
}

/** Roles that can self-register. Admin accounts are created only by existing admins. */
export const SELF_SIGNUP_ROLES: Role[] = ["student", "parent", "college", "employer", "mentor", "counselor"];

/** Roles that require admin verification before receiving elevated privileges. */
export function requiresVerification(role: Role): boolean {
  return ["college", "employer", "mentor", "counselor"].includes(role);
}
