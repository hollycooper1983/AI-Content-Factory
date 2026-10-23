import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink as Ext, ShieldAlert, Trophy } from "lucide-react";
import { trackScholarship, untrackScholarship, addDeadline } from "@/app/actions/planning";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { ActionButton } from "@/components/client-ui";
import { Badge, Card, EmptyState, Notice, PageHeader, StatusPill, VerificationBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Scholarships", description: "Search real scholarships linked to official sponsors. Free — no fees, ever." };

type SP = Record<string, string | undefined>;

export default async function Scholarships({ searchParams: sp }: { searchParams: SP }) {
  const user = await getCurrentUser();
  const store = await db();
  const all = (await store.all("scholarships", { publishStatus: "published" })).sort((a, b) => a.name.localeCompare(b.name));
  const tracked = user ? new Map((await store.all("scholarship_applications", { userId: user.id })).map((t) => [t.scholarshipId, t])) : new Map();
  const q = (sp.q ?? "").toLowerCase();
  const list = all.filter((s) => {
    const hay = [s.name, s.sponsor, s.eligibility, ...s.tags].join(" ").toLowerCase();
    if (q && !q.split(/\s+/).every((w) => hay.includes(w))) return false;
    if (sp.level && !s.levels.includes(sp.level as never)) return false;
    if (sp.state && !(s.states.length === 0 || s.states.includes(sp.state))) return false;
    if (sp.need && !s.needBased) return false;
    if (sp.firstgen && !s.firstGen) return false;
    if (sp.noessay && s.essay) return false;
    if (sp.renewable && !s.renewable) return false;
    if (sp.tag && !s.tags.some((t) => t.includes(sp.tag!.toLowerCase()))) return false;
    return true;
  });
  const cmp = (Array.isArray(sp.compare) ? sp.compare : (sp.compare ?? "").split(",")).filter(Boolean).slice(0, 4);
  const compared = cmp.map((id) => all.find((s) => s.id === id)).filter(Boolean) as typeof all;
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <PageHeader eyebrow="Scholarship Discovery" title="Find scholarships" subtitle="Real programs, linked to official sponsor websites. Searching and applying through official links is always free on NextStep."
        action={<Link href="/my-scholarships" className="btn-secondary">My scholarships ({tracked.size})</Link>} />
      <div className="mb-4"><Notice tone="amber" title="Details change every year">Award amounts, eligibility and deadlines are confirmed against each sponsor's site by our team. Until a listing shows <strong>Verified</strong>, treat it as a lead and confirm everything on the official website.</Notice></div>
      {compared.length > 0 && (
        <Card className="mb-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead><tr className="border-b border-line"><th className="p-3 text-muted">Compare</th>{compared.map((s) => <th key={s.id} className="p-3">{s.name}</th>)}</tr></thead>
            <tbody>
              {([["Sponsor", (s) => s.sponsor], ["Award", (s) => s.amountText], ["Eligibility", (s) => s.eligibility], ["Essay", (s) => (s.essay ? "Yes" : "No")], ["Renewable", (s) => (s.renewable ? "Yes" : "No")], ["Need-based", (s) => (s.needBased ? "Yes" : "No")], ["Deadline", (s) => (s.deadline ? formatDate(s.deadline) : s.deadlineNote)], ["Documents", (s) => s.documents.join(", ")]] as [string, (s: (typeof all)[number]) => string][]).map(([k, f]) => (
                <tr key={k} className="border-b border-line align-top last:border-0"><th scope="row" className="p-3 font-medium text-muted">{k}</th>{compared.map((s) => <td key={s.id} className="p-3">{f(s)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <div className="grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
        <form className="card h-fit space-y-3 p-4 text-sm lg:sticky lg:top-20" aria-label="Scholarship filters">
          <div><label className="label" htmlFor="q">Keyword</label><input id="q" name="q" defaultValue={sp.q} placeholder="e.g. transfer, nursing" className="input py-1.5" /></div>
          <div><label className="label" htmlFor="level">Student type</label><select id="level" name="level" defaultValue={sp.level ?? ""} className="input py-1.5"><option value="">Any</option><option value="high_school">High school student</option><option value="college">College student</option><option value="transfer">Transfer student</option></select></div>
          <div><label className="label" htmlFor="state">State</label><select id="state" name="state" defaultValue={sp.state ?? ""} className="input py-1.5"><option value="">Any (incl. national)</option><option value="NC">North Carolina</option></select></div>
          <div><label className="label" htmlFor="tag">Major / interest</label><input id="tag" name="tag" defaultValue={sp.tag} placeholder="e.g. hbcu, merit" className="input py-1.5" /></div>
          <fieldset className="space-y-1.5"><legend className="label">Requirements</legend>
            {[["need", "Financial need"], ["firstgen", "First-generation"], ["noessay", "No essay"], ["renewable", "Renewable"]].map(([k, l]) => <label key={k} className="flex items-center gap-2"><input type="checkbox" name={k} value="1" defaultChecked={!!sp[k]} /> {l}</label>)}
          </fieldset>
          <div className="flex gap-2"><button className="btn-primary flex-1">Apply</button><Link href="/scholarships" className="btn-ghost">Reset</Link></div>
          <Link href="/resources#scam-checker" className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-xs font-medium text-amber-900 dark:bg-amber-500/10 dark:text-amber-100"><ShieldAlert className="h-4 w-4" /> Scholarship Scam Awareness Center</Link>
        </form>
        <form action="/scholarships" className="min-w-0 space-y-3">
          <div className="flex items-center justify-between"><p className="text-sm text-muted"><strong className="text-fg">{list.length}</strong> scholarships</p><button className="btn-secondary btn-sm">Compare selected</button></div>
          {list.length === 0 ? <Card><EmptyState icon={<Trophy className="h-5 w-5" />} title="No scholarships match" action={<Link href="/scholarships" className="btn-primary">Clear filters</Link>} /></Card> : list.map((s) => {
            const t = tracked.get(s.id);
            return (
              <Card key={s.id} as="article" className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold">{s.name}</h2>
                    <p className="text-sm text-muted">{s.sponsor}</p>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-muted"><input type="checkbox" name="compare" value={s.id} defaultChecked={cmp.includes(s.id)} /> Compare</label>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge tone="green">{s.amountText}</Badge>
                  {s.renewable && <Badge tone="blue">Renewable</Badge>}{s.needBased && <Badge>Need-based</Badge>}{s.firstGen && <Badge>First-gen</Badge>}<Badge>{s.essay ? "Essay required" : "No essay"}</Badge>
                  {t && <StatusPill status={t.status} />}
                </div>
                <p className="mt-2 text-sm"><span className="font-medium">Eligibility:</span> {s.eligibility}</p>
                <p className="mt-1 text-sm"><span className="font-medium">Deadline:</span> {s.deadline ? formatDate(s.deadline) : <span className="text-muted">{s.deadlineNote}</span>}</p>
                <p className="mt-1 text-sm"><span className="font-medium">Documents:</span> {s.documents.join(", ")}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted"><VerificationBadge v={s.verification} />{s.verification.checkedAt && <span>Last verified {formatDate(s.verification.checkedAt)}</span>}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="btn-primary btn-sm">Apply on official site <Ext className="h-3.5 w-3.5" /></a>
                  {user ? (
                    <>
                      {t ? <ActionButton className="btn-ghost btn-sm" action={untrackScholarship.bind(null, s.id)}>Stop tracking</ActionButton> : <ActionButton className="btn-secondary btn-sm" action={trackScholarship.bind(null, s.id, "saved")}>Save & track</ActionButton>}
                      <ActionButton className="btn-ghost btn-sm" action={addDeadline.bind(null, `Check ${s.name} deadline on sponsor site`, s.deadline, "scholarship", "/my-scholarships")}>Add reminder task</ActionButton>
                    </>
                  ) : <Link href="/login?next=/scholarships" className="btn-secondary btn-sm">Sign in to save</Link>}
                </div>
              </Card>
            );
          })}
        </form>
      </div>
    </div>
  );
}
