import Link from "next/link";
import { Bookmark, CalendarDays, ClipboardList, GraduationCap, MapPin, TrendingUp, Users } from "lucide-react";
import { requestConnection } from "@/app/actions/social";
import { joinGroup } from "@/app/actions/social";
import type { SafeUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, label } from "@/lib/format";
import { profileCompletion } from "@/lib/progress";
import { canRequestConnection } from "@/lib/permissions";
import { actorOf, connectionIds, discoverableMembers } from "@/lib/queries";
import type { Profile } from "@/lib/types";
import { Avatar, ResultActionButton, SafeImage } from "./client-ui";
import { Badge, Card, DemoBadge, Progress } from "./ui";

export async function ProfileCard({ user, profile }: { user: SafeUser; profile: Profile | null }) {
  const store = await db();
  const [conns, groups, saved] = await Promise.all([
    connectionIds(user.id),
    store.all("group_members", { userId: user.id, status: "member" }),
    store.all("saved_items", { userId: user.id }),
  ]);
  const { percent } = profileCompletion(profile);
  return (
    <Card className="overflow-hidden">
      <SafeImage src={profile?.bannerUrl ?? ""} alt="" className="h-16 w-full object-cover" />
      <div className="-mt-9 px-4 pb-4 text-center">
        <Link href="/profile" className="inline-block rounded-full ring-4 ring-surface"><Avatar src={profile?.avatarUrl} name={user.name} size={72} /></Link>
        <Link href="/profile" className="mt-2 block font-semibold text-fg hover:underline">{user.name}</Link>
        <p className="mt-0.5 text-xs text-muted">{profile?.headline || "Add a headline"}</p>
        {profile?.school && <p className="mt-2 text-xs text-muted">{profile.school}{profile.gradYear ? ` · Class of ${profile.gradYear}` : ""}</p>}
        {profile && profile.careerInterests.length > 0 && (
          <div className="mt-2 flex flex-wrap justify-center gap-1">{profile.careerInterests.slice(0, 4).map((i) => <span key={i} className="chip">{i}</span>)}</div>
        )}
      </div>
      <div className="border-t border-line px-4 py-3 text-xs">
        <div className="flex items-center justify-between"><span className="text-muted">Profile completion</span><span className="font-semibold text-brand">{percent}%</span></div>
        <div className="mt-1.5"><Progress value={percent} label="Profile completion" /></div>
        {percent < 100 && <Link href="/profile/edit" className="mt-2 block font-semibold text-brand hover:underline">Complete your profile</Link>}
      </div>
      <ul className="border-t border-line py-1 text-xs">
        <li><Link href="/network" className="flex justify-between px-4 py-2 hover:bg-canvas"><span className="flex items-center gap-2 text-muted"><Users className="h-3.5 w-3.5" />Connections</span><span className="font-semibold text-brand">{conns.size}</span></Link></li>
        <li><Link href="/groups" className="flex justify-between px-4 py-2 hover:bg-canvas"><span className="flex items-center gap-2 text-muted"><Users className="h-3.5 w-3.5" />My Groups</span><span className="font-semibold text-brand">{groups.length}</span></Link></li>
        <li><Link href="/saved" className="flex justify-between px-4 py-2 hover:bg-canvas"><span className="flex items-center gap-2 text-muted"><Bookmark className="h-3.5 w-3.5" />Saved Opportunities</span><span className="font-semibold text-brand">{saved.length}</span></Link></li>
        <li><Link href="/applications" className="flex items-center gap-2 px-4 py-2 text-muted hover:bg-canvas"><ClipboardList className="h-3.5 w-3.5" />My Application Dashboard</Link></li>
      </ul>
    </Card>
  );
}

function Widget({ title, href, children, icon }: { title: string; href?: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-fg">{icon}{title}</h2>
        {href && <Link href={href} className="text-xs font-semibold text-brand hover:underline">See all</Link>}
      </div>
      {children}
    </Card>
  );
}

export async function RightRail({ user, profile }: { user: SafeUser; profile: Profile | null }) {
  const store = await db();
  const interests = (profile?.careerInterests ?? []).map((i) => i.toLowerCase());
  const [members, conns, pending, colleges, savedColleges, scholarships, tracked, jobs, events, groups, myGroups, posts, comments] = await Promise.all([
    discoverableMembers(user), connectionIds(user.id), store.all("connections", { requesterId: user.id, status: "pending" }),
    store.all("colleges", { publishStatus: "published" }), store.all("saved_items", { userId: user.id, kind: "college" }),
    store.all("scholarships", { publishStatus: "published" }), store.all("scholarship_applications", { userId: user.id }),
    store.all("jobs", { status: "approved" }), store.all("events"), store.all("groups"), store.all("group_members", { userId: user.id }),
    store.all("posts", { removed: false }), store.all("comments", { removed: false }),
  ]);
  const pendingIds = new Set(pending.map((p) => p.addresseeId));
  const suggestions = members
    .filter((m) => m.user.id !== user.id && !conns.has(m.user.id) && !pendingIds.has(m.user.id))
    .filter((m) => canRequestConnection(actorOf(user), actorOf(m.user), { blocked: false }).ok)
    .map((m) => ({ m, score: (m.profile?.careerInterests ?? []).filter((i) => interests.includes(i.toLowerCase())).length + (m.profile?.school && m.profile.school === profile?.school ? 2 : 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const savedSet = new Set(savedColleges.map((s) => s.refId));
  const collegeMatches = colleges
    .filter((c) => !savedSet.has(c.id))
    .map((c) => ({ c, score: c.majors.filter((m) => interests.some((i) => m.toLowerCase().includes(i))).length + (c.state === profile?.state ? 1 : 0) + (profile?.learningFormat === "online" && c.online ? 1 : 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const trackedIds = new Set(tracked.map((t) => t.scholarshipId));
  const schList = [
    ...scholarships.filter((s) => trackedIds.has(s.id)),
    ...scholarships.filter((s) => !trackedIds.has(s.id) && (s.states.length === 0 || s.states.includes(profile?.state ?? ""))),
  ].slice(0, 3);

  const nearJobs = jobs.filter((j) => j.location.includes(profile?.state ?? "NC") || j.arrangement === "remote").slice(0, 3);
  const orgs = new Map((await store.all("organizations")).map((o) => [o.id, o]));
  const upcoming = events.filter((e) => e.date >= new Date().toISOString().slice(0, 10)).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  const trending = posts
    .filter((p) => p.createdAt > weekAgo && !p.groupId)
    .map((p) => ({ p, n: comments.filter((c) => c.postId === p.id).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 3);
  const mine = new Set(myGroups.map((g) => g.groupId));
  const suggestedGroups = groups
    .filter((g) => !mine.has(g.id))
    .map((g) => ({ g, score: g.tags.filter((t) => interests.some((i) => t.includes(i) || i.includes(t))).length }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <div className="space-y-4">
      <Widget title="Recommended connections" href="/network" icon={<Users className="h-4 w-4 text-brand" />}>
        {suggestions.length === 0 ? <p className="text-xs text-muted">No suggestions right now. Join groups to meet more students.</p> : (
          <ul className="space-y-3">
            {suggestions.map(({ m }) => (
              <li key={m.user.id} className="flex gap-2">
                <Link href={`/profile/${m.user.id}`}><Avatar src={m.profile?.avatarUrl} name={m.user.name} size={40} /></Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/profile/${m.user.id}`} className="block truncate text-sm font-semibold hover:underline">{m.user.name}</Link>
                  <p className="line-clamp-2 text-xs text-muted">{m.profile?.headline}</p>
                  <div className="mt-1.5"><ResultActionButton className="btn-secondary btn-sm" action={requestConnection.bind(null, m.user.id)}>+ Connect</ResultActionButton></div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {user.ageGroup === "minor" && <p className="mt-3 text-[11px] text-muted">For your safety, suggestions only include students under 18 and verified mentors and counselors.</p>}
      </Widget>

      <Widget title="Colleges you may like" href="/colleges" icon={<GraduationCap className="h-4 w-4 text-brand" />}>
        <ul className="space-y-2.5">
          {collegeMatches.map(({ c }) => (
            <li key={c.id}>
              <Link href={`/colleges/${c.id}`} className="block text-sm font-semibold hover:text-brand">{c.name}</Link>
              <p className="text-xs text-muted">{c.city}, {c.state} · {label(c.type)}{c.hbcu ? " · HBCU" : ""}{c.online ? " · Online options" : ""}</p>
            </li>
          ))}
        </ul>
      </Widget>

      <Widget title="Scholarship deadlines" href="/my-scholarships" icon={<CalendarDays className="h-4 w-4 text-brand" />}>
        <ul className="space-y-2.5">
          {schList.map((s) => (
            <li key={s.id}>
              <Link href={`/scholarships?q=${encodeURIComponent(s.name)}`} className="block text-sm font-semibold hover:text-brand">{s.name}</Link>
              <p className="text-xs text-muted">{s.deadline ? formatDate(s.deadline) : s.deadlineNote}</p>
              {trackedIds.has(s.id) && <Badge tone="teal" className="mt-1">Tracking</Badge>}
            </li>
          ))}
        </ul>
      </Widget>

      <Widget title="Internships near you" href="/internships" icon={<MapPin className="h-4 w-4 text-brand" />}>
        <ul className="space-y-2.5">
          {nearJobs.map((j) => (
            <li key={j.id}>
              <Link href={`/jobs/${j.id}`} className="block text-sm font-semibold hover:text-brand">{j.title}</Link>
              <p className="text-xs text-muted">{orgs.get(j.orgId)?.name} · {j.location}</p>
              {j.isDemo && <DemoBadge />}
            </li>
          ))}
        </ul>
      </Widget>

      {trending.length > 0 && (
        <Widget title="Trending student discussions" icon={<TrendingUp className="h-4 w-4 text-brand" />}>
          <ul className="space-y-2.5">
            {trending.map(({ p, n }) => (
              <li key={p.id}><Link href={`/feed#post-${p.id}`} className="line-clamp-2 text-sm hover:text-brand">{p.body}</Link><p className="text-xs text-muted">{n} comment{n === 1 ? "" : "s"}</p></li>
            ))}
          </ul>
        </Widget>
      )}

      <Widget title="Upcoming events" href="/calendar" icon={<CalendarDays className="h-4 w-4 text-brand" />}>
        <ul className="space-y-2.5">
          {upcoming.map((e) => (
            <li key={e.id} className="flex gap-3">
              <div className="w-11 shrink-0 rounded-lg bg-brand-50 py-1 text-center dark:bg-brand/15">
                <p className="text-[10px] font-semibold uppercase text-brand">{formatDate(e.date, { month: "short" })}</p>
                <p className="text-sm font-bold text-fg">{formatDate(e.date, { day: "numeric" })}</p>
              </div>
              <div><p className="text-sm font-semibold">{e.title}</p><p className="text-xs text-muted">{e.location}</p></div>
            </li>
          ))}
        </ul>
      </Widget>

      <Widget title="Suggested groups" href="/groups" icon={<Users className="h-4 w-4 text-brand" />}>
        <ul className="space-y-3">
          {suggestedGroups.map(({ g }) => (
            <li key={g.id}>
              <Link href={`/groups/${g.id}`} className="block text-sm font-semibold hover:text-brand">{g.name}</Link>
              <p className="line-clamp-1 text-xs text-muted">{g.description}</p>
              <div className="mt-1.5"><ResultActionButton className="btn-secondary btn-sm" action={joinGroup.bind(null, g.id)}>{g.visibility === "private" ? "Request to join" : "Join"}</ResultActionButton></div>
            </li>
          ))}
        </ul>
      </Widget>
      <p className="px-2 text-center text-[11px] text-muted">
        <Link href="/about" className="hover:underline">About</Link> · <Link href="/help" className="hover:underline">Help</Link> · <Link href="/help#privacy" className="hover:underline">Privacy</Link> · <Link href="/help#guidelines" className="hover:underline">Guidelines</Link>
      </p>
    </div>
  );
}
