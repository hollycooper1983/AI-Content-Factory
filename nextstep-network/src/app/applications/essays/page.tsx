import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { cn, formatDate } from "@/lib/format";
import { Card, PageHeader } from "@/components/ui";
import { EssayEditor } from "./editor";

export const metadata: Metadata = { title: "Essay tools" };

export default async function Essays({ searchParams }: { searchParams: { e?: string; v?: string } }) {
  const user = await requireUser();
  const store = await db();
  const essays = (await store.all("essays", { userId: user.id })).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const current = searchParams.e === "new" ? null : essays.find((e) => e.id === searchParams.e) ?? essays[0] ?? null;
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <PageHeader eyebrow="Application Essay Tools" title="Essays" subtitle="Organize prompts, draft, keep version history and get AI brainstorming and grammar feedback. Your story should always be your own." action={<Link href="/applications" className="btn-ghost">← Applications</Link>} />
      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Card className="h-fit p-3">
          <Link href="/applications/essays?e=new" className="btn-primary mb-3 w-full">+ New essay</Link>
          <ul className="space-y-1 text-sm">
            {essays.map((e) => (
              <li key={e.id}><Link href={`/applications/essays?e=${e.id}`} className={cn("block rounded-lg px-3 py-2 hover:bg-canvas", current?.id === e.id && "bg-brand-50 dark:bg-brand/10")}>
                <span className="block font-medium">{e.title}</span><span className="text-xs text-muted">{e.target || "No target"} · {e.versions.length} version{e.versions.length === 1 ? "" : "s"}</span>
              </Link></li>
            ))}
            {essays.length === 0 && <li className="px-3 py-2 text-muted">No essays yet.</li>}
          </ul>
        </Card>
        <div>
          <EssayEditor key={current?.id ?? "new"} essay={current} />
          {current && current.versions.length > 1 && (
            <Card className="mt-4 p-4">
              <h2 className="font-semibold">Version history</h2>
              <ul className="mt-2 space-y-2 text-sm">
                {[...current.versions].reverse().map((v, i) => (
                  <li key={v.savedAt} className="rounded-lg border border-line p-3">
                    <p className="text-xs text-muted">{i === 0 ? "Latest · " : ""}{formatDate(v.savedAt, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · {v.body.split(/\s+/).filter(Boolean).length} words</p>
                    <p className="mt-1 line-clamp-3 whitespace-pre-wrap">{v.body}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
