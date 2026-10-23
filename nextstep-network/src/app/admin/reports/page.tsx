import type { Metadata } from "next";
import Link from "next/link";
import { resolveReport } from "@/app/actions/admin";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { ActionButton } from "@/components/client-ui";
import { Card, EmptyState, PageHeader, StatusPill } from "@/components/ui";

export const metadata: Metadata = { title: "Admin · Reports" };

export default async function AdminReports({ searchParams }: { searchParams: { all?: string } }) {
  const store = await db();
  const [reports, users, posts, comments, jobs] = await Promise.all([store.all("reports"), store.all("users"), store.all("posts"), store.all("comments"), store.all("jobs")]);
  const list = reports.filter((r) => searchParams.all || r.status === "open").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const preview = (t: string, id: string) =>
    t === "post" ? posts.find((p) => p.id === id)?.body : t === "comment" ? comments.find((c) => c.id === id)?.body : t === "job" ? jobs.find((j) => j.id === id)?.title : t === "user" ? users.find((u) => u.id === id)?.name : `Conversation ${id.slice(0, 8)} (open only if necessary for safety review)`;
  const removeLabel: Record<string, string> = { post: "Remove post", comment: "Remove comment", job: "Reject listing", user: "Suspend user", message: "Mark resolved", group: "Mark resolved" };
  return (
    <div className="space-y-4">
      <PageHeader title="Reported content" subtitle="Review reports from members. Removing content hides it everywhere; suspending a user signs them out." action={<Link href={searchParams.all ? "/admin/reports" : "/admin/reports?all=1"} className="btn-ghost">{searchParams.all ? "Open only" : "Show all"}</Link>} />
      {list.length === 0 ? <Card><EmptyState title="No open reports" /></Card> : (
        <div className="space-y-3">{list.map((r) => (
          <Card key={r.id} className="p-4 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold capitalize">{r.targetType} · {r.reason}</p><p className="text-xs text-muted">Reported by {users.find((u) => u.id === r.reporterId)?.name} · {timeAgo(r.createdAt)}</p></div><StatusPill status={r.status} /></div>
            <p className="mt-2 line-clamp-3 rounded bg-canvas p-2">{preview(r.targetType, r.targetId) ?? "(content no longer exists)"}</p>
            {r.status === "open" && <div className="mt-3 flex gap-2"><ActionButton className="btn-danger btn-sm" confirm="Take action on this content?" action={resolveReport.bind(null, r.id, "resolve_remove")}>{removeLabel[r.targetType]}</ActionButton><ActionButton className="btn-ghost btn-sm" action={resolveReport.bind(null, r.id, "dismiss")}>Dismiss</ActionButton></div>}
          </Card>
        ))}</div>
      )}
    </div>
  );
}
