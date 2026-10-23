import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CAREERS } from "@/lib/data/careers";
import { cn, label } from "@/lib/format";
import { discoverableMembers } from "@/lib/queries";
import { Avatar } from "@/components/client-ui";
import { Card, DemoBadge, EmptyState, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Search", robots: { index: false } };

const TYPES = ["all", "people", "colleges", "programs", "scholarships", "jobs", "groups", "events", "careers", "organizations"] as const;

export default async function Search({ searchParams }: { searchParams: { q?: string; type?: string } }) {
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const type = (TYPES as readonly string[]).includes(searchParams.type ?? "") ? searchParams.type! : "all";
  const user = await getCurrentUser();
  const store = await db();
  const words = q.split(/\s+/).filter(Boolean);
  const hit = (s: string) => words.length > 0 && words.every((w) => s.toLowerCase().includes(w));
  const [colleges, scholarships, jobs, groups, events, orgs] = await Promise.all([
    store.all("colleges", { publishStatus: "published" }), store.all("scholarships", { publishStatus: "published" }), store.all("jobs", { status: "approved" }),
    store.all("groups"), store.all("events"), store.all("organizations"),
  ]);
  // Authorization: only members the viewer is allowed to discover appear (minors hidden from adults and guests).
  const people = user ? (await discoverableMembers(user)).filter((m) => hit(`${m.user.name} ${m.profile?.headline} ${m.profile?.school}`)) : [];
  const res = {
    people,
    colleges: colleges.filter((c) => hit(`${c.name} ${c.city} ${c.state} ${c.hbcu ? "hbcu" : ""}`)),
    programs: colleges.flatMap((c) => c.majors.filter((m) => hit(m)).map((m) => ({ c, m }))),
    scholarships: scholarships.filter((s) => hit(`${s.name} ${s.sponsor} ${s.tags.join(" ")} ${s.eligibility}`)),
    jobs: jobs.filter((j) => hit(`${j.title} ${j.category} ${j.location}`)),
    groups: groups.filter((g) => hit(`${g.name} ${g.description} ${g.tags.join(" ")}`)),
    events: events.filter((e) => hit(`${e.title} ${e.location} ${e.description}`)),
    careers: CAREERS.filter((c) => hit(`${c.title} ${c.cluster} ${c.titles.join(" ")}`)),
    organizations: orgs.filter((o) => o.type !== "college" && hit(`${o.name} ${o.description}`)),
  };
  const count = (k: keyof typeof res) => res[k].length;
  const show = (k: keyof typeof res) => (type === "all" || type === k) && count(k) > 0;
  const total = (Object.keys(res) as (keyof typeof res)[]).reduce((s, k) => s + count(k), 0);
  const row = "flex items-center gap-3 px-4 py-3 hover:bg-canvas";
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <PageHeader title={q ? `Results for “${searchParams.q}”` : "Search"} />
      <form className="mb-4 flex gap-2"><label htmlFor="sq" className="sr-only">Search</label><input id="sq" name="q" defaultValue={searchParams.q} className="input" placeholder="Search everything" /><input type="hidden" name="type" value={type} /><button className="btn-primary">Search</button></form>
      <div className="mb-4 flex flex-wrap gap-2">{TYPES.map((t) => <Link key={t} href={`/search?q=${encodeURIComponent(searchParams.q ?? "")}&type=${t}`} className={cn("chip capitalize", type === t && "border-brand text-brand")}>{t}{t !== "all" && ` (${count(t as keyof typeof res)})`}</Link>)}</div>
      {!user && <p className="mb-4 text-sm text-muted"><Link href="/login" className="link">Sign in</Link> to search for people.</p>}
      {total === 0 ? <Card><EmptyState title={q ? "No results" : "Type something to search"} /></Card> : (
        <div className="space-y-4">
          {show("people") && <Card><h2 className="border-b border-line px-4 py-2 font-semibold">People</h2><ul>{res.people.slice(0, 10).map((m) => <li key={m.user.id}><Link href={`/profile/${m.user.id}`} className={row}><Avatar src={m.profile?.avatarUrl} name={m.user.name} size={36} /><span><span className="block font-medium">{m.user.name}</span><span className="text-xs text-muted">{m.profile?.headline}</span></span></Link></li>)}</ul></Card>}
          {show("colleges") && <Card><h2 className="border-b border-line px-4 py-2 font-semibold">Colleges</h2><ul>{res.colleges.map((c) => <li key={c.id}><Link href={`/colleges/${c.id}`} className={row}><span className="font-medium">{c.name}</span><span className="text-xs text-muted">{c.city}, {c.state} · {label(c.type)}</span></Link></li>)}</ul></Card>}
          {show("programs") && <Card><h2 className="border-b border-line px-4 py-2 font-semibold">Degree programs</h2><ul>{res.programs.slice(0, 15).map(({ c, m }) => <li key={c.id + m}><Link href={`/colleges/${c.id}`} className={row}><span className="font-medium">{m}</span><span className="text-xs text-muted">{c.name}</span></Link></li>)}</ul></Card>}
          {show("scholarships") && <Card><h2 className="border-b border-line px-4 py-2 font-semibold">Scholarships</h2><ul>{res.scholarships.map((s) => <li key={s.id}><Link href={`/scholarships?q=${encodeURIComponent(s.name)}`} className={row}><span className="font-medium">{s.name}</span><span className="text-xs text-muted">{s.sponsor}</span></Link></li>)}</ul></Card>}
          {show("jobs") && <Card><h2 className="border-b border-line px-4 py-2 font-semibold">Internships & jobs</h2><ul>{res.jobs.map((j) => <li key={j.id}><Link href={`/jobs/${j.id}`} className={row}><span className="font-medium">{j.title}</span><span className="text-xs text-muted">{j.location}</span>{j.isDemo && <DemoBadge />}</Link></li>)}</ul></Card>}
          {show("groups") && <Card><h2 className="border-b border-line px-4 py-2 font-semibold">Groups</h2><ul>{res.groups.map((g) => <li key={g.id}><Link href={`/groups/${g.id}`} className={row}><span className="font-medium">{g.name}</span></Link></li>)}</ul></Card>}
          {show("events") && <Card><h2 className="border-b border-line px-4 py-2 font-semibold">Events</h2><ul>{res.events.map((e) => <li key={e.id}><Link href="/calendar" className={row}><span className="font-medium">{e.title}</span></Link></li>)}</ul></Card>}
          {show("careers") && <Card><h2 className="border-b border-line px-4 py-2 font-semibold">Career paths</h2><ul>{res.careers.map((c) => <li key={c.id}><Link href={`/careers?c=${c.id}#detail`} className={row}><span className="font-medium">{c.title}</span></Link></li>)}</ul></Card>}
          {show("organizations") && <Card><h2 className="border-b border-line px-4 py-2 font-semibold">Organizations & mentors</h2><ul>{res.organizations.map((o) => <li key={o.id}><Link href={`/organizations/${o.id}`} className={row}><span className="font-medium">{o.name}</span></Link></li>)}</ul></Card>}
        </div>
      )}
    </div>
  );
}
