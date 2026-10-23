import type { Metadata } from "next";
import Link from "next/link";
import { Bell, Briefcase, CalendarClock, Heart, MessageCircle, MessageSquare, Settings, UserPlus, Users } from "lucide-react";
import { markAllNotificationsRead } from "@/app/actions/social";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { cn, timeAgo } from "@/lib/format";
import { ActionButton } from "@/components/client-ui";
import { Card, EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Notifications" };

const ICONS = { connection: UserPlus, group: Users, deadline: CalendarClock, post: Bell, comment: MessageCircle, reaction: Heart, system: Bell, job: Briefcase, message: MessageSquare };

export default async function Notifications({ searchParams }: { searchParams: { filter?: string } }) {
  const user = await requireUser();
  const store = await db();
  const all = (await store.all("notifications", { userId: user.id })).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const f = searchParams.filter;
  const list = all.filter((n) => !f || (f === "unread" ? !n.read : n.type === f));
  const unread = all.filter((n) => !n.read).length;
  return (
    <div className="mx-auto grid max-w-5xl gap-5 px-4 py-6 md:grid-cols-[220px_1fr]">
      <aside className="space-y-2">
        <Card className="p-3 text-sm">
          <ul className="space-y-1">
            {[["", "All"], ["unread", `Unread (${unread})`], ["connection", "Connections"], ["deadline", "Deadlines"], ["group", "Groups"], ["comment", "Comments"], ["job", "Jobs"], ["system", "Account"]].map(([k, l]) => (
              <li key={k}><Link href={k ? `/notifications?filter=${k}` : "/notifications"} className={cn("block rounded px-2 py-1.5 hover:bg-canvas", (f ?? "") === k && "bg-brand-50 font-semibold text-brand dark:bg-brand/10")}>{l}</Link></li>
            ))}
          </ul>
        </Card>
        <Link href="/settings#notifications" className="btn-ghost w-full"><Settings className="h-4 w-4" /> Notification settings</Link>
      </aside>
      <Card>
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h1 className="font-semibold">Notifications</h1>
          {unread > 0 && <ActionButton className="btn-ghost btn-sm" action={markAllNotificationsRead}>Mark all as read</ActionButton>}
        </div>
        {list.length === 0 ? <EmptyState icon={<Bell className="h-5 w-5" />} title="You're all caught up" /> : (
          <ul className="divide-y divide-line">{list.map((n) => {
            const I = ICONS[n.type] ?? Bell;
            return (
              <li key={n.id}><Link href={n.href} className={cn("flex gap-3 px-4 py-3 hover:bg-canvas", !n.read && "bg-brand-50/60 dark:bg-brand/5")}>
                <span className="mt-0.5 rounded-full bg-canvas p-2 text-brand"><I className="h-4 w-4" /></span>
                <span className="flex-1 text-sm">{n.text}<span className="block text-xs text-muted">{timeAgo(n.createdAt)}</span></span>
                {!n.read && <span className="mt-2 h-2 w-2 rounded-full bg-brand" aria-label="Unread" />}
              </Link></li>
            );
          })}</ul>
        )}
        <p className="border-t border-line p-3 text-xs text-muted">Notifications reflect real activity on NextStep. Email delivery starts once an email provider is configured; we'll never claim a reminder was emailed before then.</p>
      </Card>
    </div>
  );
}
