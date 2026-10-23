import type { Metadata } from "next";
import Link from "next/link";
import { trackJob, untrackJob } from "@/app/actions/planning";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { ActionButton } from "@/components/client-ui";
import { Card, DemoBadge, EmptyState, PageHeader, StatusPill } from "@/components/ui";
import type { JobAppStatus } from "@/lib/types";

export const metadata: Metadata = { title: "My job tracker" };
const STATUSES: [JobAppStatus, string][] = [["saved", "Saved"], ["applied", "Applied"], ["interviewing", "Interviewing"], ["offer", "Offer"], ["not_selected", "Not selected"]];

export default async function MyJobs() {
  const user = await requireUser();
  const store = await db();
  const [apps, jobs, orgs] = await Promise.all([store.all("job_applications", { userId: user.id }), store.all("jobs"), store.all("organizations")]);
  const items = apps.map((a) => ({ a, j: jobs.find((j) => j.id === a.jobId)! })).filter((x) => x.j);
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <PageHeader eyebrow="Job Application Tracker" title="My internships & jobs" action={<Link href="/jobs" className="btn-primary">Find opportunities</Link>} />
      {items.length === 0 ? <Card><EmptyState title="No saved opportunities" action={<Link href="/internships" className="btn-primary">Browse internships</Link>} /></Card> : (
        <div className="space-y-3">{items.map(({ a, j }) => (
          <Card key={a.id} className="p-4">
            <div className="flex flex-wrap justify-between gap-2"><div><Link href={`/jobs/${j.id}`} className="font-semibold hover:text-brand">{j.title}</Link><p className="text-xs text-muted">{orgs.find((o) => o.id === j.orgId)?.name} · Apply by {formatDate(j.deadline)}</p>{j.isDemo && <DemoBadge />}</div><StatusPill status={a.status} /></div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {STATUSES.map(([k, l]) => <ActionButton key={k} className={k === a.status ? "btn-primary btn-sm" : "btn-ghost btn-sm border border-line"} action={trackJob.bind(null, j.id, k)}>{l}</ActionButton>)}
              <ActionButton className="btn-ghost btn-sm text-red-600" action={untrackJob.bind(null, j.id)}>Remove</ActionButton>
            </div>
          </Card>
        ))}</div>
      )}
    </div>
  );
}
