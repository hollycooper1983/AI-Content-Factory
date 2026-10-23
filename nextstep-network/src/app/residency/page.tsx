import type { Metadata } from "next";
import Link from "next/link";
import { setResidencyStatus } from "@/app/actions/planning";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { label } from "@/lib/format";
import { ActionButton } from "@/components/client-ui";
import { Badge, Card, ExternalLink, Notice, PageHeader, VerificationBadge } from "@/components/ui";
import { addDeadline } from "@/app/actions/planning";
import { toggleSave } from "@/app/actions/social";

export const metadata: Metadata = { title: "North Carolina Residency & Free Application Resources" };

const STATUSES = [["not_started", "Not started"], ["in_progress", "In progress"], ["submitted", "Submitted to RDS"], ["pending", "Pending determination"], ["determined_resident", "Determined: in-state resident"], ["determined_nonresident", "Determined: not in-state"]] as const;

export default async function Residency({ searchParams }: { searchParams: { state?: string; method?: string } }) {
  const user = await getCurrentUser();
  const store = await db();
  const profile = user ? await store.find("profiles", { userId: user.id }) : null;
  const colleges = (await store.all("colleges", { publishStatus: "published" })).filter((c) => c.freeAppNote || c.appFee === 0);
  const savedW = user ? new Set((await store.all("saved_items", { userId: user.id, kind: "fee_waiver" })).map((s) => s.refId)) : new Set<string>();
  const list = colleges.filter((c) => (!searchParams.state || c.state === searchParams.state) && (!searchParams.method || (searchParams.method === "cfnc" ? c.state === "NC" : c.state !== "NC")));
  const res = profile?.residencyStatus ?? "not_started";
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <PageHeader eyebrow="North Carolina Student Resources" title="NC residency & free application resources" subtitle="Everything North Carolina students need for residency determination, CFNC applications, state aid and fee waivers — with official links." />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="font-semibold">Residency Determination Service (RDS)</h2>
            <p className="mt-1 text-sm text-muted">North Carolina uses RDS to determine whether students qualify as in-state residents for tuition and state grants. Complete it at the official site; it's commonly part of applying to NC public colleges and state aid.</p>
            <a href="https://www.ncresidency.org/" target="_blank" rel="noopener noreferrer" className="btn-primary mt-3">Go to ncresidency.org</a>
            {user ? (
              <div className="mt-5">
                <p className="text-sm font-medium">My residency status <span className="text-xs font-normal text-muted">(private — never shown on your profile)</span></p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {STATUSES.map(([v, l]) => (
                    <ActionButton key={v} className={v === res ? "btn-primary btn-sm" : "btn-secondary btn-sm"} action={setResidencyStatus.bind(null, v)}>{l}</ActionButton>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted">Do not enter your Residency Certification Number (RCN) anywhere on NextStep, including posts, groups or messages. Keep it with your private records and share it only on official application forms.</p>
              </div>
            ) : <p className="mt-4 text-sm"><Link href="/login?next=/residency" className="link">Sign in</Link> to track your residency status privately.</p>}
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold">Free application & fee waiver alerts</h2>
            <p className="mt-1 text-sm text-muted">Colleges with notes about free applications or fee waivers. Each entry shows its source and verification status — confirm eligibility and dates on the official site before relying on it.</p>
            <form className="mt-3 flex flex-wrap gap-2 text-sm">
              <select name="state" defaultValue={searchParams.state ?? ""} className="input w-auto py-1.5" aria-label="State"><option value="">All states</option><option value="NC">North Carolina</option><option value="AZ">Arizona</option></select>
              <select name="method" defaultValue={searchParams.method ?? ""} className="input w-auto py-1.5" aria-label="Application method"><option value="">Any method</option><option value="cfnc">CFNC</option><option value="direct">Direct to college</option></select>
              <button className="btn-secondary btn-sm">Filter</button>
            </form>
            <ul className="mt-4 divide-y divide-line">
              {list.map((c) => (
                <li key={c.id} className="flex flex-wrap items-start justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <Link href={`/colleges/${c.id}`} className="font-medium hover:text-brand">{c.name}</Link>
                    <p className="text-xs text-muted">{c.freeAppNote}</p>
                    <div className="mt-1 flex gap-1"><Badge>{label(c.type)}</Badge><VerificationBadge v={c.verification} showDate={false} /></div>
                  </div>
                  {user && <div className="flex gap-2">
                    <ActionButton className="btn-secondary btn-sm" action={toggleSave.bind(null, "fee_waiver", c.id, "/residency")}>{savedW.has(c.id) ? "Saved ✓" : "Save opportunity"}</ActionButton>
                    <ActionButton className="btn-ghost btn-sm" action={addDeadline.bind(null, `Confirm free application / fee waiver: ${c.name}`, null, "application", `/colleges/${c.id}`)}>Add deadline</ActionButton>
                  </div>}
                </li>
              ))}
              {list.length === 0 && <li className="py-4 text-sm text-muted">No entries match.</li>}
            </ul>
          </Card>
        </div>
        <aside className="space-y-4">
          <Card className="p-4 text-sm">
            <h2 className="font-semibold">Official NC links</h2>
            <ul className="mt-2 space-y-1.5">
              <li><ExternalLink href="https://www.ncresidency.org/">NC Residency Determination Service</ExternalLink></li>
              <li><ExternalLink href="https://www.cfnc.org/">CFNC — apply, plan & pay</ExternalLink></li>
              <li><ExternalLink href="https://www.nccommunitycolleges.edu/">NC Community College System</ExternalLink></li>
              <li><ExternalLink href="https://www.northcarolina.edu/">UNC System</ExternalLink></li>
              <li><ExternalLink href="https://www.ncseaa.edu/">NC State Education Assistance Authority (state aid)</ExternalLink></li>
            </ul>
          </Card>
          <Card className="p-4 text-sm">
            <h2 className="font-semibold">North Carolina HBCUs in our directory</h2>
            <p className="mt-1 text-muted"><Link href="/colleges?hbcu=1&state=NC" className="link">Browse NC HBCUs</Link></p>
          </Card>
          <Notice tone="blue" title="NC College Application Week">CFNC promotes an annual college application week when many NC colleges waive application fees. Check CFNC for this year's dates and participating schools.</Notice>
          <Card className="p-4 text-sm"><h2 className="font-semibold">Transfer</h2><p className="mt-1 text-muted">Community college students can plan AS/AA transfer pathways with the <Link href="/transfer-planner" className="link">Transfer Planner</Link>.</p></Card>
        </aside>
      </div>
    </div>
  );
}
