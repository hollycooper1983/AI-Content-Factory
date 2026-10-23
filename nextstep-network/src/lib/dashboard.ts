import "server-only";
import { db } from "./db";
import { appPercent, fafsaPercent, profileCompletion, readinessScore } from "./progress";
import { connectionIds } from "./queries";

export async function studentSummary(userId: string) {
  const store = await db();
  const [profile, apps, fafsa, schApps, jobApps, tasks, saved, groups, colleges, scholarships, jobs, resume] = await Promise.all([
    store.find("profiles", { userId }), store.all("college_applications", { userId }), store.find("fafsa_progress", { userId }),
    store.all("scholarship_applications", { userId }), store.all("job_applications", { userId }), store.all("tasks", { userId }),
    store.all("saved_items", { userId }), store.all("group_members", { userId, status: "member" }), store.all("colleges"),
    store.all("scholarships"), store.all("jobs"), store.find("user_docs", { userId, kind: "resume" }),
  ]);
  const conns = await connectionIds(userId);
  const cMap = new Map(colleges.map((c) => [c.id, c]));
  const sMap = new Map(scholarships.map((s) => [s.id, s]));
  const jMap = new Map(jobs.map((j) => [j.id, j]));
  const prof = profileCompletion(profile);
  const fPct = fafsaPercent(fafsa);
  const submittedStatuses = ["submitted", "under_review", "accepted", "waitlisted", "declined", "enrolled"];
  const submitted = apps.filter((a) => submittedStatuses.includes(a.status));
  const savedColleges = saved.filter((s) => s.kind === "college").length;
  const readiness = readinessScore({
    profilePercent: prof.percent, fafsaPercent: fPct, savedColleges, submittedApps: submitted.length,
    scholarshipsTracked: schApps.length, hasResume: !!resume, residencyStarted: !!profile && profile.residencyStatus !== "not_started",
  });
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = tasks.filter((t) => !t.done).sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"));
  return {
    profile, prof, fafsa, fPct, readiness, connections: conns.size, groups: groups.length, savedCount: saved.length, savedColleges,
    apps: apps.map((a) => ({ ...a, college: cMap.get(a.collegeId), pct: appPercent(a) })),
    submitted: submitted.length,
    schApps: schApps.map((s) => ({ ...s, scholarship: sMap.get(s.scholarshipId) })),
    jobApps: jobApps.map((j) => ({ ...j, job: jMap.get(j.jobId) })),
    upcoming, overdue: upcoming.filter((t) => t.date && t.date < today), tasks,
  };
}

export type StudentSummary = Awaited<ReturnType<typeof studentSummary>>;

export function nextActions(s: StudentSummary): { label: string; href: string }[] {
  const out: { label: string; href: string }[] = [];
  if (s.prof.percent < 70) out.push({ label: `Finish your profile (${s.prof.missing.slice(0, 2).join(", ")})`, href: "/profile/edit" });
  if (s.fPct < 100) {
    const p = s.fafsa;
    out.push({ label: p && p.steps.submit?.done ? "Review your FAFSA Submission Summary and aid offers" : "Continue your FAFSA checklist", href: "/fafsa" });
  }
  if (s.profile?.state === "NC" && ["not_started", "in_progress", "pending"].includes(s.profile.residencyStatus ?? "not_started")) {
    out.push({ label: s.profile.residencyStatus === "pending" ? "Check your NC residency determination status" : "Complete your NC residency determination (RDS)", href: "/residency" });
  }
  if (s.savedColleges < 3) out.push({ label: "Save at least 3 colleges to compare", href: "/colleges" });
  const researching = s.apps.filter((a) => a.status === "interested");
  if (researching.length) out.push({ label: `Start an application: ${researching[0].college?.name}`, href: "/applications" });
  if (s.schApps.length < 3) out.push({ label: "Find scholarships that match your interests", href: "/scholarships" });
  if (s.overdue.length) out.push({ label: `You have ${s.overdue.length} overdue task${s.overdue.length > 1 ? "s" : ""}`, href: "/calendar" });
  return out.slice(0, 5);
}
