"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canJoinGroup, canMessage, canModerate, canPostAsOrganization, canRequestConnection } from "@/lib/permissions";
import { actorOf, connectionBetween, isBlocked, notify } from "@/lib/queries";
import { rateLimit } from "@/lib/rate-limit";
import type { FormState } from "./auth";
import type { PostCategory, ReactionType, SavedKind } from "@/lib/types";

const CATEGORIES: PostCategory[] = ["general", "scholarship", "college", "internship", "success", "advice", "event", "question"];

const safeLink = (v: string) => {
  if (!v) return null;
  if (v.startsWith("/")) return v;
  try {
    const u = new URL(v);
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
};

const PostSchema = z.object({
  body: z.string().trim().min(1, "Write something first").max(3000, "Posts are limited to 3,000 characters"),
  category: z.enum(CATEGORIES as [PostCategory, ...PostCategory[]]).default("general"),
  link: z.string().trim().max(500).optional().default(""),
  imageUrl: z.string().trim().max(500).optional().default(""),
  groupId: z.string().optional().default(""),
  asOrg: z.string().optional().default(""),
});

export async function createPost(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser();
  if (!rateLimit(`post:${me.id}`, 10, 60 * 60 * 1000).ok) return { error: "You're posting quickly. Take a short break and try again." };
  const parsed = PostSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { body, category, link, imageUrl, groupId, asOrg } = parsed.data;
  const store = await db();
  const cleanLink = safeLink(link);
  if (link && !cleanLink) return { error: "Links must start with https://" };
  const cleanImg = safeLink(imageUrl);
  if (imageUrl && !cleanImg) return { error: "Image links must start with https://" };

  if (groupId) {
    const m = await store.find("group_members", { groupId, userId: me.id, status: "member" });
    if (!m) return { error: "Join this group to post in it." };
  }
  let orgId: string | null = null;
  if (asOrg) {
    const org = await store.get("organizations", asOrg);
    if (!org || !canPostAsOrganization(actorOf(me), org.ownerId)) return { error: "You can't post for that organization." };
    orgId = org.id;
  }
  await store.insert("posts", { authorId: me.id, body, category, link: cleanLink, imageUrl: cleanImg, groupId: groupId || null, orgId, repostOfId: null, removed: false });
  revalidatePath("/feed");
  if (groupId) revalidatePath(`/groups/${groupId}`);
  return { ok: "Posted." };
}

export async function deletePost(postId: string) {
  const me = await requireUser();
  const store = await db();
  const p = await store.get("posts", postId);
  if (!p) return;
  if (p.authorId !== me.id && me.role !== "admin") return;
  await store.update("posts", postId, { removed: true });
  revalidatePath("/feed");
}

export async function toggleReaction(postId: string, type: ReactionType) {
  const me = await requireUser();
  const store = await db();
  const post = await store.get("posts", postId);
  if (!post || post.removed) return;
  const existing = await store.find("reactions", { postId, userId: me.id });
  if (existing && existing.type === type) await store.remove("reactions", { id: existing.id });
  else if (existing) await store.update("reactions", existing.id, { type });
  else {
    await store.insert("reactions", { postId, userId: me.id, type });
    if (post.authorId !== me.id) await notify(post.authorId, "reaction", `${me.name} reacted to your post.`, "/feed");
  }
  revalidatePath("/feed");
}

export async function addComment(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser();
  if (!rateLimit(`comment:${me.id}`, 30, 60 * 60 * 1000).ok) return { error: "Too many comments. Try again later." };
  const postId = String(form.get("postId") ?? "");
  const body = String(form.get("body") ?? "").trim();
  if (!body) return { error: "Write a comment first." };
  if (body.length > 1000) return { error: "Comments are limited to 1,000 characters." };
  const store = await db();
  const post = await store.get("posts", postId);
  if (!post || post.removed) return { error: "This post is no longer available." };
  if (await isBlocked(me.id, post.authorId)) return { error: "You can't comment on this post." };
  await store.insert("comments", { postId, authorId: me.id, body, removed: false });
  if (post.authorId !== me.id) await notify(post.authorId, "comment", `${me.name} commented on your post.`, "/feed");
  revalidatePath("/feed");
  return { ok: "Comment added." };
}

export async function repost(postId: string) {
  const me = await requireUser();
  const store = await db();
  const p = await store.get("posts", postId);
  if (!p || p.removed) return;
  if (await store.find("posts", { authorId: me.id, repostOfId: postId, removed: false })) return;
  await store.insert("posts", { authorId: me.id, body: p.body, category: p.category, link: p.link, imageUrl: p.imageUrl, repostOfId: postId, groupId: null, orgId: null, removed: false });
  revalidatePath("/feed");
}

export async function toggleSave(kind: SavedKind, refId: string, path = "/feed") {
  const me = await requireUser();
  const store = await db();
  const existing = await store.find("saved_items", { userId: me.id, kind, refId });
  if (existing) await store.remove("saved_items", { id: existing.id });
  else await store.insert("saved_items", { userId: me.id, kind, refId });
  revalidatePath(path);
}

export async function report(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser();
  if (!rateLimit(`report:${me.id}`, 20, 60 * 60 * 1000).ok) return { error: "Too many reports. Try again later." };
  const targetType = z.enum(["post", "comment", "user", "group", "job", "message"]).safeParse(form.get("targetType"));
  const targetId = String(form.get("targetId") ?? "");
  const reason = String(form.get("reason") ?? "").trim().slice(0, 500);
  if (!targetType.success || !targetId || !reason) return { error: "Choose a reason for your report." };
  const store = await db();
  await store.insert("reports", { reporterId: me.id, targetType: targetType.data, targetId, reason, status: "open" });
  return { ok: "Thanks. Our moderators will review this report." };
}

// ---------- Connections ----------

export async function requestConnection(toId: string): Promise<{ ok: boolean; message: string }> {
  const me = await requireUser();
  if (!rateLimit(`connect:${me.id}`, 30, 24 * 60 * 60 * 1000).ok) return { ok: false, message: "Daily connection request limit reached." };
  const store = await db();
  const to = await store.get("users", toId);
  if (!to || to.status !== "active") return { ok: false, message: "Member not found." };
  const check = canRequestConnection(actorOf(me), actorOf(to), { blocked: await isBlocked(me.id, toId) });
  if (!check.ok) return { ok: false, message: check.reason! };
  const existing = await connectionBetween(me.id, toId);
  if (existing && existing.status !== "declined") return { ok: false, message: existing.status === "accepted" ? "You're already connected." : "A request is already pending." };
  if (existing) await store.remove("connections", { id: existing.id });
  await store.insert("connections", { requesterId: me.id, addresseeId: toId, status: "pending" });
  await notify(toId, "connection", `${me.name} sent you a connection request.`, "/network/invitations");
  revalidatePath("/network");
  return { ok: true, message: "Request sent." };
}

export async function respondConnection(connectionId: string, accept: boolean) {
  const me = await requireUser();
  const store = await db();
  const c = await store.get("connections", connectionId);
  if (!c || c.addresseeId !== me.id || c.status !== "pending") return;
  await store.update("connections", connectionId, { status: accept ? "accepted" : "declined" });
  if (accept) await notify(c.requesterId, "connection", `${me.name} accepted your connection request.`, `/profile/${me.id}`);
  revalidatePath("/network");
  revalidatePath("/network/invitations");
}

export async function removeConnection(otherId: string) {
  const me = await requireUser();
  const store = await db();
  const c = await connectionBetween(me.id, otherId);
  if (c) await store.remove("connections", { id: c.id });
  revalidatePath("/network");
}

export async function blockUser(otherId: string) {
  const me = await requireUser();
  if (otherId === me.id) return;
  const store = await db();
  if (!(await store.find("blocks", { blockerId: me.id, blockedId: otherId }))) await store.insert("blocks", { blockerId: me.id, blockedId: otherId });
  const c = await connectionBetween(me.id, otherId);
  if (c) await store.remove("connections", { id: c.id });
  revalidatePath("/network");
  revalidatePath("/messages");
}

export async function unblockUser(otherId: string) {
  const me = await requireUser();
  const store = await db();
  await store.remove("blocks", { blockerId: me.id, blockedId: otherId });
  revalidatePath("/settings");
}

export async function toggleFollow(orgId: string) {
  const me = await requireUser();
  const store = await db();
  const f = await store.find("follows", { userId: me.id, orgId });
  if (f) await store.remove("follows", { id: f.id });
  else await store.insert("follows", { userId: me.id, orgId });
  revalidatePath(`/organizations/${orgId}`);
  revalidatePath("/network");
  revalidatePath("/colleges");
}

// ---------- Groups ----------

export async function joinGroup(groupId: string): Promise<{ ok: boolean; message: string }> {
  const me = await requireUser();
  const store = await db();
  const g = await store.get("groups", groupId);
  if (!g) return { ok: false, message: "Group not found." };
  const check = canJoinGroup(actorOf(me), g);
  if (!check.ok) return { ok: false, message: check.reason! };
  if (await store.find("group_members", { groupId, userId: me.id })) return { ok: false, message: "You've already joined or requested." };
  const status = g.visibility === "private" ? "pending" : "member";
  await store.insert("group_members", { groupId, userId: me.id, status, role: "member" });
  if (status === "pending") await notify(g.adminId, "group", `${me.name} asked to join ${g.name}.`, `/groups/${groupId}`);
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/groups");
  return { ok: true, message: status === "pending" ? "Request sent to the group admin." : "You joined the group." };
}

export async function leaveGroup(groupId: string) {
  const me = await requireUser();
  const store = await db();
  await store.remove("group_members", { groupId, userId: me.id, role: "member" });
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/groups");
}

export async function approveMember(memberId: string, approve: boolean) {
  const me = await requireUser();
  const store = await db();
  const m = await store.get("group_members", memberId);
  if (!m) return;
  const mine = await store.find("group_members", { groupId: m.groupId, userId: me.id });
  if (!canModerate(actorOf(me), { groupRole: mine?.role })) return;
  if (approve) {
    await store.update("group_members", memberId, { status: "member" });
    const g = await store.get("groups", m.groupId);
    await notify(m.userId, "group", `You're now a member of ${g?.name}.`, `/groups/${m.groupId}`);
  } else await store.remove("group_members", { id: memberId });
  revalidatePath(`/groups/${m.groupId}`);
}

// ---------- Messaging ----------

export async function startConversation(otherId: string) {
  const me = await requireUser();
  const store = await db();
  const other = await store.get("users", otherId);
  if (!other) redirect("/messages");
  const connected = (await connectionBetween(me.id, otherId))?.status === "accepted";
  const check = canMessage(actorOf(me), actorOf(other), { connected, blocked: await isBlocked(me.id, otherId) });
  if (!check.ok) redirect(`/messages?notice=${encodeURIComponent(check.reason!)}`);
  const convs = await store.all("conversations");
  let conv = convs.find((c) => c.participantIds.length === 2 && c.participantIds.includes(me.id) && c.participantIds.includes(otherId));
  if (!conv) conv = await store.insert("conversations", { participantIds: [me.id, otherId], updatedAt: new Date().toISOString() });
  redirect(`/messages?c=${conv.id}`);
}

export async function sendMessage(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser();
  if (!rateLimit(`msg:${me.id}`, 60, 60 * 60 * 1000).ok) return { error: "You're sending messages too quickly." };
  const conversationId = String(form.get("conversationId") ?? "");
  const body = String(form.get("body") ?? "").trim();
  if (!body) return { error: "Write a message." };
  if (body.length > 2000) return { error: "Messages are limited to 2,000 characters." };
  const store = await db();
  const conv = await store.get("conversations", conversationId);
  if (!conv || !conv.participantIds.includes(me.id)) return { error: "Conversation not found." };
  for (const pid of conv.participantIds.filter((p) => p !== me.id)) {
    const other = await store.get("users", pid);
    if (!other) return { error: "Conversation not available." };
    const connected = (await connectionBetween(me.id, pid))?.status === "accepted";
    const check = canMessage(actorOf(me), actorOf(other), { connected, blocked: await isBlocked(me.id, pid) });
    if (!check.ok) return { error: check.reason };
  }
  await store.insert("messages", { conversationId, senderId: me.id, body, readBy: [me.id] });
  await store.update("conversations", conversationId, { updatedAt: new Date().toISOString() });
  for (const pid of conv.participantIds.filter((p) => p !== me.id)) await notify(pid, "message", `New message from ${me.name}.`, `/messages?c=${conversationId}`);
  revalidatePath("/messages");
  return { ok: "Sent" };
}

// ---------- Notifications ----------

export async function markAllNotificationsRead() {
  const me = await requireUser();
  const store = await db();
  for (const n of await store.all("notifications", { userId: me.id, read: false })) await store.update("notifications", n.id, { read: true });
  revalidatePath("/notifications");
}

export async function saveNotificationPrefs(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser();
  const store = await db();
  const cats = ["connection", "group", "deadline", "post", "comment", "reaction", "system", "job", "message"];
  const categories = Object.fromEntries(cats.map((c) => [c, form.get(`cat_${c}`) === "on"]));
  const frequency = z.enum(["realtime", "daily", "weekly"]).catch("realtime").parse(form.get("frequency"));
  const email = form.get("email") === "on";
  const existing = await store.find("notification_prefs", { userId: me.id });
  if (existing) await store.update("notification_prefs", existing.id, { categories, frequency, email });
  else await store.insert("notification_prefs", { userId: me.id, categories, frequency, email });
  revalidatePath("/settings");
  return { ok: "Notification preferences saved." };
}
