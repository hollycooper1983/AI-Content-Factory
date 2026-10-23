import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink as Ext, FlaskConical, MapPin } from "lucide-react";
import { addCollegeToTracker } from "@/app/actions/planning";
import { toggleFollow, toggleSave } from "@/app/actions/social";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, label, money } from "@/lib/format";
import { ActionButton } from "@/components/client-ui";
import { Badge, Card, ExternalLink, Notice, VerificationBadge } from "@/components/ui";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const c = await (await db()).get("colleges", params.id);
  return { title: c?.name ?? "College", description: c ? `${c.name} in ${c.city}, ${c.state}: programs, formats, admissions links and planning tools.` : undefined };
}

export default async function College({ params }: { params: { id: string } }) {
  const store = await db();
  const c = await store.get("colleges", params.id);
  if (!c || c.publishStatus !== "published") notFound();
  const user = await getCurrentUser();
  const orgId = `org-${c.id}`;
  const [saved, follow, app] = user
    ? await Promise.all([store.find("saved_items", { userId: user.id, kind: "college", refId: c.id }), store.find("follows", { userId: user.id, orgId }), store.find("college_applications", { userId: user.id, collegeId: c.id })])
    : [null, null, null];
  const row = (k: string, v: React.ReactNode) => <div className="grid grid-cols-[160px_1fr] gap-2 border-b border-line py-2 text-sm last:border-0"><dt className="text-muted">{k}</dt><dd>{v}</dd></div>;
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Link href="/colleges" className="text-sm text-brand hover:underline">← College Finder</Link>
      <Card className="mt-3 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-navy via-brand to-teal" />
        <div className="px-5 pb-5">
          <div className="-mt-10 flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-surface bg-navy text-2xl font-bold text-white">{c.name.split(/\s+/).filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).join("").slice(0, 3)}</div>
          <h1 className="mt-3 text-2xl font-bold">{c.name}</h1>
          <p className="flex items-center gap-1 text-sm text-muted"><MapPin className="h-4 w-4" /> {c.city}, {c.state} · {label(c.type)}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">{c.hbcu && <Badge tone="navy">HBCU</Badge>}{c.online && <Badge tone="teal">Online options</Badge>}{c.hybrid && <Badge tone="blue">Hybrid</Badge>}{c.campus && <Badge>Campus-based</Badge>}<VerificationBadge v={c.verification} /></div>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={c.admissionsUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">Visit official application <Ext className="h-4 w-4" /></a>
            {user ? (
              <>
                {app ? <Link href="/applications" className="btn-secondary">In your Application Tracker</Link> : <ActionButton className="btn-secondary" action={addCollegeToTracker.bind(null, c.id)}>Add to My Application Tracker</ActionButton>}
                <ActionButton className="btn-ghost" action={toggleSave.bind(null, "college", c.id, `/colleges/${c.id}`)}>{saved ? "Saved ✓" : "Save college"}</ActionButton>
                <ActionButton className="btn-ghost" action={toggleFollow.bind(null, orgId)}>{follow ? "Following ✓" : "Follow college"}</ActionButton>
              </>
            ) : <Link href={`/login?next=/colleges/${c.id}`} className="btn-secondary">Sign in to save & track</Link>}
            <Link href={`/colleges/compare?ids=${c.id}`} className="btn-ghost">Compare</Link>
          </div>
        </div>
      </Card>
      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="mb-2 font-semibold">Overview</h2>
            <dl>
              {row("Official website", <ExternalLink href={c.website}>{c.website.replace(/^https:\/\/(www\.)?/, "")}</ExternalLink>)}
              {row("Admissions", <ExternalLink href={c.admissionsUrl}>Admissions website</ExternalLink>)}
              {row("Degrees", c.degrees.join(", "))}
              {row("Programs (sample)", c.majors.join(", "))}
              {row("Delivery formats", [c.online && "Online", c.hybrid && "Hybrid", c.campus && "On campus"].filter(Boolean).join(", "))}
              {row("Accreditation", c.accreditation)}
              {row("Transfer", c.transferFriendly ? "Accepts transfer students — confirm credit policies with the admissions office" : "Check with the college")}
            </dl>
          </Card>
          <Card className="p-5">
            <h2 className="mb-2 font-semibold">Cost & admissions</h2>
            <dl>
              {row("In-state tuition", c.tuitionInState != null ? money(c.tuitionInState) : "Not yet verified")}
              {row("Out-of-state tuition", c.tuitionOutState != null ? money(c.tuitionOutState) : "Not yet verified")}
              {row("Application fee", c.appFee != null ? money(c.appFee) : "Not yet verified")}
              {row("Fee waivers / notes", c.freeAppNote || "Ask admissions about fee waivers")}
              {row("Testing policy", c.testPolicy)}
              {row("Financial aid", <ExternalLink href={c.financialAidUrl || c.website}>Financial aid information</ExternalLink>)}
            </dl>
            <p className="mt-3 text-xs text-muted">Source: {c.verification.sourceUrl ? <ExternalLink href={c.verification.sourceUrl}>{c.verification.source}</ExternalLink> : c.verification.source}{c.verification.checkedAt ? ` · checked ${formatDate(c.verification.checkedAt)}` : ""}</p>
          </Card>
          {c.labNote && <Notice tone="amber" title="Online lectures vs. in-person labs"><span className="flex gap-2"><FlaskConical className="h-4 w-4 shrink-0" />{c.labNote}</span></Notice>}
        </div>
        <aside className="space-y-4">
          <Card className="p-4 text-sm">
            <h2 className="font-semibold">Plan your application</h2>
            <ul className="mt-2 space-y-1.5">
              {c.state === "NC" && <li><ExternalLink href="https://www.cfnc.org/">Apply through CFNC</ExternalLink></li>}
              {c.state === "NC" && <li><ExternalLink href="https://www.ncresidency.org/">NC Residency Determination</ExternalLink></li>}
              {c.type !== "community" && <li><ExternalLink href="https://www.commonapp.org/">Common App (check if accepted)</ExternalLink></li>}
              <li><ExternalLink href="https://studentaid.gov/">FAFSA at StudentAid.gov</ExternalLink></li>
              <li><ExternalLink href="https://collegescorecard.ed.gov/">College Scorecard</ExternalLink></li>
            </ul>
          </Card>
          <Card className="p-4 text-sm">
            <h2 className="font-semibold">Institution page</h2>
            <p className="mt-1 text-muted">This page is unclaimed. Official representatives can sign up with a college account and request verification.</p>
            <Link href={`/organizations/${orgId}`} className="mt-2 inline-block font-semibold text-brand hover:underline">View organization page</Link>
          </Card>
        </aside>
      </div>
    </div>
  );
}
