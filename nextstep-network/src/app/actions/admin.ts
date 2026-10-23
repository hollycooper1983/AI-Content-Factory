"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canPostOpportunity } from "@/lib/permissions";
import { actorOf, audit, notify } from "@/lib/queries";
import type { PublishStatus } from "@/lib/types";
import type { FormState } from "./auth";

const PUBLISH: PublishStatus[] = ["draft", "pending_review", "approved", "published", "archived"];

export async function setUserStatus(userId: string, status: "active" | "suspended") {
  const admin = await requireRole("admin");
  if (userId === admin.id) return;
  const store = await db();
  await store.update("users", userId, { status });
  if (status === "suspended") await store.remove("sessions", { userId });
  await audit(admin.id, `user.${status}`, userId);
  revalidatePath("/admin/users");
}

export async function setUserVerified(userId: string, verified: boolean) {
  const admin = await requireRole("admin");
  const store = await db();
  const u = await store.update("users", userId, { verified });
  if (u?.orgId) await store.update("organizations", u.orgId, { verified });
  await notify(userId, "system", verified ? "Your account has been verified." : "Your account verification was removed.", "/settings");
  await audit(admin.id, verified ? "user.verify" : "user.unverify", userId);
  revalidatePath("/admin/users");
}

export async function setOrgVerified(orgId: string, verified: boolean) {
  const admin = await requireRole("admin");
  const store = await db();
  const org = await store.update("organizations", orgId, { verified });
  if (org?.ownerId) {
    await store.update("users", org.ownerId, { verified });
    await notify(org.ownerId, "system", verified ? `${org.name} is now verified.` : `${org.name} verification was removed.`, `/organizations/${orgId}`);
  }
  await audit(admin.id, verified ? "org.verify" : "org.unverify", orgId);
  revalidatePath("/admin/organizations");
}

export async function updateCollege(_: FormState, form: FormData): Promise<FormState> {
  const admin = await requireRole("admin");
  const store = await db();
  const id = String(form.get("id") ?? "");
  const c = await store.get("colleges", id);
  if (!c) return { error: "College not found." };
  const num = (k: string) => (String(form.get(k) ?? "") === "" ? null : Math.max(0, Number(form.get(k)) || 0));
  const vstatus = z.enum(["verified", "unverified", "demo"]).catch("unverified").parse(form.get("vstatus"));
  const sourceUrl = String(form.get("sourceUrl") ?? "").trim();
  if (vstatus === "verified" && !/^https:\/\//.test(sourceUrl)) return { error: "A verified record needs an https:// source URL." };
  await store.update("colleges", id, {
    tuitionInState: num("tuitionInState"), tuitionOutState: num("tuitionOutState"), appFee: num("appFee"),
    testPolicy: String(form.get("testPolicy") ?? c.testPolicy).slice(0, 200),
    freeAppNote: String(form.get("freeAppNote") ?? "").slice(0, 300),
    labNote: String(form.get("labNote") ?? "").slice(0, 300),
    publishStatus: z.enum(PUBLISH as [PublishStatus, ...PublishStatus[]]).catch(c.publishStatus).parse(form.get("publishStatus")),
    verification: { status: vstatus, source: String(form.get("source") ?? "").slice(0, 200), sourceUrl, checkedAt: vstatus === "verified" ? new Date().toISOString().slice(0, 10) : c.verification.checkedAt },
  });
  await audit(admin.id, "college.update", id, vstatus);
  revalidatePath("/admin/colleges");
  revalidatePath(`/colleges/${id}`);
  return { ok: "College updated." };
}

export async function saveScholarship(_: FormState, form: FormData): Promise<FormState> {
  const admin = await requireRole("admin");
  const store = await db();
  const id = String(form.get("id") ?? "");
  const name = String(form.get("name") ?? "").trim().slice(0, 140);
  const url = String(form.get("url") ?? "").trim();
  if (!name || !/^https:\/\//.test(url)) return { error: "Name and an official https:// URL are required." };
  const vstatus = z.enum(["verified", "unverified", "demo"]).catch("unverified").parse(form.get("vstatus"));
  const deadline = String(form.get("deadline") ?? "");
  const row = {
    name, url, sponsor: String(form.get("sponsor") ?? "").slice(0, 140), amountText: String(form.get("amountText") ?? "").slice(0, 140),
    amountMax: Number(form.get("amountMax")) || null, eligibility: String(form.get("eligibility") ?? "").slice(0, 1000),
    levels: (["high_school", "college", "transfer"] as const).filter((l) => form.get(`level_${l}`) === "on"),
    tags: String(form.get("tags") ?? "").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 10),
    states: String(form.get("states") ?? "").split(",").map((t) => t.trim().toUpperCase()).filter(Boolean).slice(0, 10),
    essay: form.get("essay") === "on", renewable: form.get("renewable") === "on", needBased: form.get("needBased") === "on", firstGen: form.get("firstGen") === "on",
    deadline: /^\d{4}-\d{2}-\d{2}$/.test(deadline) ? deadline : null, deadlineNote: String(form.get("deadlineNote") ?? "").slice(0, 200),
    documents: String(form.get("documents") ?? "").split(",").map((t) => t.trim()).filter(Boolean).slice(0, 10),
    publishStatus: z.enum(PUBLISH as [PublishStatus, ...PublishStatus[]]).catch("draft").parse(form.get("publishStatus")),
    verification: { status: vstatus, source: "Sponsor website", sourceUrl: url, checkedAt: vstatus === "verified" ? new Date().toISOString().slice(0, 10) : undefined },
  };
  if (id) await store.update("scholarships", id, row);
  else await store.insert("scholarships", row);
  await audit(admin.id, id ? "scholarship.update" : "scholarship.create", id || name, row.publishStatus);
  revalidatePath("/admin/scholarships");
  revalidatePath("/scholarships");
  return { ok: "Scholarship saved." };
}

export async function setScholarshipStatus(id: string, status: PublishStatus) {
  const admin = await requireRole("admin");
  if (!PUBLISH.includes(status)) return;
  const store = await db();
  await store.update("scholarships", id, { publishStatus: status });
  await audit(admin.id, "scholarship.status", id, status);
  revalidatePath("/admin/scholarships");
  revalidatePath("/scholarships");
}

export async function setJobStatus(id: string, status: "approved" | "rejected" | "pending") {
  const admin = await requireRole("admin");
  const store = await db();
  const job = await store.update("jobs", id, { status });
  if (job) await notify(job.postedById, "job", `Your listing "${job.title}" was ${status}.`, "/organization/opportunities");
  await audit(admin.id, "job.status", id, status);
  revalidatePath("/admin/jobs");
  revalidatePath("/jobs");
}

export async function resolveReport(id: string, action: "resolve_remove" | "dismiss") {
  const admin = await requireRole("admin");
  const store = await db();
  const r = await store.get("reports", id);
  if (!r) return;
  if (action === "resolve_remove") {
    if (r.targetType === "post") await store.update("posts", r.targetId, { removed: true });
    if (r.targetType === "comment") await store.update("comments", r.targetId, { removed: true });
    if (r.targetType === "job") await store.update("jobs", r.targetId, { status: "rejected" });
    if (r.targetType === "user") {
      await store.update("users", r.targetId, { status: "suspended" });
      await store.remove("sessions", { userId: r.targetId });
    }
  }
  await store.update("reports", id, { status: action === "dismiss" ? "dismissed" : "resolved" });
  await audit(admin.id, `report.${action}`, id, `${r.targetType}:${r.targetId}`);
  revalidatePath("/admin/reports");
}

export async function deleteGroupAdmin(groupId: string) {
  const admin = await requireRole("admin");
  const store = await db();
  await store.remove("group_members", { groupId });
  await store.remove("groups", { id: groupId });
  await audit(admin.id, "group.delete", groupId);
  revalidatePath("/admin/groups");
}

export async function saveSetting(_: FormState, form: FormData): Promise<FormState> {
  const admin = await requireRole("admin");
  const key = z.enum(["announcement"]).safeParse(form.get("key"));
  if (!key.success) return { error: "Unknown setting." };
  const value = String(form.get("value") ?? "").slice(0, 500);
  const store = await db();
  const s = await store.find("site_settings", { key: key.data });
  if (s) await store.update("site_settings", s.id, { value });
  else await store.insert("site_settings", { key: key.data, value });
  await audit(admin.id, "setting.update", key.data);
  revalidatePath("/", "layout");
  return { ok: "Saved." };
}

// ---------- Organization accounts ----------

export async function saveOrganization(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser();
  if (!["employer", "college"].includes(me.role)) return { error: "Only organization accounts can manage pages." };
  const store = await db();
  const name = String(form.get("name") ?? "").trim().slice(0, 120);
  if (!name) return { error: "Enter your organization's name." };
  const website = String(form.get("website") ?? "").trim();
  const row = {
    name, description: String(form.get("description") ?? "").slice(0, 2000),
    website: /^https:\/\//.test(website) ? website : "", location: String(form.get("location") ?? "").slice(0, 120),
  };
  if (me.orgId) await store.update("organizations", me.orgId, row);
  else {
    const org = await store.insert("organizations", { ...row, type: me.role === "college" ? "college" : "employer", verified: false, ownerId: me.id });
    await store.update("users", me.id, { orgId: org.id });
    await audit(me.id, "org.create", org.id);
  }
  revalidatePath("/organization/dashboard");
  return { ok: "Organization page saved. Verification is reviewed by our team." };
}

export async function postJob(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser();
  if (!canPostOpportunity(actorOf(me))) return { error: "Your organization must be verified before posting opportunities." };
  if (!me.orgId && me.role !== "admin") return { error: "Create your organization page first." };
  const title = String(form.get("title") ?? "").trim().slice(0, 120);
  const url = String(form.get("url") ?? "").trim();
  if (!title) return { error: "Enter a job title." };
  if (url && !/^https:\/\//.test(url)) return { error: "Application links must start with https://" };
  const paid = form.get("paid") === "on";
  const payText = String(form.get("payText") ?? "").slice(0, 80);
  const store = await db();
  await store.insert("jobs", {
    title, orgId: me.orgId ?? String(form.get("orgId") ?? ""), location: String(form.get("location") ?? "").slice(0, 80),
    arrangement: z.enum(["remote", "hybrid", "on_site"]).catch("on_site").parse(form.get("arrangement")),
    payText: paid ? payText : "Unpaid", paid, category: String(form.get("category") ?? "General").slice(0, 60),
    level: z.enum(["high_school", "college", "graduate"]).catch("college").parse(form.get("level")),
    minAge: Number(form.get("minAge")) || null, schedule: String(form.get("schedule") ?? "").slice(0, 80),
    description: String(form.get("description") ?? "").slice(0, 3000),
    responsibilities: String(form.get("responsibilities") ?? "").split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 12),
    qualifications: String(form.get("qualifications") ?? "").split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 12),
    deadline: /^\d{4}-\d{2}-\d{2}$/.test(String(form.get("deadline"))) ? String(form.get("deadline")) : null,
    url: url || null, status: "pending", isDemo: false, postedById: me.id,
  });
  await audit(me.id, "job.create", title);
  revalidatePath("/organization/opportunities");
  return { ok: "Submitted for review. Listings go live after an administrator approves them." };
}
