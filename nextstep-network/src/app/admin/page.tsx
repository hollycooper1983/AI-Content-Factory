import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { Card, PageHeader, Stat } from "@/components/ui";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminHome() {
  const store = await db();
  const [users, posts, reports, jobs, orgs, logs, groups, apps] = await Promise.all([store.all("users"), store.all("posts"), store.all("reports", { status: "open" }), store.all("jobs", { status: "pending" }), store.all("organizations"), store.all("audit_logs"), store.all("groups"), store.all("college_applications")]);
  const pendingVerify = users.filter((u) => ["college", "employer", "mentor", "counselor"].includes(u.role) && !u.verified).length;
  const byRole = users.reduce<Record<string, number>>((a, u) => ((a[u.role] = (a[u.role] ?? 0) + 1), a), {});
  const userNames = names(users);
  return (
    <div className="space-y-4">
      <PageHeader title="Platform overview" subtitle={`Database: ${store.kind === "local" ? "local file store (development)" : "Supabase PostgreSQL"}`} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Members" value={Object.values(byRole).reduce((a, b) => a + b, 0)} sub={Object.entries(byRole).map(([k, v]) => `${v} ${k}`).join(" · ")} href="/admin/users" />
        <Stat label="Open reports" value={reports.length} href="/admin/reports" />
        <Stat label="Listings awaiting approval" value={jobs.length} href="/admin/jobs" />
        <Stat label="Accounts awaiting verification" value={pendingVerify} href="/admin/users?filter=pending" />
        <Stat label="Posts" value={posts.filter((p) => !p.removed).length} sub={`${posts.filter((p) => p.removed).length} removed`} />
        <Stat label="Groups" value={groups.length} href="/admin/groups" />
        <Stat label="Organizations" value={orgs.length} sub={`${orgs.filter((o) => o.verified).length} verified`} href="/admin/organizations" />
        <Stat label="Applications tracked" value={apps.length} />
      </div>
      <Card>
        <h2 className="border-b border-line px-4 py-3 font-semibold">Audit log</h2>
        <ul className="max-h-[420px] divide-y divide-line overflow-y-auto text-sm">
          {logs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 100).map((l) => (
            <li key={l.id} className="grid grid-cols-[150px_140px_1fr] gap-2 px-4 py-2"><span className="text-xs text-muted">{formatDate(l.createdAt, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span><span className="truncate">{userNames.get(l.actorId) ?? l.actorId}</span><span className="truncate font-mono text-xs">{l.action} · {l.target}{l.details ? ` · ${l.details}` : ""}</span></li>
          ))}
          {logs.length === 0 && <li className="px-4 py-6 text-muted">No admin actions logged yet.</li>}
        </ul>
      </Card>
      <p className="text-xs text-muted">Analytics shown are simple counts from the database. <Link href="/admin/settings" className="link">System settings</Link></p>
    </div>
  );
}

function names(us: { id: string; name: string }[]) { return new Map(us.map((u) => [u.id, u.name])); }
