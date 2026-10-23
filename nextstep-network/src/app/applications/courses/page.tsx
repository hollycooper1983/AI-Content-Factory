import type { Metadata } from "next";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { deleteCourse } from "@/app/actions/planning";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { gpa } from "@/lib/gpa";
import { ActionButton } from "@/components/client-ui";
import { Card, EmptyState, Notice, PageHeader } from "@/components/ui";
import { CourseForm } from "./form";

export const metadata: Metadata = { title: "Transcript & course organizer" };

export default async function Courses() {
  const user = await requireUser();
  const store = await db();
  const courses = (await store.all("courses", { userId: user.id })).sort((a, b) => a.schoolYear.localeCompare(b.schoolYear));
  const g = gpa(courses);
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <PageHeader eyebrow="Transcript & Course Organizer" title="My courses" subtitle="Privately track your courses, credits and grades. This is for your planning only and is never shared." action={<Link href="/applications" className="btn-ghost">← Applications</Link>} />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card className="p-4"><p className="text-xs text-muted">Unweighted GPA (estimate)</p><p className="text-2xl font-bold">{g.unweighted ?? "—"}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Weighted GPA (estimate)</p><p className="text-2xl font-bold">{g.weighted ?? "—"}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Credits</p><p className="text-2xl font-bold">{g.credits}</p></Card>
      </div>
      <Notice tone="amber">GPA estimates use a standard 4.0 scale (+0.5 honors, +1.0 AP/IB/dual enrollment/college). Your school's official GPA and each college's recalculation may differ. We don't claim any course meets a college's admission requirements.</Notice>
      <CourseForm />
      <Card className="mt-4 overflow-x-auto">
        {courses.length === 0 ? <EmptyState title="No courses yet" /> : (
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead><tr className="border-b border-line text-muted"><th className="p-3">Course</th><th>Year</th><th>Term</th><th>Level</th><th>Credit</th><th>Grade</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>{courses.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0"><td className="p-3 font-medium">{c.name}</td><td>{c.schoolYear}</td><td>{c.term}</td><td className="capitalize">{c.level.replace("_", " ")}</td><td>{c.credit}</td><td>{c.grade}</td>
                <td><ActionButton className="btn-ghost btn-sm" confirm="Delete course?" action={deleteCourse.bind(null, c.id)}><Trash2 className="h-4 w-4" /><span className="sr-only">Delete {c.name}</span></ActionButton></td></tr>
            ))}</tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
