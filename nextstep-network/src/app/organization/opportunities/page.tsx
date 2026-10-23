import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { canPostOpportunity } from "@/lib/permissions";
import { actorOf } from "@/lib/queries";
import { Card, EmptyState, Notice, PageHeader, StatusPill } from "@/components/ui";
import { JobForm } from "./form";

export const metadata: Metadata = { title: "Manage opportunities" };

export default async function OrgOpps() {
  const user = await requireUser();
  if (!["employer", "college", "admin"].includes(user.role)) redirect("/dashboard");
  const store = await db();
  const jobs = (await store.all("jobs", { postedById: user.id })).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const allowed = canPostOpportunity(actorOf(user)) && (!!user.orgId || user.role === "admin");
  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6">
      <PageHeader eyebrow="Organization" title="Internships & job postings" action={<Link href="/organization/dashboard" className="btn-ghost">← Dashboard</Link>} />
      {allowed ? <JobForm /> : <Notice tone="amber">{user.orgId ? "Your organization must be verified before posting opportunities." : "Create your organization page first."}</Notice>}
      <Card>
        <h2 className="border-b border-line px-4 py-3 font-semibold">Your listings</h2>
        {jobs.length === 0 ? <EmptyState title="No listings yet" /> : <ul className="divide-y divide-line">{jobs.map((j) => <li key={j.id} className="flex items-center justify-between gap-2 px-4 py-3 text-sm"><div><Link href={`/jobs/${j.id}`} className="font-medium hover:text-brand">{j.title}</Link><p className="text-xs text-muted">Posted {formatDate(j.createdAt)} · Deadline {formatDate(j.deadline)}</p></div><StatusPill status={j.status} /></li>)}</ul>}
      </Card>
    </div>
  );
}
