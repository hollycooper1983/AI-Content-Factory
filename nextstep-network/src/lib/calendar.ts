import "server-only";
import { db } from "./db";

export interface CalItem { id: string; title: string; date: string; kind: string; href: string; done?: boolean; taskId?: string; demo?: boolean }

export async function calendarItems(userId: string): Promise<CalItem[]> {
  const store = await db();
  const [tasks, apps, colleges, events, saved] = await Promise.all([
    store.all("tasks", { userId }), store.all("college_applications", { userId }), store.all("colleges"), store.all("events"), store.all("saved_items", { userId, kind: "event" }),
  ]);
  const savedEv = new Set(saved.map((s) => s.refId));
  const items: CalItem[] = [];
  for (const t of tasks) if (t.date) items.push({ id: `t-${t.id}`, taskId: t.id, title: t.title, date: t.date, kind: t.kind, href: t.href || "/calendar", done: t.done });
  for (const a of apps) {
    const c = colleges.find((x) => x.id === a.collegeId);
    if (a.deadline) items.push({ id: `a-${a.id}`, title: `Application deadline: ${c?.name}`, date: a.deadline, kind: "application", href: "/applications" });
    if (a.decisionDate) items.push({ id: `d-${a.id}`, title: `Decision expected: ${c?.name}`, date: a.decisionDate, kind: "application", href: "/applications" });
  }
  for (const e of events) if (savedEv.has(e.id)) items.push({ id: `e-${e.id}`, title: e.title, date: e.date, kind: e.kind, href: "/calendar", demo: e.isDemo });
  return items.sort((a, b) => a.date.localeCompare(b.date));
}
