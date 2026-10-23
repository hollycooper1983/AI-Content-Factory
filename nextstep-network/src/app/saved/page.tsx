import type { Metadata } from "next";
import Link from "next/link";
import { toggleSave } from "@/app/actions/social";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ActionButton } from "@/components/client-ui";
import { Card, EmptyState, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Saved" };

export default async function Saved() {
  const user = await requireUser();
  const store = await db();
  const [saved, posts, colleges, jobs, schApps, scholarships] = await Promise.all([
    store.all("saved_items", { userId: user.id }), store.all("posts"), store.all("colleges"), store.all("jobs"),
    store.all("scholarship_applications", { userId: user.id }), store.all("scholarships"),
  ]);
  const savedPosts = saved.filter((s) => s.kind === "post").map((s) => posts.find((p) => p.id === s.refId)).filter((p) => p && !p.removed);
  const savedColleges = saved.filter((s) => s.kind === "college" || s.kind === "fee_waiver").map((s) => ({ s, c: colleges.find((c) => c.id === s.refId) })).filter((x) => x.c);
  const savedJobs = (await store.all("job_applications", { userId: user.id })).map((a) => jobs.find((j) => j.id === a.jobId)).filter(Boolean);
  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-6">
      <PageHeader title="My saved opportunities" subtitle="Posts, colleges, scholarships and jobs you've saved." />
      <Card className="p-5"><h2 className="font-semibold">Scholarships ({schApps.length})</h2><ul className="mt-2 space-y-1 text-sm">{schApps.map((a) => <li key={a.id}><Link className="link" href="/my-scholarships">{scholarships.find((s) => s.id === a.scholarshipId)?.name}</Link></li>)}</ul></Card>
      <Card className="p-5"><h2 className="font-semibold">Colleges & fee-waiver alerts ({savedColleges.length})</h2><ul className="mt-2 space-y-1 text-sm">{savedColleges.map(({ s, c }) => <li key={s.id}><Link className="link" href={`/colleges/${c!.id}`}>{c!.name}</Link>{s.kind === "fee_waiver" && <span className="text-xs text-muted"> · fee-waiver alert</span>}</li>)}</ul></Card>
      <Card className="p-5"><h2 className="font-semibold">Internships & jobs ({savedJobs.length})</h2><ul className="mt-2 space-y-1 text-sm">{savedJobs.map((j) => <li key={j!.id}><Link className="link" href={`/jobs/${j!.id}`}>{j!.title}</Link></li>)}</ul></Card>
      <Card className="p-5"><h2 className="font-semibold">Saved posts ({savedPosts.length})</h2>
        {savedPosts.length === 0 ? <EmptyState title="No saved posts" /> : <ul className="mt-2 divide-y divide-line text-sm">{savedPosts.map((p) => <li key={p!.id} className="flex items-start justify-between gap-3 py-2"><p className="line-clamp-2">{p!.body}</p><ActionButton className="btn-ghost btn-sm" action={toggleSave.bind(null, "post", p!.id, "/saved")}>Unsave</ActionButton></li>)}</ul>}
      </Card>
    </div>
  );
}
