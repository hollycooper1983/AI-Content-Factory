import type { Metadata } from "next";
import Link from "next/link";
import { Lock, Users } from "lucide-react";
import { joinGroup } from "@/app/actions/social";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ResultActionButton } from "@/components/client-ui";
import { Badge, Card, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Groups" };

export default async function Groups({ searchParams }: { searchParams: { q?: string } }) {
  const user = await requireUser();
  const store = await db();
  const [groups, members] = await Promise.all([store.all("groups"), store.all("group_members")]);
  const q = (searchParams.q ?? "").toLowerCase();
  const list = groups.filter((g) => !q || (g.name + g.description + g.tags.join(" ")).toLowerCase().includes(q));
  const mine = new Map(members.filter((m) => m.userId === user.id).map((m) => [m.groupId, m.status]));
  const count = (id: string) => members.filter((m) => m.groupId === id && m.status === "member").length;
  const render = (gs: typeof groups) => (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {gs.map((g) => (
        <Card key={g.id} className="flex flex-col p-4">
          <div className="flex items-center gap-2"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-teal text-white"><Users className="h-5 w-5" /></div>
            <div className="min-w-0"><Link href={`/groups/${g.id}`} className="block truncate font-semibold hover:text-brand">{g.name}</Link><p className="text-xs text-muted">{count(g.id)} members</p></div></div>
          <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted">{g.description}</p>
          <div className="mt-2 flex flex-wrap gap-1">{g.visibility === "private" && <Badge><Lock className="h-3 w-3" /> Private</Badge>}{g.adultsOnly && <Badge tone="amber">18+</Badge>}</div>
          <div className="mt-3">
            {mine.get(g.id) === "member" ? <Link href={`/groups/${g.id}`} className="btn-secondary btn-sm">Open</Link>
              : mine.get(g.id) === "pending" ? <span className="text-xs text-muted">Request pending</span>
              : <ResultActionButton className="btn-primary btn-sm" action={joinGroup.bind(null, g.id)}>{g.visibility === "private" ? "Request to join" : "Join"}</ResultActionButton>}
          </div>
        </Card>
      ))}
    </div>
  );
  const joined = list.filter((g) => mine.get(g.id) === "member");
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <PageHeader eyebrow="Groups & Communities" title="Student groups" subtitle="Moderated communities around goals, majors and identities. Group admins and our moderators keep discussions safe." />
      <form className="flex max-w-md gap-2"><label htmlFor="gq" className="sr-only">Search groups</label><input id="gq" name="q" defaultValue={searchParams.q} placeholder="Search groups" className="input" /><button className="btn-secondary">Search</button></form>
      {joined.length > 0 && <section><h2 className="mb-3 font-semibold">My groups</h2>{render(joined)}</section>}
      <section><h2 className="mb-3 font-semibold">Discover groups</h2>{render(list.filter((g) => mine.get(g.id) !== "member"))}</section>
    </div>
  );
}
