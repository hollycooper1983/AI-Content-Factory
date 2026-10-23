"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { newToken } from "@/lib/crypto";
import { db } from "@/lib/db";
import { effectiveVisibility } from "@/lib/permissions";
import { actorOf } from "@/lib/queries";
import type { AppStatus, Entry, JobAppStatus, ScholarshipAppStatus, Task, UserDoc } from "@/lib/types";
import type { FormState } from "./auth";

const list = (v: FormDataEntryValue | null, max = 30) =>
  String(v ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, max).map((s) => s.slice(0, 60));

function entries(form: FormData, prefix: string): Entry[] {
  const out: Entry[] = [];
  for (let i = 0; i < 10; i++) {
    const title = String(form.get(`${prefix}_${i}_title`) ?? "").trim();
    if (!title) continue;
    out.push({
      title: title.slice(0, 120),
      org: String(form.get(`${prefix}_${i}_org`) ?? "").trim().slice(0, 120),
      start: String(form.get(`${prefix}_${i}_start`) ?? "").trim().slice(0, 20),
      end: String(form.get(`${prefix}_${i}_end`) ?? "").trim().slice(0, 20),
      description: String(form.get(`${prefix}_${i}_description`) ?? "").trim().slice(0, 600),
    });
  }
  return out;
}

const httpsOrEmpty = (v: string) => {
  if (!v) return "";
  try {
    return new URL(v).protocol === "https:" ? v : "";
  } catch {
    return "";
  }
};

export async function saveProfile(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser();
  const store = await db();
  const profile = await store.find("profiles", { userId: me.id });
  if (!profile) return { error: "Profile not found." };
  const gradYear = Number(form.get("gradYear")) || null;
  if (gradYear && (gradYear < 2000 || gradYear > 2040)) return { error: "Enter a valid graduation year." };
  const requested = z.enum(["public", "network", "private"]).catch("network").parse(form.get("visibility"));
  const links = [0, 1, 2]
    .map((i) => ({ label: String(form.get(`link_${i}_label`) ?? "").trim().slice(0, 40), url: httpsOrEmpty(String(form.get(`link_${i}_url`) ?? "").trim()) }))
    .filter((l) => l.label && l.url);
  const name = String(form.get("name") ?? "").trim().slice(0, 80);
  if (name.length >= 2 && name !== me.name) await store.update("users", me.id, { name });

  await store.update("profiles", profile.id, {
    headline: String(form.get("headline") ?? "").trim().slice(0, 160),
    about: String(form.get("about") ?? "").trim().slice(0, 2600),
    school: String(form.get("school") ?? "").trim().slice(0, 120),
    schoolLevel: z.enum(["high_school", "community_college", "university", "trade_school", "graduate", "other"]).catch("other").parse(form.get("schoolLevel")),
    gradYear,
    state: String(form.get("state") ?? "").trim().slice(0, 2).toUpperCase(),
    city: String(form.get("city") ?? "").trim().slice(0, 60),
    careerInterests: list(form.get("careerInterests"), 10),
    skills: list(form.get("skills")),
    education: entries(form, "education"),
    experience: entries(form, "experience"),
    projects: entries(form, "projects"),
    volunteer: entries(form, "volunteer"),
    activities: entries(form, "activities"),
    awards: entries(form, "awards"),
    certifications: entries(form, "certifications"),
    links,
    avatarUrl: httpsOrEmpty(String(form.get("avatarUrl") ?? "").trim()) || profile.avatarUrl,
    bannerUrl: httpsOrEmpty(String(form.get("bannerUrl") ?? "").trim()) || profile.bannerUrl,
    visibility: effectiveVisibility(actorOf(me), requested),
    learningFormat: z.enum(["online", "hybrid", "on_campus", ""]).catch("").parse(form.get("learningFormat") ?? ""),
  });
  revalidatePath("/profile");
  revalidatePath("/feed");
  const note = me.ageGroup === "minor" && requested === "public" ? " Profiles for members under 18 are limited to your network." : "";
  return { ok: "Profile saved." + note };
}

// ---------- College applications ----------

export async function addCollegeToTracker(collegeId: string) {
  const me = await requireUser();
  const store = await db();
  const college = await store.get("colleges", collegeId);
  if (!college) return;
  if (!(await store.find("college_applications", { userId: me.id, collegeId }))) {
    await store.insert("college_applications", {
      userId: me.id, collegeId, status: "interested", appType: college.state === "NC" ? "CFNC" : "Institution application",
      deadline: null, fee: college.appFee, feeWaiver: false, checklist: {}, submittedAt: null, decisionDate: null,
      enrollmentDeposit: "", confirmationNumber: "", notes: "",
    });
  }
  if (!(await store.find("saved_items", { userId: me.id, kind: "college", refId: collegeId }))) {
    await store.insert("saved_items", { userId: me.id, kind: "college", refId: collegeId });
  }
  revalidatePath("/applications");
  revalidatePath("/my-colleges");
  revalidatePath(`/colleges/${collegeId}`);
}

const STATUSES: AppStatus[] = ["interested", "preparing", "in_progress", "submitted", "under_review", "accepted", "waitlisted", "declined", "enrolled"];

export async function updateApplication(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser();
  const store = await db();
  const id = String(form.get("id") ?? "");
  const app = await store.get("college_applications", id);
  if (!app || app.userId !== me.id) return { error: "Application not found." };
  const status = z.enum(STATUSES as [AppStatus, ...AppStatus[]]).catch(app.status).parse(form.get("status"));
  const fee = form.get("fee") === "" || form.get("fee") == null ? null : Math.max(0, Number(form.get("fee")) || 0);
  const date = (k: string) => {
    const v = String(form.get(k) ?? "");
    return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
  };
  await store.update("college_applications", id, {
    status,
    appType: String(form.get("appType") ?? app.appType).slice(0, 60),
    deadline: date("deadline"),
    decisionDate: date("decisionDate"),
    submittedAt: date("submittedAt") ?? (status === "submitted" && !app.submittedAt ? new Date().toISOString().slice(0, 10) : app.submittedAt),
    fee,
    feeWaiver: form.get("feeWaiver") === "on",
    enrollmentDeposit: String(form.get("enrollmentDeposit") ?? "").slice(0, 60),
    confirmationNumber: String(form.get("confirmationNumber") ?? "").slice(0, 60),
    notes: String(form.get("notes") ?? "").slice(0, 2000),
  });
  revalidatePath("/applications");
  return { ok: "Application saved." };
}

export async function toggleChecklist(appId: string, item: string) {
  const me = await requireUser();
  const store = await db();
  const app = await store.get("college_applications", appId);
  if (!app || app.userId !== me.id) return;
  await store.update("college_applications", appId, { checklist: { ...app.checklist, [item]: !app.checklist[item] } });
  revalidatePath("/applications");
  revalidatePath("/dashboard");
}

export async function setApplicationStatus(appId: string, status: AppStatus) {
  const me = await requireUser();
  const store = await db();
  const app = await store.get("college_applications", appId);
  if (!app || app.userId !== me.id || !STATUSES.includes(status)) return;
  await store.update("college_applications", appId, { status });
  revalidatePath("/applications");
}

export async function removeApplication(appId: string) {
  const me = await requireUser();
  const store = await db();
  await store.remove("college_applications", { id: appId, userId: me.id });
  revalidatePath("/applications");
}

// ---------- FAFSA ----------

export async function toggleFafsaStep(stepId: string) {
  const me = await requireUser();
  const store = await db();
  const p = await store.find("fafsa_progress", { userId: me.id });
  if (!p) {
    await store.insert("fafsa_progress", { userId: me.id, awardYear: "2027–28", steps: { [stepId]: { done: true, note: "" } } });
  } else {
    const cur = p.steps[stepId] ?? { done: false, note: "" };
    await store.update("fafsa_progress", p.id, { steps: { ...p.steps, [stepId]: { ...cur, done: !cur.done } } });
  }
  revalidatePath("/fafsa");
  revalidatePath("/dashboard");
}

export async function saveFafsaNote(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser();
  const stepId = String(form.get("stepId") ?? "");
  const note = String(form.get("note") ?? "").slice(0, 300);
  if (/\b\d{3}-?\d{2}-?\d{4}\b/.test(note)) return { error: "That looks like a Social Security number. Please don't store it here." };
  const store = await db();
  const p = await store.find("fafsa_progress", { userId: me.id });
  if (!p) await store.insert("fafsa_progress", { userId: me.id, awardYear: "2027–28", steps: { [stepId]: { done: false, note } } });
  else await store.update("fafsa_progress", p.id, { steps: { ...p.steps, [stepId]: { done: p.steps[stepId]?.done ?? false, note } } });
  revalidatePath("/fafsa");
  return { ok: "Note saved." };
}

export async function saveAidOffer(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser();
  const store = await db();
  const n = (k: string) => Math.max(0, Math.min(1_000_000, Number(form.get(k)) || 0));
  const collegeName = String(form.get("collegeName") ?? "").trim().slice(0, 100);
  if (!collegeName) return { error: "Enter the school name." };
  const row = {
    userId: me.id, collegeName, tuition: n("tuition"), fees: n("fees"), housing: n("housing"), books: n("books"), transportation: n("transportation"),
    grants: n("grants"), scholarships: n("scholarships"), workStudy: n("workStudy"), loans: n("loans"),
  };
  const id = String(form.get("id") ?? "");
  if (id) {
    const existing = await store.get("aid_offers", id);
    if (!existing || existing.userId !== me.id) return { error: "Offer not found." };
    await store.update("aid_offers", id, row);
  } else await store.insert("aid_offers", row);
  revalidatePath("/financial-aid");
  return { ok: "Offer saved." };
}

export async function deleteAidOffer(id: string) {
  const me = await requireUser();
  const store = await db();
  await store.remove("aid_offers", { id, userId: me.id });
  revalidatePath("/financial-aid");
}

export async function setResidencyStatus(status: string) {
  const me = await requireUser();
  const s = z.enum(["not_started", "in_progress", "submitted", "pending", "determined_resident", "determined_nonresident"]).safeParse(status);
  if (!s.success) return;
  const store = await db();
  const p = await store.find("profiles", { userId: me.id });
  if (p) await store.update("profiles", p.id, { residencyStatus: s.data });
  revalidatePath("/residency");
  revalidatePath("/dashboard");
}

// ---------- Scholarships & Jobs ----------

export async function trackScholarship(scholarshipId: string, status: ScholarshipAppStatus = "saved") {
  const me = await requireUser();
  const store = await db();
  const existing = await store.find("scholarship_applications", { userId: me.id, scholarshipId });
  if (existing) await store.update("scholarship_applications", existing.id, { status });
  else await store.insert("scholarship_applications", { userId: me.id, scholarshipId, status, notes: "" });
  revalidatePath("/my-scholarships");
  revalidatePath("/scholarships");
}

export async function untrackScholarship(scholarshipId: string) {
  const me = await requireUser();
  const store = await db();
  await store.remove("scholarship_applications", { userId: me.id, scholarshipId });
  revalidatePath("/my-scholarships");
  revalidatePath("/scholarships");
}

export async function trackJob(jobId: string, status: JobAppStatus = "saved") {
  const me = await requireUser();
  const store = await db();
  const existing = await store.find("job_applications", { userId: me.id, jobId });
  if (existing) await store.update("job_applications", existing.id, { status });
  else await store.insert("job_applications", { userId: me.id, jobId, status, notes: "" });
  revalidatePath("/my-jobs");
  revalidatePath("/jobs");
}

export async function untrackJob(jobId: string) {
  const me = await requireUser();
  const store = await db();
  await store.remove("job_applications", { userId: me.id, jobId });
  revalidatePath("/my-jobs");
}

// ---------- Tasks / deadlines ----------

export async function addTask(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser();
  const title = String(form.get("title") ?? "").trim().slice(0, 140);
  if (!title) return { error: "Enter a task." };
  const date = String(form.get("date") ?? "");
  const kind = z.enum(["application", "fafsa", "scholarship", "job", "event", "personal"]).catch("personal").parse(form.get("kind")) as Task["kind"];
  const store = await db();
  await store.insert("tasks", { userId: me.id, title, date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null, kind, done: false, href: String(form.get("href") ?? "").startsWith("/") ? String(form.get("href")) : "" });
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  return { ok: "Added to your deadlines." };
}

export async function addDeadline(title: string, date: string | null, kind: Task["kind"], href: string) {
  const me = await requireUser();
  const store = await db();
  if (await store.find("tasks", { userId: me.id, title })) return;
  await store.insert("tasks", { userId: me.id, title: title.slice(0, 140), date, kind, done: false, href: href.startsWith("/") ? href : "" });
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}

export async function toggleTask(id: string) {
  const me = await requireUser();
  const store = await db();
  const t = await store.get("tasks", id);
  if (!t || t.userId !== me.id) return;
  await store.update("tasks", id, { done: !t.done });
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}

export async function deleteTask(id: string) {
  const me = await requireUser();
  const store = await db();
  await store.remove("tasks", { id, userId: me.id });
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}

// ---------- Essays & courses ----------

export async function saveEssay(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser();
  const store = await db();
  const id = String(form.get("id") ?? "");
  const title = String(form.get("title") ?? "").trim().slice(0, 120) || "Untitled essay";
  const prompt = String(form.get("prompt") ?? "").slice(0, 1000);
  const target = String(form.get("target") ?? "").slice(0, 120);
  const body = String(form.get("body") ?? "").slice(0, 20000);
  const version = { body, savedAt: new Date().toISOString() };
  if (id) {
    const e = await store.get("essays", id);
    if (!e || e.userId !== me.id) return { error: "Essay not found." };
    const last = e.versions[e.versions.length - 1];
    const versions = last?.body === body ? e.versions : [...e.versions, version].slice(-25);
    await store.update("essays", id, { title, prompt, target, versions });
  } else {
    const e = await store.insert("essays", { userId: me.id, title, prompt, target, versions: [version] });
    redirect(`/applications/essays?e=${e.id}`);
  }
  revalidatePath("/applications/essays");
  return { ok: "Draft saved." };
}

export async function deleteEssay(id: string) {
  const me = await requireUser();
  const store = await db();
  await store.remove("essays", { id, userId: me.id });
  redirect("/applications/essays");
}

export async function addCourse(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser();
  const name = String(form.get("name") ?? "").trim().slice(0, 100);
  if (!name) return { error: "Enter a course name." };
  const store = await db();
  await store.insert("courses", {
    userId: me.id, name, schoolYear: String(form.get("schoolYear") ?? "").slice(0, 20), term: String(form.get("term") ?? "").slice(0, 20),
    credit: Math.max(0, Math.min(10, Number(form.get("credit")) || 1)),
    level: z.enum(["standard", "honors", "ap", "ib", "dual_enrollment", "college"]).catch("standard").parse(form.get("level")),
    grade: String(form.get("grade") ?? "").trim().toUpperCase().slice(0, 3),
  });
  revalidatePath("/applications/courses");
  return { ok: "Course added." };
}

export async function deleteCourse(id: string) {
  const me = await requireUser();
  const store = await db();
  await store.remove("courses", { id, userId: me.id });
  revalidatePath("/applications/courses");
}

// ---------- Saved documents (resume, transfer plan, notes) ----------

export async function saveDoc(kind: UserDoc["kind"], data: Record<string, unknown>): Promise<{ ok: boolean; savedAt: string }> {
  const me = await requireUser();
  const json = JSON.stringify(data);
  if (json.length > 100_000) return { ok: false, savedAt: "" };
  const store = await db();
  const existing = await store.find("user_docs", { userId: me.id, kind });
  if (existing) await store.update("user_docs", existing.id, { data });
  else await store.insert("user_docs", { userId: me.id, kind, data });
  return { ok: true, savedAt: new Date().toISOString() };
}

// ---------- Parent links ----------

export async function generateParentCode() {
  const me = await requireUser();
  if (me.role !== "student") return;
  const store = await db();
  const p = await store.find("profiles", { userId: me.id });
  if (p) await store.update("profiles", p.id, { parentLinkCode: newToken().slice(0, 10).toUpperCase() });
  revalidatePath("/settings");
}

export async function revokeParentAccess(parentId: string) {
  const me = await requireUser();
  const store = await db();
  await store.remove("parent_links", { parentId, studentId: me.id });
  revalidatePath("/settings");
}

export async function claimParentCode(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser();
  if (me.role !== "parent") return { error: "Only parent or guardian accounts can link to a student." };
  const code = String(form.get("code") ?? "").trim().toUpperCase();
  if (code.length < 6) return { error: "Enter the code your student shared." };
  const store = await db();
  const p = await store.find("profiles", { parentLinkCode: code });
  if (!p) return { error: "That code isn't valid. Ask your student to generate a new one in Settings." };
  if (!(await store.find("parent_links", { parentId: me.id, studentId: p.userId }))) await store.insert("parent_links", { parentId: me.id, studentId: p.userId });
  await store.update("profiles", p.id, { parentLinkCode: null });
  await store.insert("notifications", { userId: p.userId, type: "system", text: `${me.name} linked a parent account to your planning checklist. You can remove access in Settings.`, href: "/settings", read: false });
  revalidatePath("/dashboard");
  return { ok: "Linked. You can now see your student's shared planning checklist." };
}
