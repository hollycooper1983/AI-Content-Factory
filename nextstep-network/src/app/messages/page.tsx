import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare, ShieldCheck } from "lucide-react";
import { blockUser } from "@/app/actions/social";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { cn, timeAgo } from "@/lib/format";
import { MINOR_MESSAGING_ENABLED } from "@/lib/permissions";
import { blockedIds, membersById } from "@/lib/queries";
import { ActionButton, Avatar } from "@/components/client-ui";
import { Card, EmptyState, Notice } from "@/components/ui";
import { MessageComposer, ReportMessage } from "./composer";

export const metadata: Metadata = { title: "Messaging" };

export default async function Messages({ searchParams }: { searchParams: { c?: string; q?: string; notice?: string } }) {
  const user = await requireUser();
  if (user.ageGroup === "minor" && !MINOR_MESSAGING_ENABLED) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Card className="p-8 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-teal" />
          <h1 className="mt-3 text-xl font-bold">Messaging is turned off for members under 18</h1>
          <p className="mt-2 text-sm text-muted">To keep students safe, direct messages are disabled for younger members while we finish supervised messaging protections (guardian visibility and moderator review). You can still post in moderated groups, comment on posts and connect with classmates and verified counselors.</p>
          <div className="mt-5 flex justify-center gap-2"><Link href="/groups" className="btn-primary">Go to groups</Link><Link href="/network" className="btn-secondary">My Network</Link></div>
        </Card>
      </div>
    );
  }
  const store = await db();
  const blocked = await blockedIds(user.id);
  const convs = (await store.all("conversations")).filter((c) => c.participantIds.includes(user.id)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const allMsgs = await store.all("messages");
  const people = await membersById(convs.flatMap((c) => c.participantIds));
  const other = (c: (typeof convs)[number]) => people.get(c.participantIds.find((p) => p !== user.id) ?? "");
  const q = (searchParams.q ?? "").toLowerCase();
  const list = convs.filter((c) => !q || other(c)?.user.name.toLowerCase().includes(q) || allMsgs.some((m) => m.conversationId === c.id && m.body.toLowerCase().includes(q)));
  const active = convs.find((c) => c.id === searchParams.c) ?? null;
  const thread = active ? allMsgs.filter((m) => m.conversationId === active.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)) : [];
  if (active) for (const m of thread) if (!m.readBy.includes(user.id)) await store.update("messages", m.id, { readBy: [...m.readBy, user.id] });
  const o = active ? other(active) : undefined;
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {searchParams.notice && <div className="mb-4"><Notice tone="amber">{searchParams.notice}</Notice></div>}
      <Card className="grid min-h-[600px] overflow-hidden md:grid-cols-[320px_1fr]">
        <div className={cn("border-r border-line", active && "hidden md:block")}>
          <div className="border-b border-line p-3">
            <h1 className="font-semibold">Messaging</h1>
            <form className="mt-2"><label htmlFor="mq" className="sr-only">Search messages</label><input id="mq" name="q" defaultValue={searchParams.q} placeholder="Search messages" className="input py-1.5" /></form>
          </div>
          {list.length === 0 ? <EmptyState icon={<MessageSquare className="h-5 w-5" />} title="No conversations" body="Message a connection from their profile or My Network." /> : (
            <ul>{list.map((c) => {
              const m = other(c);
              const msgs = allMsgs.filter((x) => x.conversationId === c.id);
              const last = msgs.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
              const unread = msgs.filter((x) => !x.readBy.includes(user.id)).length;
              return (
                <li key={c.id}><Link href={`/messages?c=${c.id}`} className={cn("flex gap-3 border-l-4 px-3 py-3 hover:bg-canvas", c.id === active?.id ? "border-brand bg-canvas" : "border-transparent")}>
                  <Avatar src={m?.profile?.avatarUrl} name={m?.user.name ?? "?"} size={44} />
                  <div className="min-w-0 flex-1"><p className="flex justify-between text-sm"><span className={unread ? "font-bold" : "font-medium"}>{m?.user.name}</span><span className="text-xs text-muted">{last ? timeAgo(last.createdAt) : ""}</span></p>
                    <p className={cn("truncate text-xs", unread ? "font-semibold text-fg" : "text-muted")}>{last?.body ?? "No messages yet"}</p></div>
                  {unread > 0 && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand" aria-label={`${unread} unread`} />}
                </Link></li>
              );
            })}</ul>
          )}
          <p className="border-t border-line p-3 text-[11px] text-muted">You can message accepted connections. There are no open message requests from strangers. Notification settings are in <Link href="/settings#notifications" className="link">Settings</Link>.</p>
        </div>
        <div className={cn("flex flex-col", !active && "hidden md:flex")}>
          {!active || !o ? <div className="flex flex-1 items-center justify-center"><EmptyState title="Select a conversation" /></div> : (
            <>
              <div className="flex items-center gap-3 border-b border-line p-3">
                <Link href="/messages" className="btn-ghost btn-sm md:hidden">←</Link>
                <Avatar src={o.profile?.avatarUrl} name={o.user.name} size={40} />
                <div className="min-w-0 flex-1"><Link href={`/profile/${o.user.id}`} className="font-semibold hover:underline">{o.user.name}</Link><p className="truncate text-xs text-muted">{o.profile?.headline}</p></div>
                {!blocked.has(o.user.id) && <ActionButton className="btn-ghost btn-sm text-red-600" confirm={`Block ${o.user.name}?`} action={blockUser.bind(null, o.user.id)}>Block</ActionButton>}
                <ReportMessage conversationId={active.id} />
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {thread.map((m) => (
                  <div key={m.id} className={cn("max-w-[75%] rounded-2xl px-3 py-2 text-sm", m.senderId === user.id ? "ml-auto bg-brand text-white" : "bg-canvas")}>
                    <p className="whitespace-pre-wrap">{m.body}</p><p className={cn("mt-1 text-[10px]", m.senderId === user.id ? "text-blue-100" : "text-muted")}>{timeAgo(m.createdAt)}</p>
                  </div>
                ))}
                {thread.length === 0 && <p className="text-center text-sm text-muted">Say hello! Keep it professional and never share passwords or ID numbers.</p>}
              </div>
              {blocked.has(o.user.id) ? <p className="border-t border-line p-3 text-sm text-muted">Messaging is unavailable with this member.</p> : <MessageComposer conversationId={active.id} />}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
