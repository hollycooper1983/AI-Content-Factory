export function formatDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }): string {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? iso + "T12:00:00" : iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", opts);
}

export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return formatDate(iso, { month: "short", day: "numeric" });
}

export function daysUntil(iso: string | null | undefined, now = new Date()): number | null {
  if (!iso) return null;
  const d = new Date(iso.length === 10 ? iso + "T12:00:00" : iso);
  return Math.ceil((d.getTime() - now.getTime()) / 864e5);
}

export function money(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
}

export function cn(...c: (string | false | null | undefined)[]): string {
  return c.filter(Boolean).join(" ");
}

export const LABELS: Record<string, string> = {
  interested: "Interested", preparing: "Preparing Application", in_progress: "In Progress", submitted: "Submitted",
  under_review: "Under Review", accepted: "Accepted", waitlisted: "Waitlisted", declined: "Declined", enrolled: "Enrolled",
  saved: "Saved", awarded: "Awarded", not_awarded: "Not Awarded", applied: "Applied", interviewing: "Interviewing",
  offer: "Offer", not_selected: "Not Selected",
  community: "Community College", public4: "Public 4-Year", private4: "Private 4-Year", trade: "Trade / Technical",
  remote: "Remote", hybrid: "Hybrid", on_site: "On-site",
  high_school: "High School", community_college: "Community College", university: "University", trade_school: "Trade School", graduate: "Recent Graduate", other: "Other",
  student: "Student", parent: "Parent / Guardian", college: "College / University", employer: "Employer", mentor: "Mentor", counselor: "Counselor", admin: "Administrator",
  draft: "Draft", pending_review: "Pending Review", approved: "Approved", published: "Published", archived: "Archived",
};
export const label = (k: string) => LABELS[k] ?? k;
