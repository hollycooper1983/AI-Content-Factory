import type { Metadata } from "next";
import Link from "next/link";
import { removeConnection, startConversation, toggleFollow } from "@/app/actions/social";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canMessage, canRequestConnection } from "@/lib/permissions";
import { actorOf, connectionIds, discoverableMembers, membersById, type Member } from "@/lib/queries";
import { ActionButton, Avatar } from "@/components/client-ui";
import { MemberCard } from "@/components/member-card";
import { Badge, Card, CardHeader, EmptyState, Notice, OrgVerified } from "@/components/ui";

export const metadata: Metadata = { title: "My Network" };

export default async function Network() {
  const user = await requireUser();
  const store = await db();
  const [conns, profile, pendingIn, pendingOut, follows, orgs, groups, myGroups, apps] = await Promise.all([
    connectionIds(user.id), store.find("profiles", { userId: user.id }), store.all("connections", { addresseeId: user.id, status: "pending" }),
    store.all("connections", { requesterId: user.id, status: "pending" }), store.all("follows", { userId: user.id }), store.all("organizations"),
    store.all("groups"), store.all("group_members", { userId: user.id }), store.all("college_applications"),
  ]);
  const connected = [...(await membersById(conns)).values()];
  const outIds = new Set(pendingOut.map((p) => p.addresseeId));
  const discover = (await discoverableMembers(user)).filter((m) => m.user.id !== user.id && !conns.has(m.user.id) && !outIds.has(m.user.id));
  const can = (m: Member) => canRequestConnection(actorOf(user), actorOf(m.user), { blocked: false });
  const mySchool = discover.filter((m) => profile?.school && m.profile?.school === profile.school);
  const interests = (profile?.careerInterests ?? []).map((i) => i.toLowerCase());
  const sameMajor = discover.filter((m) => !mySchool.includes(m) && (m.profile?.careerInterests ?? []).some((i) => interests.includes(i.toLowerCase())) && m.user.role === "student");
  const myTargets = new Set(apps.filter((a) => a.userId === user.id).map((a) => a.collegeId));
  const sameTarget = discover.filter((m) => apps.some((a) => a.userId === m.user.id && myTargets.has(a.collegeId)));
  const mentors = discover.filter((m) => ["mentor", "counselor"].includes(m.user.role) && m.user.verified);
  const followed = new Set(follows.map((f) => f.orgId));
  const orgList = orgs.filter((o) => o.type !== "college").slice(0, 6);
  const colleges = orgs.filter((o) => o.type === "college").slice(0, 6);
  const joined = new Set(myGroups.map((g) => g.groupId));
  const section = (title: string, list: Member[]) => list.length > 0 && (
    <Card><CardHeader title={title} /><div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">{list.slice(0, 6).map((m) => { const c = can(m); return <MemberCard key={m.user.id} m={m} canConnect={c.ok} reason={c.reason} />; })}</div></Card>
  );
  return (
    <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <Card className="p-4">
          <h1 className="font-semibold">Manage my network</h1>
          <ul className="mt-3 space-y-1 text-sm">
            <li><a href="#connections" className="flex justify-between rounded px-2 py-1.5 hover:bg-canvas"><span>Connections</span><span className="font-semibold">{conns.size}</span></a></li>
            <li><Link href="/network/invitations" className="flex justify-between rounded px-2 py-1.5 hover:bg-canvas"><span>Pending invitations</span><span className="font-semibold">{pendingIn.length}</span></Link></li>
            <li><Link href="/groups" className="flex justify-between rounded px-2 py-1.5 hover:bg-canvas"><span>Groups</span><span className="font-semibold">{joined.size}</span></Link></li>
            <li><a href="#following" className="flex justify-between rounded px-2 py-1.5 hover:bg-canvas"><span>Following</span><span className="font-semibold">{followed.size}</span></a></li>
          </ul>
        </Card>
        {user.ageGroup === "minor" && <Notice tone="blue" title="Your safety settings">You can connect with other students under 18 and with verified mentors and counselors. Adults can't send you requests, and direct messaging is off for members under 18.</Notice>}
      </aside>
      <div className="min-w-0 space-y-4">
        {pendingIn.length > 0 && <Card className="flex items-center justify-between p-4"><p className="text-sm"><strong>{pendingIn.length}</strong> pending invitation{pendingIn.length > 1 ? "s" : ""}</p><Link href="/network/invitations" className="btn-secondary btn-sm">Review</Link></Card>}
        <Card>
          <CardHeader title={<span id="connections">My connections ({connected.length})</span>} />
          {connected.length === 0 ? <EmptyState title="No connections yet" body="Connect with classmates, mentors and counselors below." /> : (
            <ul className="divide-y divide-line">{connected.map((m) => {
              const msg = canMessage(actorOf(user), actorOf(m.user), { connected: true, blocked: false });
              return (
                <li key={m.user.id} className="flex items-center gap-3 px-4 py-3">
                  <Link href={`/profile/${m.user.id}`}><Avatar src={m.profile?.avatarUrl} name={m.user.name} size={48} /></Link>
                  <div className="min-w-0 flex-1"><Link href={`/profile/${m.user.id}`} className="font-semibold hover:underline">{m.user.name}</Link><p className="truncate text-xs text-muted">{m.profile?.headline}</p></div>
                  {msg.ok && <ActionButton className="btn-secondary btn-sm" action={startConversation.bind(null, m.user.id)}>Message</ActionButton>}
                  <ActionButton className="btn-ghost btn-sm" confirm={`Remove ${m.user.name} from your connections?`} action={removeConnection.bind(null, m.user.id)}>Remove</ActionButton>
                </li>
              );
            })}</ul>
          )}
        </Card>
        {section("People from my school", mySchool)}
        {section("Students interested in my field", sameMajor)}
        {section("Students with my target colleges", sameTarget)}
        {section("Verified mentors & counselors", mentors)}
        {section("More people you may know", discover.filter((m) => ![...mySchool, ...sameMajor, ...sameTarget, ...mentors].includes(m)))}
        <Card id="following">
          <CardHeader title="Colleges & organizations to follow" />
          <ul className="grid gap-2 p-4 sm:grid-cols-2">
            {[...orgList, ...colleges].map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-2 rounded-lg border border-line p-3">
                <div className="min-w-0"><Link href={`/organizations/${o.id}`} className="block truncate text-sm font-semibold hover:text-brand">{o.name} <OrgVerified verified={o.verified} /></Link><p className="text-xs capitalize text-muted">{o.type}</p></div>
                <ActionButton className={followed.has(o.id) ? "btn-ghost btn-sm" : "btn-secondary btn-sm"} action={toggleFollow.bind(null, o.id)}>{followed.has(o.id) ? "Following" : "+ Follow"}</ActionButton>
              </li>
            ))}
          </ul>
          <p className="px-4 pb-4 text-sm"><Link href="/organizations" className="link">See all organizations</Link></p>
        </Card>
        <Card>
          <CardHeader title="Student groups" action={<Link href="/groups" className="text-sm font-semibold text-brand hover:underline">All groups</Link>} />
          <ul className="grid gap-2 p-4 sm:grid-cols-2">{groups.filter((g) => !joined.has(g.id)).slice(0, 6).map((g) => <li key={g.id} className="rounded-lg border border-line p-3"><Link href={`/groups/${g.id}`} className="text-sm font-semibold hover:text-brand">{g.name}</Link>{g.visibility === "private" && <Badge className="ml-2">Private</Badge>}<p className="line-clamp-1 text-xs text-muted">{g.description}</p></li>)}</ul>
        </Card>
      </div>
    </div>
  );
}
