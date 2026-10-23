import type { CollegeApplication, FafsaProgress, Profile } from "./types";

export const FAFSA_STEPS = [
  { id: "year", label: "Confirm which FAFSA award year you need", help: "Most students starting college in fall 2027 complete the 2027–28 FAFSA." },
  { id: "account", label: "Create your StudentAid.gov account (FSA ID)", help: "Each contributor creates their own account on StudentAid.gov. Never share your login." },
  { id: "contributors", label: "Identify required contributors", help: "StudentAid.gov explains whether a parent or spouse must contribute information." },
  { id: "documents", label: "Review the information you'll need", help: "Have tax and income information ready. Enter it only on StudentAid.gov — never here." },
  { id: "start", label: "Start the official FAFSA form", help: "Only at studentaid.gov. The FAFSA is free." },
  { id: "student", label: "Complete the student section", help: "" },
  { id: "contributor_sections", label: "Contributors complete their sections", help: "Contributors receive an invitation through StudentAid.gov." },
  { id: "submit", label: "Submit the FAFSA", help: "" },
  { id: "confirmation", label: "Review the submission confirmation", help: "Save your confirmation email." },
  { id: "fss", label: "Review your FAFSA Submission Summary", help: "Check it for errors." },
  { id: "corrections", label: "Make corrections if needed", help: "Corrections are made on StudentAid.gov." },
  { id: "offers", label: "Review financial aid offers from schools", help: "" },
  { id: "compare", label: "Compare aid packages", help: "Use the Financial Aid Comparison tool on this site." },
] as const;

export function fafsaPercent(p: FafsaProgress | null): number {
  if (!p) return 0;
  const done = FAFSA_STEPS.filter((s) => p.steps[s.id]?.done).length;
  return Math.round((done / FAFSA_STEPS.length) * 100);
}

export const APP_CHECKLIST = [
  { id: "research", label: "Research program & requirements" },
  { id: "account", label: "Create application account" },
  { id: "transcript", label: "Request transcript" },
  { id: "recommendation", label: "Counselor recommendation (if required)" },
  { id: "essay", label: "Essay (if required)" },
  { id: "testing", label: "Test scores (if required/submitting)" },
  { id: "residency", label: "Residency determination (NC: RDS)" },
  { id: "fee", label: "Pay fee or confirm fee waiver" },
  { id: "submit", label: "Submit application" },
] as const;

export function appPercent(a: Pick<CollegeApplication, "checklist">): number {
  const done = APP_CHECKLIST.filter((c) => a.checklist[c.id]).length;
  return Math.round((done / APP_CHECKLIST.length) * 100);
}

const PROFILE_FIELDS: { key: keyof Profile; weight: number; label: string }[] = [
  { key: "avatarUrl", weight: 10, label: "Profile photo" },
  { key: "headline", weight: 15, label: "Headline" },
  { key: "about", weight: 15, label: "About section" },
  { key: "school", weight: 10, label: "Current school" },
  { key: "gradYear", weight: 5, label: "Graduation year" },
  { key: "careerInterests", weight: 10, label: "Career interests" },
  { key: "skills", weight: 10, label: "Skills" },
  { key: "education", weight: 10, label: "Education" },
  { key: "experience", weight: 5, label: "Experience or activities" },
  { key: "projects", weight: 5, label: "Projects" },
  { key: "volunteer", weight: 5, label: "Volunteer experience" },
];

function filled(v: unknown): boolean {
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "number") return v > 0;
  return typeof v === "string" ? v.trim().length > 0 : v != null;
}

export function profileCompletion(p: Profile | null): { percent: number; missing: string[] } {
  if (!p) return { percent: 0, missing: PROFILE_FIELDS.map((f) => f.label) };
  let score = 0;
  const missing: string[] = [];
  for (const f of PROFILE_FIELDS) {
    const v = f.key === "experience" ? [...p.experience, ...p.activities] : p[f.key];
    if (filled(v)) score += f.weight;
    else missing.push(f.label);
  }
  return { percent: score, missing };
}

/**
 * College Readiness Score: share of recommended preparation tasks completed.
 * This measures planning progress only. It is not an admissions prediction.
 */
export function readinessScore(input: {
  profilePercent: number;
  fafsaPercent: number;
  savedColleges: number;
  submittedApps: number;
  scholarshipsTracked: number;
  hasResume: boolean;
  residencyStarted: boolean;
}): { score: number; items: { label: string; done: boolean }[] } {
  const items = [
    { label: "Profile at least 70% complete", done: input.profilePercent >= 70 },
    { label: "Saved at least 3 colleges", done: input.savedColleges >= 3 },
    { label: "Submitted at least one application", done: input.submittedApps >= 1 },
    { label: "FAFSA at least halfway through", done: input.fafsaPercent >= 50 },
    { label: "Tracking at least 2 scholarships", done: input.scholarshipsTracked >= 2 },
    { label: "Built a resume", done: input.hasResume },
    { label: "Started residency determination (NC students)", done: input.residencyStarted },
  ];
  const score = Math.round((items.filter((i) => i.done).length / items.length) * 100);
  return { score, items };
}
