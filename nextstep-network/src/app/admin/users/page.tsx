import type { Metadata } from "next";
import Link from "next/link";
import { setUserStatus, setUserVerified } from "@/app/actions/admin";
import { db } from "@/lib/db";
import { cn, formatDate, label } from "@/lib/format";
import { ActionButton } from "@/components/client-ui";
import { Badge, Card, PageHeader, StatusPill } from "@/components/ui";

export const metadata: Metadata = { title: "Admin · Users" };

export default async function AdminUsers({ searchParams }: { searchParams: { q?: string; filter?: string } }) {
  const store = await db();
  const q = (searchParams.q ?? "").toLowerCase();
  const users = (await store.all("users")).filter((u) => (!q || (u.name + u.email).toLowerCase().includes(q)) && (searchParams.filter !== "pending" || (["college", "employer", "mentor", "counselor"].includes(u.role) && !u.verified)) && (searchParams.filter !== "suspended" || u.status === "suspended")).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div className="space-y-4">
      <PageHeader title="Users & role verification" subtitle="Verify mentors, counselors, colleges and employers before they receive elevated privileges. Suspend accounts that violate guidelines." />
      <form className="flex flex-wrap gap-2"><input name="q" defaultValue={searchParams.q} placeholder="Search name or email" aria-label="Search users" className="input max-w-xs" /><select name="filter" defaultValue={searchParams.filter ?? ""} aria-label="Filter" className="input w-auto"><option value="">All</option><option value="pending">Awaiting verification</option><option value="suspended">Suspended</option></select><button className="btn-secondary">Filter</button></form>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead><tr className="border-b border-line text-muted"><th className="p-3">Member</th><th>Role</th><th>Age</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{users.map((u) => (
            <tr key={u.id} className="border-b border-line last:border-0">
              <td className="p-3"><Link href={`/profile/${u.id}`} className="font-medium hover:text-brand">{u.name}</Link><p className="text-xs text-muted">{u.email}{u.isDemo && " · demo"}</p></td>
              <td>{label(u.role)} {["college", "employer", "mentor", "counselor"].includes(u.role) && (u.verified ? <Badge tone="green">Verified</Badge> : <Badge tone="amber">Unverified</Badge>)}</td>
              <td className={cn(u.ageGroup === "minor" && "text-amber-600")}>{u.ageGroup === "minor" ? "Under 18" : "18+"}</td>
              <td className="text-xs">{formatDate(u.createdAt)}</td>
              <td><StatusPill status={u.status} /></td>
              <td className="space-x-1 py-2">
                {["college", "employer", "mentor", "counselor"].includes(u.role) && <ActionButton className="btn-secondary btn-sm" action={setUserVerified.bind(null, u.id, !u.verified)}>{u.verified ? "Revoke" : "Verify"}</ActionButton>}
                {u.role !== "admin" && <ActionButton className={u.status === "active" ? "btn-ghost btn-sm text-red-600" : "btn-ghost btn-sm"} confirm={u.status === "active" ? `Suspend ${u.name}? They'll be signed out.` : undefined} action={setUserStatus.bind(null, u.id, u.status === "active" ? "suspended" : "active")}>{u.status === "active" ? "Suspend" : "Reinstate"}</ActionButton>}
              </td>
            </tr>
          ))}</tbody>
        </table>
      </Card>
    </div>
  );
}
