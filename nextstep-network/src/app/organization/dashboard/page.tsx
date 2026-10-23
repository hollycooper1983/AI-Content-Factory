import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, Notice, PageHeader, Stat } from "@/components/ui";
import { OrgForm } from "./form";

export const metadata: Metadata = { title: "Organization dashboard" };

export default async function OrgDashboard() {
  const user = await requireUser();
  if (!["employer", "college", "admin"].includes(user.role)) redirect("/dashboard");
  const store = await db();
  const org = user.orgId ? await store.get("organizations", user.orgId) : null;
  const [follows, jobs, posts] = org ? await Promise.all([store.all("follows", { orgId: org.id }), store.all("jobs", { orgId: org.id }), store.all("posts", { orgId: org.id })]) : [[], [], []];
  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6">
      <PageHeader eyebrow="Organization Dashboard" title={org?.name ?? "Set up your organization page"} action={org ? <><Link href={`/organizations/${org.id}`} className="btn-secondary">View page</Link><Link href="/organization/opportunities" className="btn-primary">Post an opportunity</Link></> : undefined} />
      {!user.verified && <Notice tone="amber" title="Verification pending">Our team verifies organizations before they can post opportunities or publish updates as the organization. You can set up your page now.</Notice>}
      {org && <div className="grid gap-3 sm:grid-cols-3"><Stat label="Followers" value={follows.length} /><Stat label="Listings" value={jobs.length} sub={`${jobs.filter((j) => j.status === "pending").length} pending review`} href="/organization/opportunities" /><Stat label="Updates published" value={posts.length} href="/feed" /></div>}
      <Card className="p-5"><h2 className="font-semibold">Organization profile</h2><OrgForm org={org ? { name: org.name, description: org.description, website: org.website, location: org.location } : null} /></Card>
      {org && user.verified && <Notice>Publish announcements from the <Link href="/feed" className="link">home feed</Link> using “Post as {org.name}”. Student applications come through your own official application links — NextStep never shares students' private academic records.</Notice>}
    </div>
  );
}
