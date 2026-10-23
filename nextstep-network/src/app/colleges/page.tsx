import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, MapPin, Search } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { label, money } from "@/lib/format";
import { Badge, Card, EmptyState, Notice, PageHeader, VerificationBadge } from "@/components/ui";

export const metadata: Metadata = { title: "College Finder", description: "Search colleges by state, format, degree, cost, HBCU status and transfer options. Every record shows its source and verification status." };

type SP = Record<string, string | undefined>;

export default async function Colleges({ searchParams: sp }: { searchParams: SP }) {
  const user = await getCurrentUser();
  const store = await db();
  const all = (await store.all("colleges", { publishStatus: "published" })).sort((a, b) => a.name.localeCompare(b.name));
  const saved = user ? new Set((await store.all("saved_items", { userId: user.id, kind: "college" })).map((s) => s.refId)) : new Set<string>();
  const states = [...new Set(all.map((c) => c.state))].sort();
  const q = (sp.q ?? "").toLowerCase().trim();
  const maxTuition = Number(sp.maxTuition) || null;
  const list = all.filter((c) => {
    const hay = [c.name, c.city, c.state, ...c.majors, ...c.degrees, c.hbcu ? "hbcu" : "", c.online ? "online" : "", label(c.type)].join(" ").toLowerCase();
    if (q && !q.split(/\s+/).every((w) => hay.includes(w))) return false;
    if (sp.state && c.state !== sp.state) return false;
    if (sp.type && c.type !== sp.type) return false;
    if (sp.hbcu && !c.hbcu) return false;
    if (sp.format === "online" && !c.online) return false;
    if (sp.format === "hybrid" && !c.hybrid) return false;
    if (sp.format === "campus" && !c.campus) return false;
    if (sp.major && !c.majors.some((m) => m.toLowerCase().includes(sp.major!.toLowerCase()))) return false;
    if (sp.transfer && !c.transferFriendly) return false;
    if (sp.freeapp && !(c.appFee === 0 || c.freeAppNote)) return false;
    if (maxTuition && (c.tuitionInState == null || c.tuitionInState > maxTuition)) return false;
    return true;
  });
  const sel = "input py-1.5";
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <PageHeader eyebrow="College Finder" title="Find colleges that fit your plans" subtitle="Search by format, location, cost, degree and more. Then compare up to four side by side or add them to your Application Tracker."
        action={<Link href="/my-colleges" className="btn-secondary">My saved colleges ({saved.size})</Link>} />
      <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <form className="card h-fit space-y-3 p-4 text-sm lg:sticky lg:top-20" aria-label="College filters">
          <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted" /><label htmlFor="q" className="sr-only">Search</label><input id="q" name="q" defaultValue={sp.q} placeholder="Name, city or major" className="input pl-8" /></div>
          <div><label className="label" htmlFor="state">State</label><select id="state" name="state" defaultValue={sp.state ?? ""} className={sel}><option value="">Any state</option>{states.map((s) => <option key={s}>{s}</option>)}</select></div>
          <div><label className="label" htmlFor="type">Institution type</label><select id="type" name="type" defaultValue={sp.type ?? ""} className={sel}><option value="">Any type</option><option value="community">Community college</option><option value="public4">Public 4-year</option><option value="private4">Private 4-year</option><option value="trade">Trade / technical</option></select></div>
          <div><label className="label" htmlFor="format">Delivery format</label><select id="format" name="format" defaultValue={sp.format ?? ""} className={sel}><option value="">Any</option><option value="online">Fully online options</option><option value="hybrid">Hybrid</option><option value="campus">Campus-based</option></select></div>
          <div><label className="label" htmlFor="major">Intended major</label><input id="major" name="major" defaultValue={sp.major} placeholder="e.g. Biology" className={sel} /></div>
          <div><label className="label" htmlFor="maxTuition">Max in-state tuition (verified only)</label><input id="maxTuition" name="maxTuition" type="number" min={0} step={500} defaultValue={sp.maxTuition} className={sel} /><p className="mt-1 text-[11px] text-muted">Only colleges with confirmed tuition figures match this filter.</p></div>
          <fieldset className="space-y-1.5">
            <legend className="label">More</legend>
            {[["hbcu", "HBCU"], ["transfer", "Transfer-friendly"], ["freeapp", "Free application / fee notes"]].map(([k, l]) => (
              <label key={k} className="flex items-center gap-2"><input type="checkbox" name={k} value="1" defaultChecked={!!sp[k]} /> {l}</label>
            ))}
          </fieldset>
          <div className="flex gap-2"><button className="btn-primary flex-1">Apply filters</button><Link href="/colleges" className="btn-ghost">Reset</Link></div>
          <p className="text-[11px] text-muted">Distance, net cost, SAT/ACT and lab-requirement filters need verified data and arrive as admins verify records.</p>
        </form>

        <form action="/colleges/compare" className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted"><strong className="text-fg">{list.length}</strong> colleges</p>
            <button className="btn-secondary btn-sm">Compare selected (up to 4)</button>
          </div>
          <Notice tone="amber">Cost, fee and testing details are starter data marked <strong>Unverified</strong> until an administrator confirms them with College Scorecard and the college. Always confirm on the official website.</Notice>
          {list.length === 0 ? <Card><EmptyState icon={<GraduationCap className="h-5 w-5" />} title="No colleges match those filters" action={<Link href="/colleges" className="btn-primary">Clear filters</Link>} /></Card> : list.map((c) => (
            <Card key={c.id} as="article" className="p-4">
              <div className="flex gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-navy text-lg font-bold text-white">{c.name.split(/\s+/).filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).join("").slice(0, 3)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Link href={`/colleges/${c.id}`} className="text-lg font-semibold hover:text-brand">{c.name}</Link>
                      <p className="flex items-center gap-1 text-sm text-muted"><MapPin className="h-3.5 w-3.5" /> {c.city}, {c.state} · {label(c.type)}</p>
                    </div>
                    <label className="flex items-center gap-1.5 text-xs text-muted"><input type="checkbox" name="ids" value={c.id} /> Compare</label>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {c.hbcu && <Badge tone="navy">HBCU</Badge>}
                    {c.online && <Badge tone="teal">Online options</Badge>}
                    {c.hybrid && <Badge tone="blue">Hybrid</Badge>}
                    {c.transferFriendly && <Badge>Transfer-friendly</Badge>}
                    {saved.has(c.id) && <Badge tone="green">Saved</Badge>}
                    <VerificationBadge v={c.verification} />
                  </div>
                  <p className="mt-2 text-sm text-muted">Programs: {c.majors.slice(0, 5).join(" · ")}</p>
                  <p className="mt-1 text-sm">In-state tuition: <strong>{c.tuitionInState != null ? money(c.tuitionInState) : "Not yet verified"}</strong>{c.freeAppNote && <span className="text-muted"> · {c.freeAppNote}</span>}</p>
                </div>
              </div>
            </Card>
          ))}
        </form>
      </div>
    </div>
  );
}
