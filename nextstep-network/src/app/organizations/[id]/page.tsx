import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { toggleFollow } from "@/app/actions/social";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, timeAgo } from "@/lib/format";
import { ActionButton } from "@/components/client-ui";
import { Badge, Card, DemoBadge, EmptyState, ExternalLink, Notice, OrgVerified } from "@/components/ui";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return { title: (await (await db()).get("organizations", params.id))?.name ?? "Organization" };
}

export default async function Org({ params }: { params: { id: string } }) {
  const store = await db();
  const o = await store.get("organizations", params.id);
  if (!o) notFound();
  const user = await getCurrentUser();
  const [follows, posts, jobs, events, following] = await Promise.all([
    store.all("follows", { orgId: o.id }), store.all("posts", { orgId: o.id, removed: false }), store.all("jobs", { orgId: o.id, status: "approved" }), store.all("events", { orgId: o.id }),
    user ? store.find("follows", { userId: user.id, orgId: o.id }) : Promise.resolve(null),
  ]);
  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6">
      <Card className="overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-navy via-brand to-teal" />
        <div className="px-5 pb-5">
          <div className="-mt-10 flex h-20 w-20 items-center justify-center rounded-xl border-4 border-surface bg-navy text-2xl font-bold text-white">{o.name.slice(0, 2).toUpperCase()}</div>
          <h1 className="mt-3 flex items-center gap-2 text-2xl font-bold">{o.name} <OrgVerified verified={o.verified} /></h1>
          <p className="text-sm capitalize text-muted">{o.type} · {o.location} · {follows.length} followers</p>
          <div className="mt-2 flex gap-1">{o.verified ? <Badge tone="blue">Verified organization</Badge> : <Badge tone="amber">{o.type === "college" ? "Unclaimed page" : "Not yet verified"}</Badge>}{o.isDemo && <DemoBadge label="Fictional demo organization" />}</div>
          <p className="mt-3 text-sm">{o.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {user ? <ActionButton className={following ? "btn-secondary" : "btn-primary"} action={toggleFollow.bind(null, o.id)}>{following ? "Following ✓" : "+ Follow"}</ActionButton> : <Link href="/login" className="btn-primary">Sign in to follow</Link>}
            {o.website && (o.website.startsWith("/") ? <Link href={o.website} className="btn-ghost">Website</Link> : <a href={o.website} target="_blank" rel="noopener noreferrer" className="btn-ghost">Official website</a>)}
            {o.collegeId && <Link href={`/colleges/${o.collegeId}`} className="btn-ghost">College profile</Link>}
          </div>
        </div>
      </Card>
      {!o.verified && o.type === "college" && <Notice>This page is built from public information. If you represent this institution, sign up with a college account to request verification.</Notice>}
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="p-5">
          <h2 className="font-semibold">Updates</h2>
          {posts.length === 0 ? <EmptyState title="No updates yet" /> : <ul className="mt-2 divide-y divide-line">{posts.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((p) => <li key={p.id} className="py-3 text-sm"><p className="text-xs text-muted">{timeAgo(p.createdAt)}</p><p className="mt-1 whitespace-pre-wrap">{p.body}</p>{p.link && (p.link.startsWith("/") ? <Link href={p.link} className="link">{p.link}</Link> : <ExternalLink href={p.link}>{p.link}</ExternalLink>)}</li>)}</ul>}
        </Card>
        <aside className="space-y-4">
          <Card className="p-4"><h2 className="font-semibold">Opportunities</h2>{jobs.length === 0 ? <p className="mt-1 text-sm text-muted">No open listings.</p> : <ul className="mt-2 space-y-2 text-sm">{jobs.map((j) => <li key={j.id}><Link href={`/jobs/${j.id}`} className="font-medium hover:text-brand">{j.title}</Link><p className="text-xs text-muted">{j.location} · Apply by {formatDate(j.deadline)}</p></li>)}</ul>}</Card>
          {events.length > 0 && <Card className="p-4"><h2 className="font-semibold">Events</h2><ul className="mt-2 space-y-1 text-sm">{events.map((e) => <li key={e.id}>{formatDate(e.date)} — {e.title}</li>)}</ul></Card>}
        </aside>
      </div>
    </div>
  );
}
