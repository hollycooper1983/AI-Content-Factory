import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, ShieldCheck, Users } from "lucide-react";
import { approveMember, joinGroup, leaveGroup } from "@/app/actions/social";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { blockedIds, hydratePosts, membersById } from "@/lib/queries";
import { ActionButton, Avatar, ResultActionButton } from "@/components/client-ui";
import { Composer } from "@/components/composer";
import { PostCard } from "@/components/post-card";
import { Badge, Card, EmptyState, ExternalLink } from "@/components/ui";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return { title: (await (await db()).get("groups", params.id))?.name ?? "Group" };
}

export default async function GroupPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const store = await db();
  const g = await store.get("groups", params.id);
  if (!g) notFound();
  const [members, profile, blocked] = await Promise.all([store.all("group_members", { groupId: g.id }), store.find("profiles", { userId: user.id }), blockedIds(user.id)]);
  const me = members.find((m) => m.userId === user.id);
  const isMember = me?.status === "member";
  const isMod = user.role === "admin" || me?.role === "admin" || me?.role === "moderator";
  const canSee = g.visibility === "public" || isMember || user.role === "admin";
  const active = members.filter((m) => m.status === "member");
  const pending = members.filter((m) => m.status === "pending");
  const people = await membersById([...active, ...pending].map((m) => m.userId).concat(g.adminId));
  const posts = canSee ? (await store.all("posts", { groupId: g.id, removed: false })).filter((p) => !blocked.has(p.authorId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 30) : [];
  const items = await hydratePosts(posts, user.id);
  return (
    <div className="mx-auto grid max-w-6xl gap-5 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-4">
        <Card className="overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-navy via-brand to-teal" />
          <div className="p-5">
            <h1 className="text-2xl font-bold">{g.name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">{g.visibility === "private" ? <><Lock className="h-4 w-4" /> Private group</> : "Public group"} · <Users className="h-4 w-4" /> {active.length} members {g.adultsOnly && <Badge tone="amber">18+</Badge>}</p>
            <p className="mt-2 text-sm">{g.description}</p>
            <div className="mt-3 flex gap-2">
              {isMember ? (me?.role === "member" && <ActionButton className="btn-ghost btn-sm" confirm="Leave this group?" action={leaveGroup.bind(null, g.id)}>Leave group</ActionButton>)
                : me?.status === "pending" ? <span className="text-sm text-muted">Your request is pending approval.</span>
                : <ResultActionButton className="btn-primary" action={joinGroup.bind(null, g.id)}>{g.visibility === "private" ? "Request to join" : "Join group"}</ResultActionButton>}
            </div>
          </div>
        </Card>
        {isMember && <Composer name={user.name} avatar={profile?.avatarUrl ?? ""} groupId={g.id} />}
        {!canSee ? <Card><EmptyState icon={<Lock className="h-5 w-5" />} title="Members only" body="Request to join to see this group's discussions." /></Card>
          : items.length === 0 ? <Card><EmptyState title="No discussions yet" body={isMember ? "Start the first conversation." : "Join to start a discussion."} /></Card>
          : items.map((it) => <PostCard key={it.post.id} item={it} viewerId={user.id} isAdmin={isMod} />)}
      </div>
      <aside className="space-y-4">
        {isMod && pending.length > 0 && (
          <Card className="p-4">
            <h2 className="font-semibold">Join requests ({pending.length})</h2>
            <ul className="mt-2 space-y-2">{pending.map((m) => { const p = people.get(m.userId); return <li key={m.id} className="flex items-center gap-2 text-sm"><Avatar src={p?.profile?.avatarUrl} name={p?.user.name ?? "?"} size={28} /><span className="flex-1 truncate">{p?.user.name}</span><ActionButton className="btn-secondary btn-sm" action={approveMember.bind(null, m.id, true)}>Approve</ActionButton><ActionButton className="btn-ghost btn-sm" action={approveMember.bind(null, m.id, false)}>Decline</ActionButton></li>; })}</ul>
          </Card>
        )}
        <Card className="p-4 text-sm">
          <h2 className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4 text-teal" /> Community rules</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted">{g.rules.map((r) => <li key={r}>{r}</li>)}</ol>
          <p className="mt-3 text-xs text-muted">Admin: <Link href={`/profile/${g.adminId}`} className="link">{people.get(g.adminId)?.user.name}</Link>. Report posts using the ⋯ menu.</p>
        </Card>
        <Card className="p-4 text-sm"><h2 className="font-semibold">Resources</h2><ul className="mt-2 space-y-1">{g.resources.map((r) => <li key={r.url}><ExternalLink href={r.url}>{r.label}</ExternalLink></li>)}</ul></Card>
        {canSee && <Card className="p-4"><h2 className="font-semibold">Members</h2><ul className="mt-2 space-y-2">{active.slice(0, 10).map((m) => { const p = people.get(m.userId); return p && <li key={m.id} className="flex items-center gap-2 text-sm"><Avatar src={p.profile?.avatarUrl} name={p.user.name} size={28} /><Link href={`/profile/${p.user.id}`} className="truncate hover:underline">{p.user.name}</Link>{m.role !== "member" && <Badge tone="blue">{m.role}</Badge>}</li>; })}</ul></Card>}
      </aside>
    </div>
  );
}
