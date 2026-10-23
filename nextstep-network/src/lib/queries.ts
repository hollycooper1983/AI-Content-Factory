import "server-only";
import { db } from "./db";
import type { Actor } from "./permissions";
import { canViewProfile, searchable } from "./permissions";
import type { SafeUser } from "./auth";
import type { Notification, Post, Profile, User } from "./types";

export const actorOf = (u: Pick<User, "id" | "role" | "ageGroup" | "verified" | "status">): Actor => ({
  id: u.id, role: u.role, ageGroup: u.ageGroup, verified: u.verified, status: u.status,
});

export async function connectionIds(userId: string): Promise<Set<string>> {
  const store = await db();
  const [a, b] = await Promise.all([
    store.all("connections", { requesterId: userId, status: "accepted" }),
    store.all("connections", { addresseeId: userId, status: "accepted" }),
  ]);
  return new Set([...a.map((c) => c.addresseeId), ...b.map((c) => c.requesterId)]);
}

export async function connectionBetween(a: string, b: string) {
  const store = await db();
  return (await store.find("connections", { requesterId: a, addresseeId: b })) ?? (await store.find("connections", { requesterId: b, addresseeId: a }));
}

export async function isBlocked(a: string, b: string): Promise<boolean> {
  const store = await db();
  return !!((await store.find("blocks", { blockerId: a, blockedId: b })) || (await store.find("blocks", { blockerId: b, blockedId: a })));
}

export async function blockedIds(userId: string): Promise<Set<string>> {
  const store = await db();
  const [a, b] = await Promise.all([store.all("blocks", { blockerId: userId }), store.all("blocks", { blockedId: userId })]);
  return new Set([...a.map((x) => x.blockedId), ...b.map((x) => x.blockerId)]);
}

export interface Member {
  user: Omit<User, "passwordHash">;
  profile: Profile | null;
}

export async function membersById(ids: Iterable<string>): Promise<Map<string, Member>> {
  const store = await db();
  const want = new Set(ids);
  const [users, profiles] = await Promise.all([store.all("users"), store.all("profiles")]);
  const pm = new Map(profiles.map((p) => [p.userId, p]));
  const out = new Map<string, Member>();
  for (const u of users) {
    if (!want.has(u.id)) continue;
    const { passwordHash: _p, ...safe } = u;
    out.set(u.id, { user: safe, profile: pm.get(u.id) ?? null });
  }
  return out;
}

/** Returns the profile only if the viewer is allowed to see it. */
export async function viewableProfile(viewer: SafeUser | null, ownerId: string) {
  const store = await db();
  const owner = await store.get("users", ownerId);
  if (!owner || owner.status !== "active") return null;
  const profile = await store.find("profiles", { userId: ownerId });
  if (!profile) return null;
  const connected = viewer ? (await connectionBetween(viewer.id, ownerId))?.status === "accepted" : false;
  const blocked = viewer ? await isBlocked(viewer.id, ownerId) : false;
  const isLinkedParent = viewer ? !!(await store.find("parent_links", { parentId: viewer.id, studentId: ownerId })) : false;
  const ok = canViewProfile(viewer ? actorOf(viewer) : null, actorOf(owner), profile, { connected, blocked, isLinkedParent });
  if (!ok) return { allowed: false as const, owner: { id: owner.id, name: owner.name, role: owner.role } };
  const { passwordHash: _p, ...safe } = owner;
  return { allowed: true as const, owner: safe, profile, connected };
}

/** Members the viewer may discover (search, suggestions). */
export async function discoverableMembers(viewer: SafeUser | null): Promise<Member[]> {
  const store = await db();
  const [users, profiles] = await Promise.all([store.all("users"), store.all("profiles")]);
  const pm = new Map(profiles.map((p) => [p.userId, p]));
  const conns = viewer ? await connectionIds(viewer.id) : new Set<string>();
  const blocked = viewer ? await blockedIds(viewer.id) : new Set<string>();
  const out: Member[] = [];
  for (const u of users) {
    const p = pm.get(u.id);
    if (!p || u.status !== "active" || u.role === "admin" || blocked.has(u.id)) continue;
    if (!searchable(viewer ? actorOf(viewer) : null, actorOf(u), p, conns.has(u.id))) continue;
    const { passwordHash: _p, ...safe } = u;
    out.push({ user: safe, profile: p });
  }
  return out;
}

export interface FeedItem {
  post: Post;
  author: Member | undefined;
  orgName?: string;
  orgVerified?: boolean;
  reactions: { type: string; userId: string }[];
  comments: { id: string; body: string; createdAt: string; author: Member | undefined }[];
  saved: boolean;
  groupName?: string;
}

export async function hydratePosts(posts: Post[], viewerId: string | null): Promise<FeedItem[]> {
  const store = await db();
  const [reactions, comments, orgs, saved, groups] = await Promise.all([
    store.all("reactions"), store.all("comments"), store.all("organizations"),
    viewerId ? store.all("saved_items", { userId: viewerId, kind: "post" }) : Promise.resolve([]),
    store.all("groups"),
  ]);
  const ids = new Set<string>();
  posts.forEach((p) => ids.add(p.authorId));
  comments.forEach((c) => ids.add(c.authorId));
  const members = await membersById(ids);
  const orgMap = new Map(orgs.map((o) => [o.id, o]));
  const gMap = new Map(groups.map((g) => [g.id, g.name]));
  const savedSet = new Set(saved.map((s) => s.refId));
  return posts.map((post) => ({
    post,
    author: members.get(post.authorId),
    orgName: post.orgId ? orgMap.get(post.orgId)?.name : undefined,
    orgVerified: post.orgId ? orgMap.get(post.orgId)?.verified : undefined,
    reactions: reactions.filter((r) => r.postId === post.id).map((r) => ({ type: r.type, userId: r.userId })),
    comments: comments
      .filter((c) => c.postId === post.id && !c.removed)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((c) => ({ id: c.id, body: c.body, createdAt: c.createdAt, author: members.get(c.authorId) })),
    saved: savedSet.has(post.id),
    groupName: post.groupId ? gMap.get(post.groupId) : undefined,
  }));
}

export async function notify(userId: string, type: Notification["type"], text: string, href: string) {
  const store = await db();
  const prefs = await store.find("notification_prefs", { userId });
  if (prefs && prefs.categories[type] === false) return;
  await store.insert("notifications", { userId, type, text, href, read: false });
}

export async function audit(actorId: string, action: string, target: string, details?: string) {
  const store = await db();
  await store.insert("audit_logs", { actorId, action, target, details });
}

export async function getSetting(key: string): Promise<string | null> {
  const store = await db();
  return (await store.find("site_settings", { key }))?.value ?? null;
}
