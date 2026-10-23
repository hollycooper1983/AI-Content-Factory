import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink as Ext } from "lucide-react";
import { trackScholarship, untrackScholarship } from "@/app/actions/planning";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { ActionButton } from "@/components/client-ui";
import { Card, EmptyState, PageHeader, StatusPill } from "@/components/ui";
import type { ScholarshipAppStatus } from "@/lib/types";

export const metadata: Metadata = { title: "My scholarships" };
const STATUSES: [ScholarshipAppStatus, string][] = [["saved", "Saved"], ["preparing", "Preparing"], ["submitted", "Submitted"], ["awarded", "Awarded"], ["not_awarded", "Not Awarded"]];

export default async function MyScholarships() {
  const user = await requireUser();
  const store = await db();
  const [apps, all] = await Promise.all([store.all("scholarship_applications", { userId: user.id }), store.all("scholarships")]);
  const items = apps.map((a) => ({ a, s: all.find((x) => x.id === a.scholarshipId)! })).filter((x) => x.s);
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <PageHeader eyebrow="Scholarship Tracker" title="My scholarships" subtitle="Track every scholarship from saved to awarded." action={<><Link href="/applications/essays" className="btn-secondary">Scholarship essay assistant</Link><Link href="/scholarships" className="btn-primary">Find more</Link></>} />
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {STATUSES.map(([k, l]) => <Card key={k} className="p-3 text-center"><p className="text-xl font-bold">{items.filter((x) => x.a.status === k).length}</p><p className="text-xs text-muted">{l}</p></Card>)}
      </div>
      {items.length === 0 ? <Card><EmptyState title="Nothing tracked yet" action={<Link href="/scholarships" className="btn-primary">Browse scholarships</Link>} /></Card> : (
        <div className="space-y-3">
          {items.map(({ a, s }) => (
            <Card key={a.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><p className="font-semibold">{s.name}</p><p className="text-xs text-muted">{s.sponsor} · {s.deadline ? `Deadline ${formatDate(s.deadline)}` : s.deadlineNote}</p></div>
                <StatusPill status={a.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {STATUSES.map(([k, l]) => <ActionButton key={k} className={k === a.status ? "btn-primary btn-sm" : "btn-ghost btn-sm border border-line"} action={trackScholarship.bind(null, s.id, k)}>{l}</ActionButton>)}
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm">Official site <Ext className="h-3.5 w-3.5" /></a>
                <ActionButton className="btn-ghost btn-sm text-red-600" confirm="Stop tracking?" action={untrackScholarship.bind(null, s.id)}>Remove</ActionButton>
              </div>
            </Card>
          ))}
        </div>
      )}
      <p className="mt-6 text-xs text-muted">Deadline reminders appear in your <Link href="/calendar" className="link">calendar</Link> and notifications. Email reminders start working once an email provider is configured.</p>
    </div>
  );
}
