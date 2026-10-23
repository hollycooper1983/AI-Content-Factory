import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { cn } from "@/lib/format";
import { Badge, Card, OrgVerified, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Organizations" };

export default async function Orgs({ searchParams }: { searchParams: { type?: string } }) {
  const store = await db();
  const all = (await store.all("organizations")).sort((a, b) => Number(b.verified) - Number(a.verified) || a.name.localeCompare(b.name));
  const list = all.filter((o) => !searchParams.type || o.type === searchParams.type);
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <PageHeader eyebrow="Colleges & Organizations" title="Organizations" subtitle="Official pages for colleges, employers and nonprofits. A blue check means our team verified the organization." />
      <div className="mb-4 flex gap-2">{[["", "All"], ["college", "Colleges"], ["employer", "Employers"], ["nonprofit", "Nonprofits"]].map(([k, l]) => <Link key={k} href={k ? `/organizations?type=${k}` : "/organizations"} className={cn("chip", (searchParams.type ?? "") === k && "border-brand text-brand")}>{l}</Link>)}</div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((o) => (
          <Card key={o.id} className="p-4">
            <div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-navy text-sm font-bold text-white">{o.name.slice(0, 2).toUpperCase()}</div>
              <div className="min-w-0"><Link href={`/organizations/${o.id}`} className="block truncate font-semibold hover:text-brand">{o.name} <OrgVerified verified={o.verified} /></Link><p className="text-xs capitalize text-muted">{o.type} · {o.location}</p></div></div>
            <p className="mt-2 line-clamp-2 text-sm text-muted">{o.description}</p>
            <div className="mt-2 flex gap-1">{!o.verified && <Badge tone="amber">{o.type === "college" ? "Unclaimed" : "Unverified"}</Badge>}{o.isDemo && <Badge tone="amber">Demo</Badge>}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
