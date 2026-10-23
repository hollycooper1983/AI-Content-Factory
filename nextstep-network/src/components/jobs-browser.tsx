import Link from "next/link";
import { Briefcase, MapPin } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, label, timeAgo } from "@/lib/format";
import { Badge, Card, DemoBadge, EmptyState, Notice, OrgVerified } from "./ui";

type SP = Record<string, string | undefined>;

export const JOB_CATEGORIES = ["High School Student Jobs", "College Student Jobs", "Summer Jobs", "Paid Internships", "Unpaid Internships", "Healthcare", "Biology & Research", "Nursing", "Engineering", "Business", "Finance", "Technology", "Remote", "Part-Time", "Weekend", "Apprenticeships", "Campus Employment", "Work-Study", "Entry-Level Graduate Jobs"];

export async function JobsBrowser({ sp, base, internshipsOnly = false }: { sp: SP; base: string; internshipsOnly?: boolean }) {
  const user = await getCurrentUser();
  const store = await db();
  const [jobs, orgs, saved] = await Promise.all([
    store.all("jobs", { status: "approved" }), store.all("organizations"),
    user ? store.all("job_applications", { userId: user.id }) : Promise.resolve([]),
  ]);
  const orgMap = new Map(orgs.map((o) => [o.id, o]));
  const savedMap = new Map(saved.map((s) => [s.jobId, s.status]));
  const q = (sp.q ?? "").toLowerCase();
  const cat = sp.cat ?? "";
  const list = jobs.filter((j) => {
    const isIntern = /intern/i.test(j.title);
    if (internshipsOnly && !isIntern) return false;
    const hay = [j.title, j.category, j.description, orgMap.get(j.orgId)?.name ?? "", j.location].join(" ").toLowerCase();
    if (q && !q.split(/\s+/).every((w) => hay.includes(w))) return false;
    if (sp.arrangement && j.arrangement !== sp.arrangement) return false;
    if (sp.paid === "paid" && !j.paid) return false;
    if (sp.paid === "unpaid" && j.paid) return false;
    if (sp.level && j.level !== sp.level) return false;
    if (sp.location && !j.location.toLowerCase().includes(sp.location.toLowerCase())) return false;
    if (sp.age && j.minAge != null && j.minAge > Number(sp.age)) return false;
    const matchCat: Record<string, boolean> = {
      "High School Student Jobs": j.level === "high_school", "College Student Jobs": j.level === "college", "Summer Jobs": /summer/i.test(j.schedule + j.title),
      "Paid Internships": isIntern && j.paid, "Unpaid Internships": isIntern && !j.paid, "Healthcare": /health/i.test(j.category), "Biology & Research": /biology|research/i.test(j.category),
      "Nursing": /nurs/i.test(j.category + j.title), "Engineering": /engineer/i.test(j.category), "Business": /business/i.test(j.category), "Finance": /financ/i.test(j.category),
      "Technology": /tech/i.test(j.category), "Remote": j.arrangement === "remote", "Part-Time": /part/i.test(j.schedule), "Weekend": /weekend/i.test(j.schedule),
      "Apprenticeships": /apprentic/i.test(j.title + j.category), "Campus Employment": /campus/i.test(j.category), "Work-Study": /work-study/i.test(j.category + j.title),
      "Entry-Level Graduate Jobs": j.level === "graduate",
    };
    if (cat && !matchCat[cat]) return false;
    return true;
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const href = (o: SP) => `${base}?${new URLSearchParams(Object.entries({ ...sp, ...o }).filter(([, v]) => v) as [string, string][]).toString()}`;
  return (
    <>
      <div className="mb-4"><Notice tone="amber" title="Demonstration listings">Live job feeds aren't connected yet. Listings marked <strong>Demo</strong> come from fictional employers to show how the marketplace works and have no application link. Verified employers can post real opportunities, which go live after admin review.</Notice></div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <Link href={href({ cat: "" })} className={`chip whitespace-nowrap ${!cat ? "border-brand text-brand" : ""}`}>All</Link>
        {JOB_CATEGORIES.filter((c) => !internshipsOnly || /intern|summer|healthcare|biology|technology|remote|engineering|business/i.test(c)).map((c) => <Link key={c} href={href({ cat: c })} className={`chip whitespace-nowrap ${cat === c ? "border-brand text-brand" : ""}`}>{c}</Link>)}
      </div>
      <div className="grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
        <form className="card h-fit space-y-3 p-4 text-sm lg:sticky lg:top-20" aria-label="Job filters">
          {cat && <input type="hidden" name="cat" value={cat} />}
          <div><label className="label" htmlFor="q">Keyword</label><input id="q" name="q" defaultValue={sp.q} className="input py-1.5" /></div>
          <div><label className="label" htmlFor="location">Location</label><input id="location" name="location" defaultValue={sp.location} placeholder="City or state" className="input py-1.5" /></div>
          <div><label className="label" htmlFor="arrangement">Work arrangement</label><select id="arrangement" name="arrangement" defaultValue={sp.arrangement ?? ""} className="input py-1.5"><option value="">Any</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="on_site">On-site</option></select></div>
          <div><label className="label" htmlFor="paid">Pay</label><select id="paid" name="paid" defaultValue={sp.paid ?? ""} className="input py-1.5"><option value="">Paid or unpaid</option><option value="paid">Paid only</option><option value="unpaid">Unpaid only</option></select></div>
          <div><label className="label" htmlFor="level">Experience level</label><select id="level" name="level" defaultValue={sp.level ?? ""} className="input py-1.5"><option value="">Any</option><option value="high_school">High school</option><option value="college">College</option><option value="graduate">Recent graduate</option></select></div>
          <div><label className="label" htmlFor="age">My age (minimum-age filter)</label><input id="age" name="age" type="number" min={13} max={99} defaultValue={sp.age} className="input py-1.5" /></div>
          <div className="flex gap-2"><button className="btn-primary flex-1">Apply</button><Link href={base} className="btn-ghost">Reset</Link></div>
        </form>
        <div className="min-w-0 space-y-3">
          <p className="text-sm text-muted"><strong className="text-fg">{list.length}</strong> opportunities</p>
          {list.length === 0 ? <Card><EmptyState icon={<Briefcase className="h-5 w-5" />} title="No opportunities match" /></Card> : list.map((j) => {
            const org = orgMap.get(j.orgId);
            return (
              <Card key={j.id} as="article" className="p-4">
                <div className="flex gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-sm font-bold text-brand dark:bg-brand/15">{org?.name.slice(0, 2).toUpperCase()}</div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/jobs/${j.id}`} className="font-semibold hover:text-brand hover:underline">{j.title}</Link>
                    <p className="text-sm">{org?.name} <OrgVerified verified={org?.verified} /></p>
                    <p className="flex items-center gap-1 text-xs text-muted"><MapPin className="h-3 w-3" />{j.location} · {label(j.arrangement)} · {j.schedule}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge tone={j.paid ? "green" : "amber"}>{j.paid ? j.payText : "Unpaid"}</Badge>
                      {j.minAge && <Badge>Age {j.minAge}+</Badge>}
                      <Badge>{j.category}</Badge>
                      {j.isDemo && <DemoBadge />}
                      {savedMap.has(j.id) && <Badge tone="blue">{label(savedMap.get(j.id)!)}</Badge>}
                    </div>
                    <p className="mt-2 text-xs text-muted">Posted {timeAgo(j.createdAt)}{j.deadline ? ` · Apply by ${formatDate(j.deadline)}` : ""}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
