import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { rankFeed } from "@/lib/ranking";
import { blockedIds, connectionIds, hydratePosts } from "@/lib/queries";
import { cn } from "@/lib/format";
import { Composer } from "@/components/composer";
import { PostCard } from "@/components/post-card";
import { ProfileCard, RightRail } from "@/components/sidebars";
import { EmptyState, Notice } from "@/components/ui";
import type { PostCategory } from "@/lib/types";

export const metadata: Metadata = { title: "Home" };

const TABS: { id: string; label: string; cats?: PostCategory[] }[] = [
  { id: "all", label: "All" },
  { id: "connections", label: "My Connections" },
  { id: "colleges", label: "College Updates", cats: ["college", "event"] },
  { id: "funding", label: "Scholarships & Funding", cats: ["scholarship"] },
  { id: "careers", label: "Careers & Internships", cats: ["internship", "advice"] },
  { id: "community", label: "Community Discussions", cats: ["question", "general", "success"] },
];

export default async function FeedPage({ searchParams }: { searchParams: { tab?: string; denied?: string } }) {
  const user = await requireUser();
  const store = await db();
  const profile = await store.find("profiles", { userId: user.id });
  const tab = TABS.find((t) => t.id === searchParams.tab) ?? TABS[0];

  const [posts, conns, follows, users, reports, myGroups, blocked] = await Promise.all([
    store.all("posts", { removed: false }), connectionIds(user.id), store.all("follows", { userId: user.id }), store.all("users"),
    store.all("reports", { status: "open" }), store.all("group_members", { userId: user.id, status: "member" }), blockedIds(user.id),
  ]);
  const groupIds = new Set(myGroups.map((g) => g.groupId));
  const reportCounts = new Map<string, number>();
  reports.filter((r) => r.targetType === "post").forEach((r) => reportCounts.set(r.targetId, (reportCounts.get(r.targetId) ?? 0) + 1));

  let candidates = posts.filter((p) => !p.groupId || groupIds.has(p.groupId));
  if (tab.id === "connections") candidates = candidates.filter((p) => conns.has(p.authorId));
  if (tab.cats) candidates = candidates.filter((p) => tab.cats!.includes(p.category));

  const ranked = rankFeed(candidates, {
    viewerId: user.id,
    connectionIds: conns,
    followedOrgIds: new Set(follows.map((f) => f.orgId)),
    interests: profile?.careerInterests ?? [],
    verifiedAuthorIds: new Set(users.filter((u) => u.verified).map((u) => u.id)),
    hiddenAuthorIds: blocked,
    reportCounts,
  });
  const items = await hydratePosts(ranked, user.id);
  const myOrgs = user.orgId && user.verified ? [await store.get("organizations", user.orgId)].filter(Boolean).map((o) => ({ id: o!.id, name: o!.name })) : [];

  return (
    <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 md:grid-cols-[225px_1fr] lg:grid-cols-[225px_minmax(0,1fr)_300px]">
      <aside className="hidden md:block"><div className="sticky top-20"><ProfileCard user={user} profile={profile} /></div></aside>
      <div className="min-w-0 space-y-4">
        {searchParams.denied && <Notice tone="amber">You don't have access to that page.</Notice>}
        <Composer name={user.name} avatar={profile?.avatarUrl ?? ""} orgs={myOrgs} />
        <nav aria-label="Feed filters" className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <Link key={t.id} href={t.id === "all" ? "/feed" : `/feed?tab=${t.id}`} aria-current={t.id === tab.id ? "page" : undefined}
              className={cn("whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold", t.id === tab.id ? "border-navy bg-navy text-white dark:border-white dark:bg-white dark:text-navy" : "border-line bg-surface text-muted hover:text-fg")}>
              {t.label}
            </Link>
          ))}
        </nav>
        {items.length === 0 ? (
          <div className="card"><EmptyState title="Nothing here yet" body="Follow colleges and organizations, join groups, or connect with classmates to fill your feed." action={<Link href="/network" className="btn-primary">Find people & groups</Link>} /></div>
        ) : (
          items.map((item) => <div key={item.post.id} id={`post-${item.post.id}`}><PostCard item={item} viewerId={user.id} isAdmin={user.role === "admin"} /></div>)
        )}
        {items.length > 0 && (
          <div className="card flex items-center gap-3 p-4 text-sm text-muted">
            <CheckCircle2 className="h-5 w-5 text-teal" />
            <p>You're all caught up. Time for a next step — <Link href="/dashboard" className="link">check your dashboard</Link> or <Link href="/scholarships" className="link">find a scholarship</Link>.</p>
          </div>
        )}
      </div>
      <aside className="hidden lg:block"><RightRail user={user} profile={profile} /></aside>
    </div>
  );
}
