import type { Metadata } from "next";
import Link from "next/link";
import { JobsBrowser } from "@/components/jobs-browser";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Internships", description: "Paid and clearly labeled unpaid internships for high school and college students." };

export default function Internships({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <PageHeader eyebrow="Internships" title="Find an internship" subtitle="Unpaid internships are always clearly labeled." action={<Link href="/jobs" className="btn-secondary">All jobs</Link>} />
      <JobsBrowser sp={searchParams} base="/internships" internshipsOnly />
    </div>
  );
}
