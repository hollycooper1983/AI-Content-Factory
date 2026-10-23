import type { Metadata } from "next";
import Link from "next/link";
import { JobsBrowser } from "@/components/jobs-browser";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Internships & Jobs", description: "Student jobs, internships and entry-level roles from verified employers." };

export default function Jobs({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <PageHeader eyebrow="Internships & Jobs" title="Opportunities for students and new grads" subtitle="Part-time jobs, summer roles, internships, apprenticeships and entry-level positions." action={<><Link href="/internships" className="btn-secondary">Internships</Link><Link href="/my-jobs" className="btn-primary">My job tracker</Link></>} />
      <JobsBrowser sp={searchParams} base="/jobs" />
    </div>
  );
}
