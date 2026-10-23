import Link from "next/link";
import { Award, BadgeCheck, Briefcase, FolderGit2, GraduationCap, HandHeart, Lock, MapPin, Medal, Pencil, Sparkles, Users } from "lucide-react";
import { blockUser, removeConnection, requestConnection, startConversation } from "@/app/actions/social";
import { db } from "@/lib/db";
import { label, timeAgo } from "@/lib/format";
import { profileCompletion } from "@/lib/progress";
import { connectionIds, membersById } from "@/lib/queries";
import type { SafeUser } from "@/lib/auth";
import type { Entry, Profile, User } from "@/lib/types";
import { ActionButton, Avatar, ResultActionButton, SafeImage } from "./client-ui";
import { ReportButton } from "./report-button";
import { Badge, Card, Progress } from "./ui";

function Section({ title, icon, children, editHref }: { title: string; icon: React.ReactNode; children: React.ReactNode; editHref?: string }) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">{icon}{title}</h2>
        {editHref && <Link href={editHref} aria-label={`Edit ${title}`} className="rounded-full p-2 text-muted hover:bg-canvas"><Pencil className="h-4 w-4" /></Link>}
      </div>
      {children}
    </Card>
  );
}

function Entries({ items, empty }: { items: Entry[]; empty: string }) {
  if (!items.length) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <ul className="divide-y divide-line">
      {items.map((e, i) => (
        <li key={i} className="py-3 first:pt-0 last:pb-0">
          <p className="font-semibold text-fg">{e.title}</p>
          {e.org && <p className="text-sm text-fg">{e.org}</p>}
          {(e.start || e.end) && <p className="text-xs text-muted">{[e.start, e.end].filter(Boolean).join(" – ")}</p>}
          {e.description && <p className="mt-1 text-sm text-muted">{e.description}</p>}
        </li>
      ))}
    </ul>
  );
}

export async function ProfileView({ owner, profile, viewer, isSelf, connected, publicPreview = false }: {
  owner: Omit<User, "passwordHash">; profile: Profile; viewer: SafeUser | null; isSelf: boolean; connected: boolean; publicPreview?: boolean;
}) {
  const store = await db();
  const edit = isSelf && !publicPreview;
  const conns = await connectionIds(owner.id);
  const [follows, groupsM, groups, posts, pending] = await Promise.all([
    store.all("follows", { userId: owner.id }), store.all("group_members", { userId: owner.id, status: "member" }), store.all("groups"),
    store.all("posts", { authorId: owner.id, removed: false }),
    viewer ? store.find("connections", { requesterId: viewer.id, addresseeId: owner.id, status: "pending" }) : Promise.resolve(null),
  ]);
  const orgIds = new Set(follows.map((f) => f.orgId));
  const orgs = (await store.all("organizations")).filter((o) => orgIds.has(o.id));
  const myGroups = groups.filter((g) => groupsM.some((m) => m.groupId === g.id));
  const connMembers = [...(await membersById([...conns].slice(0, 6))).values()];
  const recent = posts.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
  const { percent, missing } = profileCompletion(profile);
  const verifiedPro = owner.verified && ["mentor", "counselor", "employer", "college"].includes(owner.role);
  const e = (k: string) => (edit ? `/profile/edit#${k}` : undefined);

  return (
    <div className="mx-auto grid max-w-6xl gap-5 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-4">
        {publicPreview && (
          <div className="rounded-xl border border-brand-100 bg-brand-50 p-3 text-sm text-navy dark:border-brand/30 dark:bg-brand/10 dark:text-blue-100">
            This is how your profile appears to {profile.visibility === "public" ? "signed-in members" : profile.visibility === "network" ? "your connections" : "only you (your profile is private)"}. <Link className="link" href="/profile">Back to my profile</Link>
          </div>
        )}
        <Card className="overflow-hidden">
          <SafeImage src={profile.bannerUrl} alt="" className="h-36 w-full object-cover sm:h-48" />
          <div className="px-5 pb-5">
            <div className="-mt-16 flex items-end justify-between">
              <div className="rounded-full ring-4 ring-surface"><Avatar src={profile.avatarUrl} name={owner.name} size={128} /></div>
              {edit && <Link href="/profile/edit" className="btn-ghost mt-20" aria-label="Edit profile"><Pencil className="h-4 w-4" /> Edit profile</Link>}
            </div>
            <h1 className="mt-3 flex flex-wrap items-center gap-2 text-2xl font-bold">
              {owner.name}
              {verifiedPro && <Badge tone="blue"><BadgeCheck className="h-3 w-3" /> Verified {label(owner.role)}</Badge>}
            </h1>
            <p className="mt-1 text-[15px] text-fg">{profile.headline || (edit ? <span className="text-muted">Add a professional headline</span> : null)}</p>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              {profile.school && <span className="flex items-center gap-1"><GraduationCap className="h-4 w-4" />{profile.school}</span>}
              {(profile.city || profile.state) && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{[profile.city, profile.state].filter(Boolean).join(", ")}</span>}
              {profile.gradYear && <span>Class of {profile.gradYear}</span>}
            </p>
            <p className="mt-2 text-sm"><Link href={isSelf ? "/network" : "#connections"} className="font-semibold text-brand hover:underline">{conns.size} connection{conns.size === 1 ? "" : "s"}</Link></p>
            {profile.careerInterests.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">{profile.careerInterests.map((i) => <Badge key={i} tone="teal">{i}</Badge>)}</div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {edit ? (
                <>
                  <Link href="/profile/edit" className="btn-primary">Edit profile</Link>
                  <Link href="/profile/preview" className="btn-secondary">View public profile</Link>
                  <Link href="/settings#privacy" className="btn-ghost"><Lock className="h-4 w-4" /> Privacy: {label(profile.visibility === "network" ? "Connections only" : profile.visibility === "public" ? "Members" : "Private")}</Link>
                </>
              ) : viewer && !isSelf && (
                <>
                  {connected ? (
                    <>
                      <ActionButton className="btn-primary" action={startConversation.bind(null, owner.id)}>Message</ActionButton>
                      <ActionButton className="btn-ghost" confirm="Remove this connection?" action={removeConnection.bind(null, owner.id)}>Remove connection</ActionButton>
                    </>
                  ) : pending ? <span className="btn-ghost">Request pending</span> : (
                    <ResultActionButton className="btn-primary" action={requestConnection.bind(null, owner.id)}>+ Connect</ResultActionButton>
                  )}
                  <ActionButton className="btn-ghost text-red-600" confirm={`Block ${owner.name}? They won't be able to see your profile, connect or message you.`} action={blockUser.bind(null, owner.id)}>Block</ActionButton>
                  <ReportButton targetType="user" targetId={owner.id} reasons={["Fake or impersonation account", "Harassment or bullying", "Inappropriate content", "Adult contacting minors inappropriately", "Spam or scam", "Other"]} />
                </>
              )}
            </div>
          </div>
        </Card>

        {edit && percent < 100 && (
          <Card className="p-5">
            <div className="flex items-center justify-between"><h2 className="font-semibold">Profile strength</h2><span className="text-sm font-semibold text-brand">{percent}%</span></div>
            <div className="mt-2"><Progress value={percent} /></div>
            <p className="mt-2 text-sm text-muted">Add: {missing.join(", ")}</p>
          </Card>
        )}

        <Section title="About" icon={<Sparkles className="h-5 w-5 text-brand" />} editHref={e("about")}>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg">{profile.about || <span className="text-muted">No summary yet.</span>}</p>
        </Section>
        <Section title="Education" icon={<GraduationCap className="h-5 w-5 text-brand" />} editHref={e("education")}><Entries items={profile.education} empty="No education added yet." /></Section>
        <Section title="Experience" icon={<Briefcase className="h-5 w-5 text-brand" />} editHref={e("experience")}><Entries items={[...profile.experience]} empty="No work or internship experience yet." /></Section>
        <Section title="Skills" icon={<Medal className="h-5 w-5 text-brand" />} editHref={e("skills")}>
          {profile.skills.length ? <div className="flex flex-wrap gap-2">{profile.skills.map((s) => <span key={s} className="rounded-full border border-line px-3 py-1 text-sm">{s}</span>)}</div> : <p className="text-sm text-muted">No skills added yet.</p>}
        </Section>
        <Section title="Projects" icon={<FolderGit2 className="h-5 w-5 text-brand" />} editHref={e("projects")}><Entries items={profile.projects} empty="No academic projects yet." /></Section>
        <Section title="Volunteer experience" icon={<HandHeart className="h-5 w-5 text-brand" />} editHref={e("volunteer")}><Entries items={profile.volunteer} empty="No volunteer experience yet." /></Section>
        <Section title="Extracurricular activities" icon={<Users className="h-5 w-5 text-brand" />} editHref={e("activities")}><Entries items={profile.activities} empty="No activities yet." /></Section>
        <Section title="Awards & certifications" icon={<Award className="h-5 w-5 text-brand" />} editHref={e("awards")}>
          <Entries items={[...profile.awards, ...profile.certifications]} empty="No awards or certifications yet." />
        </Section>
        {profile.links.length > 0 && (
          <Section title="Portfolio & links" icon={<FolderGit2 className="h-5 w-5 text-brand" />} editHref={e("links")}>
            <ul className="space-y-1 text-sm">{profile.links.map((l) => <li key={l.url}><a href={l.url} className="link" target="_blank" rel="noopener noreferrer nofollow">{l.label}</a></li>)}</ul>
          </Section>
        )}
        <Section title="Activity" icon={<Sparkles className="h-5 w-5 text-brand" />}>
          {recent.length === 0 ? <p className="text-sm text-muted">No posts yet.</p> : (
            <ul className="divide-y divide-line">{recent.map((p) => <li key={p.id} className="py-3 first:pt-0"><p className="text-xs text-muted">{isSelf ? "You" : owner.name} posted · {timeAgo(p.createdAt)}</p><p className="mt-1 line-clamp-3 text-sm">{p.body}</p></li>)}</ul>
          )}
          <Link href="/feed" className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">Go to feed</Link>
        </Section>
      </div>

      <aside className="space-y-4">
        {edit && (
          <Card className="p-4 text-sm">
            <h2 className="font-semibold">Profile privacy</h2>
            <p className="mt-1 text-muted">Visibility: <strong className="text-fg">{profile.visibility === "public" ? "All signed-in members" : profile.visibility === "network" ? "Connections only" : "Only me"}</strong></p>
            {owner.ageGroup === "minor" && <p className="mt-2 text-xs text-muted">Because you're under 18, your profile is never visible to the public or to adults you're not connected with.</p>}
            <p className="mt-2 text-xs text-muted">Private planning data (applications, FAFSA progress, residency status, confirmation numbers) never appears on your profile.</p>
          </Card>
        )}
        <Card className="p-4" as="aside">
          <h2 id="connections" className="font-semibold">Connections</h2>
          {connMembers.length === 0 ? <p className="mt-2 text-sm text-muted">No connections yet.</p> : (
            <ul className="mt-3 space-y-3">
              {connMembers.map((m) => (
                <li key={m.user.id}><Link href={`/profile/${m.user.id}`} className="flex gap-2 hover:text-brand"><Avatar src={m.profile?.avatarUrl} name={m.user.name} size={36} /><span className="min-w-0"><span className="block truncate text-sm font-semibold">{m.user.name}</span><span className="block truncate text-xs text-muted">{m.profile?.headline}</span></span></Link></li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-4">
          <h2 className="font-semibold">Following</h2>
          {orgs.length === 0 ? <p className="mt-2 text-sm text-muted">Not following any colleges or organizations.</p> : (
            <ul className="mt-2 space-y-2 text-sm">{orgs.map((o) => <li key={o.id}><Link href={`/organizations/${o.id}`} className="hover:text-brand">{o.name}</Link> <span className="text-xs text-muted">· {label(o.type)}</span></li>)}</ul>
          )}
        </Card>
        <Card className="p-4">
          <h2 className="font-semibold">Groups</h2>
          {myGroups.length === 0 ? <p className="mt-2 text-sm text-muted">No groups yet.</p> : (
            <ul className="mt-2 space-y-2 text-sm">{myGroups.map((g) => <li key={g.id}><Link href={`/groups/${g.id}`} className="hover:text-brand">{g.name}</Link></li>)}</ul>
          )}
        </Card>
      </aside>
    </div>
  );
}
