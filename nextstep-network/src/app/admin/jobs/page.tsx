import type { Metadata } from "next";
import Link from "next/link";
import { setJobStatus } from "@/app/actions/admin";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { ActionButton } from "@/components/client-ui";
import { Badge, Card, PageHeader, StatusPill } from "@/components/ui";

export const metadata: Metadata = { title: "Admin · Jobs" };

export default async function AdminJobs() {
  const store = await db();
  const [jobs, orgs, reports] = await Promise.all([store.all("jobs"), store.all("organizations"), store.all("reports", { targetType: "job", status: "open" })]);
  const list = jobs.sort((a, b) => (a.status === "pending" ? -1 : 1) - (b.status === "pending" ? -1 : 1) || b.createdAt.localeCompare(a.createdAt));
  return (
    <div className="space-y-4">
      <PageHeader title="Internship & job approvals" subtitle="Review every listing before students see it. Watch for fees, requests for personal financial information, vague employers and pay that's too good to be true." />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead><tr className="border-b border-line text-muted"><th className="p-3">Listing</th><th>Employer</th><th>Pay</th><th>Posted</th><th>Status</th><th /></tr></thead>
          <tbody>{list.map((j) => { const o = orgs.find((x) => x.id === j.orgId); const r = reports.filter((x) => x.targetId === j.id).length; return (
            <tr key={j.id} className="border-b border-line last:border-0">
              <td className="p-3"><Link href={`/jobs/${j.id}`} className="font-medium hover:text-brand">{j.title}</Link>{j.isDemo && <span className="text-xs text-muted"> · demo</span>}{r > 0 && <Badge tone="red" className="ml-1">{r} report{r > 1 ? "s" : ""}</Badge>}</td>
              <td>{o?.name} {o?.verified ? <Badge tone="green">Verified</Badge> : <Badge tone="amber">Unverified</Badge>}</td>
              <td>{j.paid ? j.payText : <Badge tone="amber">Unpaid</Badge>}</td>
              <td className="text-xs">{formatDate(j.createdAt)}</td>
              <td><StatusPill status={j.status} /></td>
              <td className="space-x-1 whitespace-nowrap">
                {j.status !== "approved" && <ActionButton className="btn-secondary btn-sm" action={setJobStatus.bind(null, j.id, "approved")}>Approve</ActionButton>}
                {j.status !== "rejected" && <ActionButton className="btn-ghost btn-sm text-red-600" action={setJobStatus.bind(null, j.id, "rejected")}>Reject</ActionButton>}
              </td>
            </tr>
          ); })}</tbody>
        </table>
      </Card>
    </div>
  );
}
