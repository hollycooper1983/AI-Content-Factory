import Link from "next/link";
import { db } from "@/lib/db";
import { studentSummary } from "@/lib/dashboard";
import { formatDate } from "@/lib/format";
import { FAFSA_STEPS } from "@/lib/progress";
import { Card, CardHeader, Notice, PageHeader, Progress, StatusPill } from "@/components/ui";
import { ClaimCodeForm } from "./claim";

export async function ParentDashboard({ parentId }: { parentId: string }) {
  const store = await db();
  const links = await store.all("parent_links", { parentId });
  const students = await Promise.all(links.map(async (l) => ({ user: await store.get("users", l.studentId), s: await studentSummary(l.studentId) })));
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <PageHeader eyebrow="Parent & Guardian Dashboard" title="Your student's shared checklist" subtitle="Read-only view of the planning progress your student chose to share. You can't see their messages, posts, essays or private notes." />
      {students.length === 0 && <Notice tone="blue">No students linked yet. Ask your student to create a parent link code in their Settings, then enter it below.</Notice>}
      {students.map(({ user, s }) => user && (
        <div key={user.id} className="mb-6 space-y-4">
          <h2 className="text-xl font-bold">{user.name}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-4"><p className="text-sm text-muted">FAFSA checklist</p><p className="text-2xl font-bold">{s.fPct}%</p><Progress value={s.fPct} tone="teal" /></Card>
            <Card className="p-4"><p className="text-sm text-muted">Applications submitted</p><p className="text-2xl font-bold">{s.submitted} of {s.apps.length}</p></Card>
            <Card className="p-4"><p className="text-sm text-muted">Readiness (tasks completed)</p><p className="text-2xl font-bold">{s.readiness.score}%</p><Progress value={s.readiness.score} /></Card>
          </div>
          <Card>
            <CardHeader title="FAFSA steps" subtitle="Contributors complete their own section at StudentAid.gov with their own account." />
            <ul className="grid gap-1 p-4 text-sm sm:grid-cols-2">{FAFSA_STEPS.map((st) => <li key={st.id}>{s.fafsa?.steps[st.id]?.done ? "✅" : "⬜"} {st.label}</li>)}</ul>
          </Card>
          <Card>
            <CardHeader title="Applications" />
            <ul className="divide-y divide-line text-sm">{s.apps.map((a) => <li key={a.id} className="flex justify-between px-4 py-2.5"><span>{a.college?.name}</span><StatusPill status={a.status} /></li>)}</ul>
          </Card>
          <Card>
            <CardHeader title="Upcoming deadlines" />
            <ul className="divide-y divide-line text-sm">{s.upcoming.slice(0, 6).map((t) => <li key={t.id} className="flex justify-between px-4 py-2.5"><span>{t.title}</span><span className="text-muted">{formatDate(t.date)}</span></li>)}</ul>
          </Card>
        </div>
      ))}
      <Card className="p-5"><h2 className="font-semibold">Link a student</h2><ClaimCodeForm /></Card>
      <p className="mt-4 text-sm text-muted">Helpful: <Link className="link" href="/fafsa">FAFSA guide for families</Link> · <Link className="link" href="/financial-aid">Compare aid offers</Link></p>
    </div>
  );
}
