import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { Card, PageHeader, StatusPill, VerificationBadge } from "@/components/ui";
import { CollegeEditor } from "./editor";

export const metadata: Metadata = { title: "Admin · Colleges" };

export default async function AdminColleges({ searchParams }: { searchParams: { id?: string } }) {
  const store = await db();
  const colleges = (await store.all("colleges")).sort((a, b) => a.name.localeCompare(b.name));
  const sel = colleges.find((c) => c.id === searchParams.id);
  return (
    <div className="space-y-4">
      <PageHeader title="College resource management" subtitle="Confirm figures against College Scorecard and the official website, record the source URL, then mark the record verified. Workflow: Draft → Pending Review → Approved → Published → Archived." />
      {sel && <CollegeEditor college={sel} />}
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead><tr className="border-b border-line text-muted"><th className="p-3">College</th><th>Verification</th><th>Publish status</th><th /></tr></thead>
          <tbody>{colleges.map((c) => <tr key={c.id} className="border-b border-line last:border-0"><td className="p-3 font-medium">{c.name}</td><td><VerificationBadge v={c.verification} /></td><td><StatusPill status={c.publishStatus} /></td><td><Link href={`/admin/colleges?id=${c.id}`} className="btn-ghost btn-sm">Edit</Link></td></tr>)}</tbody>
        </table>
      </Card>
    </div>
  );
}
