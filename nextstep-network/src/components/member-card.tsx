import Link from "next/link";
import { requestConnection } from "@/app/actions/social";
import type { Member } from "@/lib/queries";
import { Avatar, ResultActionButton } from "./client-ui";

export function MemberCard({ m, canConnect, reason }: { m: Member; canConnect: boolean; reason?: string }) {
  return (
    <div className="card flex flex-col items-center p-4 text-center">
      <Link href={`/profile/${m.user.id}`}><Avatar src={m.profile?.avatarUrl} name={m.user.name} size={72} /></Link>
      <Link href={`/profile/${m.user.id}`} className="mt-2 font-semibold hover:underline">{m.user.name}</Link>
      <p className="line-clamp-2 min-h-[32px] text-xs text-muted">{m.profile?.headline}</p>
      <div className="mt-3">{canConnect ? <ResultActionButton className="btn-secondary btn-sm" action={requestConnection.bind(null, m.user.id)}>+ Connect</ResultActionButton> : <p className="text-[11px] text-muted">{reason}</p>}</div>
    </div>
  );
}
