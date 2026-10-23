import type { Metadata } from "next";
import Link from "next/link";
import { setOrgVerified } from "@/app/actions/admin";
import { db } from "@/lib/db";
import { ActionButton } from "@/components/client-ui";
import { Badge, Card, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Admin · Organizations" };

export default async function AdminOrgs() {
  const store = await db();
  const [orgs, users] = await Promise.all([store.all("organizations"), store.all("users")]);
  const list = orgs.sort((a, b) => Number(a.verified) - Number(b.verified) || a.name.localeCompare(b.name));
  return (
    <div className="space-y-4">
      <PageHeader title="Organization verification" subtitle="Confirm an organization's identity (official domain email, website, phone verification) before verifying. Verified owners can post opportunities and publish as the organization." />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead><tr className="border-b border-line text-muted"><th className="p-3">Organization</th><th>Type</th><th>Owner</th><th>Status</th><th /></tr></thead>
          <tbody>{list.map((o) => (
            <tr key={o.id} className="border-b border-line last:border-0">
              <td className="p-3"><Link href={`/organizations/${o.id}`} className="font-medium hover:text-brand">{o.name}</Link>{o.isDemo && <span className="text-xs text-muted"> · demo</span>}</td>
              <td className="capitalize">{o.type}</td>
              <td>{users.find((u) => u.id === o.ownerId)?.email ?? <span className="text-muted">Unclaimed</span>}</td>
              <td>{o.verified ? <Badge tone="green">Verified</Badge> : <Badge tone="amber">Unverified</Badge>}</td>
              <td><ActionButton className="btn-secondary btn-sm" confirm={o.verified ? "Remove verification?" : undefined} action={setOrgVerified.bind(null, o.id, !o.verified)}>{o.verified ? "Revoke" : "Verify"}</ActionButton></td>
            </tr>
          ))}</tbody>
        </table>
      </Card>
    </div>
  );
}
