import type { Metadata } from "next";
import Link from "next/link";
import { respondConnection } from "@/app/actions/social";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { membersById } from "@/lib/queries";
import { ActionButton, Avatar } from "@/components/client-ui";
import { Card, CardHeader, EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Invitations" };

export default async function Invitations() {
  const user = await requireUser();
  const store = await db();
  const [incoming, outgoing] = await Promise.all([store.all("connections", { addresseeId: user.id, status: "pending" }), store.all("connections", { requesterId: user.id, status: "pending" })]);
  const members = await membersById([...incoming.map((c) => c.requesterId), ...outgoing.map((c) => c.addresseeId)]);
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      <Link href="/network" className="text-sm text-brand hover:underline">← My Network</Link>
      <Card>
        <CardHeader title={`Invitations (${incoming.length})`} />
        {incoming.length === 0 ? <EmptyState title="No pending invitations" /> : (
          <ul className="divide-y divide-line">{incoming.map((c) => { const m = members.get(c.requesterId); return m && (
            <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <Link href={`/profile/${m.user.id}`}><Avatar src={m.profile?.avatarUrl} name={m.user.name} size={56} /></Link>
              <div className="min-w-0 flex-1"><Link href={`/profile/${m.user.id}`} className="font-semibold hover:underline">{m.user.name}</Link><p className="text-xs text-muted">{m.profile?.headline}</p><p className="text-xs text-muted">{timeAgo(c.createdAt)}</p></div>
              <ActionButton className="btn-ghost btn-sm" action={respondConnection.bind(null, c.id, false)}>Ignore</ActionButton>
              <ActionButton className="btn-secondary btn-sm" action={respondConnection.bind(null, c.id, true)}>Accept</ActionButton>
            </li>); })}</ul>
        )}
      </Card>
      <Card>
        <CardHeader title={`Sent (${outgoing.length})`} />
        {outgoing.length === 0 ? <EmptyState title="No sent requests" /> : <ul className="divide-y divide-line">{outgoing.map((c) => { const m = members.get(c.addresseeId); return m && <li key={c.id} className="flex items-center gap-3 px-4 py-3"><Avatar src={m.profile?.avatarUrl} name={m.user.name} size={40} /><span className="flex-1 text-sm font-medium">{m.user.name}</span><span className="text-xs text-muted">Pending · {timeAgo(c.createdAt)}</span></li>; })}</ul>}
      </Card>
    </div>
  );
}
