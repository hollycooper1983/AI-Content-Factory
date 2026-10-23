import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { deleteTask, toggleTask } from "@/app/actions/planning";
import { toggleSave } from "@/app/actions/social";
import { requireUser } from "@/lib/auth";
import { calendarItems } from "@/lib/calendar";
import { db } from "@/lib/db";
import { cn, formatDate } from "@/lib/format";
import { ActionButton } from "@/components/client-ui";
import { Badge, Card, CardHeader, DemoBadge, Notice, PageHeader } from "@/components/ui";
import { TaskForm } from "./task-form";

export const metadata: Metadata = { title: "Calendar & deadlines" };

const KIND_COLOR: Record<string, string> = { application: "bg-brand", fafsa: "bg-teal", scholarship: "bg-green-500", job: "bg-amber-500", personal: "bg-slate-400", fair: "bg-purple-500", workshop: "bg-sky-500", visit: "bg-pink-500", networking: "bg-indigo-500" };

export default async function CalendarPage({ searchParams }: { searchParams: { m?: string } }) {
  const user = await requireUser();
  const store = await db();
  const items = await calendarItems(user.id);
  const [events, savedEv] = await Promise.all([store.all("events"), store.all("saved_items", { userId: user.id, kind: "event" })]);
  const savedSet = new Set(savedEv.map((s) => s.refId));
  const now = new Date();
  const [y, m] = (searchParams.m ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`).split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const days = new Date(y, m, 0).getDate();
  const pad = first.getDay();
  const key = (d: number) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const prev = new Date(y, m - 2, 1), next = new Date(y, m, 1);
  const mk = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const today = now.toISOString().slice(0, 10);
  const upcoming = items.filter((i) => i.date >= today && !i.done).slice(0, 12);
  const tasks = await store.all("tasks", { userId: user.id });
  const undated = tasks.filter((t) => !t.date && !t.done);
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <PageHeader eyebrow="Student Event Calendar" title="Deadlines & events" subtitle="Your application deadlines, tasks and saved events in one place." action={<a href="/api/calendar" className="btn-secondary"><Download className="h-4 w-4" /> Export (.ics)</a>} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <Link href={`/calendar?m=${mk(prev)}`} className="btn-ghost btn-sm" aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></Link>
              <h2 className="font-semibold">{first.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2>
              <Link href={`/calendar?m=${mk(next)}`} className="btn-ghost btn-sm" aria-label="Next month"><ChevronRight className="h-4 w-4" /></Link>
            </div>
            <div className="grid grid-cols-7 text-center text-xs font-semibold text-muted">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="py-2">{d}</div>)}</div>
            <div className="grid grid-cols-7 border-t border-line">
              {Array.from({ length: pad }).map((_, i) => <div key={`p${i}`} className="min-h-[88px] border-b border-r border-line bg-canvas/50" />)}
              {Array.from({ length: days }).map((_, i) => {
                const d = i + 1;
                const dayItems = items.filter((x) => x.date === key(d));
                return (
                  <div key={d} className={cn("min-h-[88px] border-b border-r border-line p-1", key(d) === today && "bg-brand-50 dark:bg-brand/10")}>
                    <p className={cn("text-xs", key(d) === today ? "font-bold text-brand" : "text-muted")}>{d}</p>
                    <ul className="mt-1 space-y-0.5">{dayItems.slice(0, 3).map((x) => <li key={x.id}><Link href={x.href} title={x.title} className={cn("block truncate rounded px-1 text-[10px] text-white", KIND_COLOR[x.kind] ?? "bg-slate-500", x.done && "opacity-50 line-through")}>{x.title}</Link></li>)}
                      {dayItems.length > 3 && <li className="text-[10px] text-muted">+{dayItems.length - 3} more</li>}</ul>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card>
            <CardHeader title="Events" subtitle="Save events to add them to your calendar" />
            <ul className="divide-y divide-line">{events.sort((a, b) => a.date.localeCompare(b.date)).map((e) => (
              <li key={e.id} className="flex flex-wrap items-start gap-3 px-4 py-3">
                <div className="w-12 shrink-0 rounded-lg bg-brand-50 py-1 text-center dark:bg-brand/15"><p className="text-[10px] font-semibold uppercase text-brand">{formatDate(e.date, { month: "short" })}</p><p className="font-bold">{formatDate(e.date, { day: "numeric" })}</p></div>
                <div className="min-w-0 flex-1"><p className="font-medium">{e.title}</p><p className="text-xs text-muted">{e.location} · {e.description}</p>{e.isDemo && <DemoBadge label="Demo event" />}</div>
                <ActionButton className={savedSet.has(e.id) ? "btn-ghost btn-sm" : "btn-secondary btn-sm"} action={toggleSave.bind(null, "event", e.id, "/calendar")}>{savedSet.has(e.id) ? "Saved ✓" : "Save event"}</ActionButton>
              </li>
            ))}</ul>
          </Card>
        </div>
        <aside className="space-y-4">
          <TaskForm />
          <Card>
            <CardHeader title="Upcoming" />
            <ul className="divide-y divide-line text-sm">
              {upcoming.map((i) => (
                <li key={i.id} className="flex items-start gap-2 px-4 py-2.5">
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", KIND_COLOR[i.kind] ?? "bg-slate-500")} />
                  <div className="min-w-0 flex-1"><Link href={i.href} className="hover:text-brand">{i.title}</Link><p className="text-xs text-muted">{formatDate(i.date)}</p></div>
                  {i.taskId && <ActionButton className="btn-ghost btn-sm" action={toggleTask.bind(null, i.taskId)}>Done</ActionButton>}
                  {i.taskId && <ActionButton className="btn-ghost btn-sm text-red-600" confirm="Delete this task?" action={deleteTask.bind(null, i.taskId)}>✕<span className="sr-only">Delete</span></ActionButton>}
                </li>
              ))}
              {upcoming.length === 0 && <li className="px-4 py-4 text-muted">Nothing upcoming.</li>}
            </ul>
          </Card>
          {undated.length > 0 && <Card><CardHeader title="To do (no date)" /><ul className="divide-y divide-line text-sm">{undated.map((t) => <li key={t.id} className="flex items-center gap-2 px-4 py-2.5"><span className="flex-1">{t.title}</span><Badge>{t.kind}</Badge><ActionButton className="btn-ghost btn-sm" action={toggleTask.bind(null, t.id)}>Done</ActionButton></li>)}</ul></Card>}
          <Notice tone="blue">Reminders appear in your notifications and dashboard. Email reminders turn on once an email provider is configured. Export to Google Calendar or Apple Calendar with the .ics file.</Notice>
        </aside>
      </div>
    </div>
  );
}
