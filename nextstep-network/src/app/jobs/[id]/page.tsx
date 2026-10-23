import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink as Ext, MapPin } from "lucide-react";
import { trackJob, untrackJob } from "@/app/actions/planning";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, label } from "@/lib/format";
import { ActionButton } from "@/components/client-ui";
import { Badge, Card, DemoBadge, Notice, OrgVerified } from "@/components/ui";
import { ReportButton } from "@/components/report-button";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const j = await (await db()).get("jobs", params.id);
  return { title: j?.title ?? "Opportunity" };
}

export default async function Job({ params }: { params: { id: string } }) {
  const store = await db();
  const j = await store.get("jobs", params.id);
  const user = await getCurrentUser();
  if (!j || (j.status !== "approved" && user?.role !== "admin" && user?.id !== j.postedById)) notFound();
  const org = await store.get("organizations", j.orgId);
  const tracked = user ? await store.find("job_applications", { userId: user.id, jobId: j.id }) : null;
  const tooYoung = user?.ageGroup === "minor" && (j.minAge ?? 0) >= 18;
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link href="/jobs" className="text-sm text-brand hover:underline">← Internships & Jobs</Link>
      <Card className="mt-3 p-6">
        {j.status !== "approved" && <div className="mb-3"><Notice tone="amber">This listing is {j.status} and not visible to students.</Notice></div>}
        <h1 className="text-2xl font-bold">{j.title}</h1>
        <p className="mt-1"><Link href={`/organizations/${j.orgId}`} className="font-medium hover:text-brand">{org?.name}</Link> <OrgVerified verified={org?.verified} /> {org?.verified ? <span className="text-xs text-muted">Verified employer</span> : <span className="text-xs text-amber-600">Unverified employer</span>}</p>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted"><MapPin className="h-4 w-4" /> {j.location} · {label(j.arrangement)}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge tone={j.paid ? "green" : "amber"}>{j.paid ? j.payText : "Unpaid internship"}</Badge><Badge>{j.schedule}</Badge><Badge>{j.category}</Badge>
          {j.minAge && <Badge>Minimum age {j.minAge}</Badge>}<Badge>{label(j.level)}</Badge>{j.isDemo && <DemoBadge label="Demo listing — fictional employer" />}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {j.url ? <a href={j.url} target="_blank" rel="noopener noreferrer" className="btn-primary">Apply on employer's site <Ext className="h-4 w-4" /></a> : <span className="btn-primary pointer-events-none opacity-60" aria-disabled>No application link (demo)</span>}
          {user ? (tracked ? (
            <>
              <Link href="/my-jobs" className="btn-secondary">Tracking: {label(tracked.status)}</Link>
              <ActionButton className="btn-ghost" action={untrackJob.bind(null, j.id)}>Stop tracking</ActionButton>
            </>
          ) : <ActionButton className="btn-secondary" action={trackJob.bind(null, j.id, "saved")}>Save</ActionButton>) : <Link href={`/login?next=/jobs/${j.id}`} className="btn-secondary">Sign in to save</Link>}
        </div>
        {tooYoung && <div className="mt-3"><Notice tone="amber">This opportunity requires applicants 18 or older.</Notice></div>}
        <dl className="mt-6 grid gap-2 text-sm sm:grid-cols-2">
          <div><dt className="text-muted">Posted</dt><dd>{formatDate(j.createdAt)}</dd></div>
          <div><dt className="text-muted">Application deadline</dt><dd>{formatDate(j.deadline)}</dd></div>
        </dl>
        <h2 className="mt-6 font-semibold">About the role</h2><p className="mt-1 text-sm">{j.description}</p>
        {j.responsibilities.length > 0 && <><h2 className="mt-4 font-semibold">Responsibilities</h2><ul className="mt-1 list-disc pl-5 text-sm">{j.responsibilities.map((r) => <li key={r}>{r}</li>)}</ul></>}
        {j.qualifications.length > 0 && <><h2 className="mt-4 font-semibold">Qualifications & requirements</h2><ul className="mt-1 list-disc pl-5 text-sm">{j.qualifications.map((r) => <li key={r}>{r}</li>)}</ul></>}
        <p className="mt-6 text-xs text-muted">Never pay to apply for a job, and never share bank details or your SSN before you've verified an employer. Employers on NextStep never see your private academic records.</p>
        {user && <div className="mt-3"><ReportButton targetType="job" targetId={j.id} label="Report suspicious listing" reasons={["Fake or fraudulent listing", "Asks for payment", "Inappropriate for students", "Other"]} /></div>}
      </Card>
    </div>
  );
}
