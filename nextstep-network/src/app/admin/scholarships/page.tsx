import type { Metadata } from "next";
import Link from "next/link";
import { setScholarshipStatus } from "@/app/actions/admin";
import { db } from "@/lib/db";
import { ActionButton } from "@/components/client-ui";
import { Card, PageHeader, StatusPill, VerificationBadge } from "@/components/ui";
import { ScholarshipEditor } from "./editor";
import type { PublishStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Admin · Scholarships" };
const NEXT: Record<PublishStatus, PublishStatus | null> = { draft: "pending_review", pending_review: "approved", approved: "published", published: "archived", archived: null };

export default async function AdminScholarships({ searchParams }: { searchParams: { id?: string } }) {
  const store = await db();
  const list = (await store.all("scholarships")).sort((a, b) => a.name.localeCompare(b.name));
  const sel = searchParams.id === "new" ? null : list.find((s) => s.id === searchParams.id);
  return (
    <div className="space-y-4">
      <PageHeader title="Scholarship management" subtitle="Add and update scholarships without code changes. Only published listings appear to students. Never add a listing without an official sponsor URL." action={<Link href="/admin/scholarships?id=new" className="btn-primary">+ New scholarship</Link>} />
      {(searchParams.id === "new" || sel) && <ScholarshipEditor s={sel ?? null} />}
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead><tr className="border-b border-line text-muted"><th className="p-3">Scholarship</th><th>Verification</th><th>Workflow</th><th /></tr></thead>
          <tbody>{list.map((s) => (
            <tr key={s.id} className="border-b border-line last:border-0">
              <td className="p-3 font-medium">{s.name}<p className="text-xs font-normal text-muted">{s.sponsor}</p></td>
              <td><VerificationBadge v={s.verification} /></td>
              <td><StatusPill status={s.publishStatus} /></td>
              <td className="space-x-1 whitespace-nowrap">
                {NEXT[s.publishStatus] && <ActionButton className="btn-secondary btn-sm" action={setScholarshipStatus.bind(null, s.id, NEXT[s.publishStatus]!)}>→ {NEXT[s.publishStatus]!.replace("_", " ")}</ActionButton>}
                {s.publishStatus === "archived" && <ActionButton className="btn-ghost btn-sm" action={setScholarshipStatus.bind(null, s.id, "draft")}>Restore to draft</ActionButton>}
                <Link href={`/admin/scholarships?id=${s.id}`} className="btn-ghost btn-sm">Edit</Link>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </Card>
    </div>
  );
}
