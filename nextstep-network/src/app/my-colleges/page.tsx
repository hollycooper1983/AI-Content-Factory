import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { addCollegeToTracker } from "@/app/actions/planning";
import { toggleSave } from "@/app/actions/social";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { label } from "@/lib/format";
import { ActionButton } from "@/components/client-ui";
import { Card, EmptyState, PageHeader, StatusPill, VerificationBadge } from "@/components/ui";

export const metadata: Metadata = { title: "My colleges" };

export default async function MyColleges() {
  const user = await requireUser();
  const store = await db();
  const [saved, colleges, apps] = await Promise.all([store.all("saved_items", { userId: user.id, kind: "college" }), store.all("colleges"), store.all("college_applications", { userId: user.id })]);
  const list = saved.map((s) => colleges.find((c) => c.id === s.refId)).filter(Boolean) as typeof colleges;
  const appMap = new Map(apps.map((a) => [a.collegeId, a]));
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <PageHeader eyebrow="My Colleges" title="Saved colleges" subtitle="Your shortlist. Compare them, then add the ones you'll apply to into your Application Tracker."
        action={list.length > 1 ? <Link href={`/colleges/compare?ids=${list.slice(0, 4).map((c) => c.id).join(",")}`} className="btn-primary">Compare {Math.min(4, list.length)}</Link> : undefined} />
      {list.length === 0 ? <Card><EmptyState icon={<GraduationCap className="h-5 w-5" />} title="No saved colleges" action={<Link href="/colleges" className="btn-primary">Find colleges</Link>} /></Card> : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((c) => {
            const a = appMap.get(c.id);
            return (
              <Card key={c.id} className="p-4">
                <Link href={`/colleges/${c.id}`} className="font-semibold hover:text-brand">{c.name}</Link>
                <p className="text-xs text-muted">{c.city}, {c.state} · {label(c.type)}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">{a ? <StatusPill status={a.status} /> : null}<VerificationBadge v={c.verification} showDate={false} /></div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {a ? <Link href="/applications" className="btn-secondary btn-sm">View application</Link> : <ActionButton className="btn-secondary btn-sm" action={addCollegeToTracker.bind(null, c.id)}>Add to tracker</ActionButton>}
                  <ActionButton className="btn-ghost btn-sm" action={toggleSave.bind(null, "college", c.id, "/my-colleges")}>Remove</ActionButton>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
