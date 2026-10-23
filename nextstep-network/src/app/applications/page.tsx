import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { appPercent } from "@/lib/progress";
import { cn, label } from "@/lib/format";
import { Card, EmptyState, ExternalLink, Notice, PageHeader } from "@/components/ui";
import { AppCard } from "./app-card";
import type { AppStatus } from "@/lib/types";

export const metadata: Metadata = { title: "College Application Center" };

const COLUMNS: { id: string; label: string; statuses: AppStatus[] }[] = [
  { id: "researching", label: "Interested", statuses: ["interested"] },
  { id: "working", label: "Preparing / In Progress", statuses: ["preparing", "in_progress"] },
  { id: "submitted", label: "Submitted / Under Review", statuses: ["submitted", "under_review"] },
  { id: "decisions", label: "Decisions", statuses: ["accepted", "waitlisted", "declined", "enrolled"] },
];

export default async function Applications({ searchParams }: { searchParams: { view?: string; sort?: string; status?: string } }) {
  const user = await requireUser();
  const store = await db();
  const [apps, colleges] = await Promise.all([store.all("college_applications", { userId: user.id }), store.all("colleges")]);
  const cMap = new Map(colleges.map((c) => [c.id, c]));
  let items = apps.map((a) => ({ app: a, college: cMap.get(a.collegeId)!, pct: appPercent(a) })).filter((x) => x.college);
  if (searchParams.status) items = items.filter((x) => x.app.status === searchParams.status);
  const sort = searchParams.sort ?? "deadline";
  items.sort((a, b) => sort === "name" ? a.college.name.localeCompare(b.college.name) : sort === "progress" ? b.pct - a.pct : (a.app.deadline ?? "9999").localeCompare(b.app.deadline ?? "9999"));
  const board = searchParams.view !== "list";
  const submitted = apps.filter((a) => ["submitted", "under_review", "accepted", "waitlisted", "declined", "enrolled"].includes(a.status)).length;
  const avg = items.length ? Math.round(items.reduce((s, x) => s + x.pct, 0) / items.length) : 0;
  const q = (o: Record<string, string>) => "?" + new URLSearchParams({ view: board ? "board" : "list", sort, ...(searchParams.status ? { status: searchParams.status } : {}), ...o }).toString();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <PageHeader eyebrow="College Application Center" title="My applications" subtitle="Organize every application, checklist and deadline in one place. NextStep doesn't submit applications for you — use each college's official application."
        action={<><Link href="/applications/essays" className="btn-secondary">Essay tools</Link><Link href="/applications/courses" className="btn-secondary">Course organizer</Link><Link href="/colleges" className="btn-primary">+ Add college</Link></>} />
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <Card className="p-4"><p className="text-xs text-muted">Colleges tracked</p><p className="text-2xl font-bold">{apps.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Submitted</p><p className="text-2xl font-bold">{submitted}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Average checklist progress</p><p className="text-2xl font-bold">{avg}%</p></Card>
        <Card className="p-4 text-sm"><p className="text-xs text-muted">Official applications</p><ExternalLink href="https://www.cfnc.org/">CFNC</ExternalLink> · <ExternalLink href="https://www.commonapp.org/">Common App</ExternalLink></Card>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">View:</span>
        <Link href={q({ view: "board" })} className={cn("chip", board && "border-brand text-brand")}>Board</Link>
        <Link href={q({ view: "list" })} className={cn("chip", !board && "border-brand text-brand")}>List</Link>
        <span className="ml-3 text-muted">Sort:</span>
        {["deadline", "name", "progress"].map((s) => <Link key={s} href={q({ sort: s })} className={cn("chip capitalize", sort === s && "border-brand text-brand")}>{s}</Link>)}
        <form className="ml-auto flex items-center gap-2"><input type="hidden" name="view" value={board ? "board" : "list"} /><input type="hidden" name="sort" value={sort} />
          <label htmlFor="status" className="text-muted">Status</label>
          <select id="status" name="status" defaultValue={searchParams.status ?? ""} className="input w-auto py-1"><option value="">All</option>{["interested", "preparing", "in_progress", "submitted", "under_review", "accepted", "waitlisted", "declined", "enrolled"].map((s) => <option key={s} value={s}>{label(s)}</option>)}</select>
          <button className="btn-ghost btn-sm">Filter</button>
        </form>
      </div>
      {items.length === 0 ? <Card><EmptyState icon={<GraduationCap className="h-5 w-5" />} title="No applications yet" body="Find colleges and click “Add to My Application Tracker.”" action={<Link href="/colleges" className="btn-primary">Find colleges</Link>} /></Card>
        : board ? (
          <div className="grid gap-4 lg:grid-cols-4">
            {COLUMNS.map((col) => {
              const colItems = items.filter((x) => col.statuses.includes(x.app.status));
              return (
                <section key={col.id} aria-label={col.label} className="rounded-xl bg-canvas p-2">
                  <h2 className="flex items-center justify-between px-2 py-1 text-sm font-semibold">{col.label}<span className="rounded-full bg-surface px-2 text-xs text-muted">{colItems.length}</span></h2>
                  <div className="mt-2 space-y-3">{colItems.map((x) => <AppCard key={x.app.id} app={x.app} collegeName={x.college.name} admissionsUrl={x.college.admissionsUrl} pct={x.pct} />)}</div>
                  {colItems.length === 0 && <p className="px-2 py-6 text-center text-xs text-muted">Nothing here</p>}
                </section>
              );
            })}
          </div>
        ) : <div className="space-y-3">{items.map((x) => <AppCard key={x.app.id} app={x.app} collegeName={x.college.name} admissionsUrl={x.college.admissionsUrl} pct={x.pct} wide />)}</div>}
      <div className="mt-6"><Notice tone="blue">Confirmation numbers you record here are private to you and never shown on your profile or to parents.</Notice></div>
    </div>
  );
}
