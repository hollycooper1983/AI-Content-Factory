import type { Metadata } from "next";
import Link from "next/link";
import { deleteGroupAdmin } from "@/app/actions/admin";
import { db } from "@/lib/db";
import { ActionButton } from "@/components/client-ui";
import { Badge, Card, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Admin · Groups" };

export default async function AdminGroups() {
  const store = await db();
  const [groups, members, users, reports] = await Promise.all([store.all("groups"), store.all("group_members"), store.all("users"), store.all("reports", { status: "open" })]);
  return (
    <div className="space-y-4">
      <PageHeader title="Group moderation" subtitle="Review group activity, admins and reports. Removing a group deletes its memberships." />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead><tr className="border-b border-line text-muted"><th className="p-3">Group</th><th>Admin</th><th>Members</th><th>Pending</th><th /></tr></thead>
          <tbody>{groups.map((g) => (
            <tr key={g.id} className="border-b border-line last:border-0">
              <td className="p-3"><Link href={`/groups/${g.id}`} className="font-medium hover:text-brand">{g.name}</Link> {g.visibility === "private" && <Badge>Private</Badge>} {reports.some((r) => r.targetType === "group" && r.targetId === g.id) && <Badge tone="red">Reported</Badge>}</td>
              <td>{users.find((u) => u.id === g.adminId)?.name}</td>
              <td>{members.filter((m) => m.groupId === g.id && m.status === "member").length}</td>
              <td>{members.filter((m) => m.groupId === g.id && m.status === "pending").length}</td>
              <td><ActionButton className="btn-ghost btn-sm text-red-600" confirm={`Delete ${g.name}?`} action={deleteGroupAdmin.bind(null, g.id)}>Delete</ActionButton></td>
            </tr>
          ))}</tbody>
        </table>
      </Card>
    </div>
  );
}
