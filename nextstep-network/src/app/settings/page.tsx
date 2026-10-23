import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Clock } from "lucide-react";
import { generateParentCode, revokeParentAccess } from "@/app/actions/planning";
import { unblockUser } from "@/app/actions/social";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { label } from "@/lib/format";
import { requiresVerification } from "@/lib/permissions";
import { ActionButton } from "@/components/client-ui";
import { Card, Notice, PageHeader } from "@/components/ui";
import { DeleteAccountForm, NotificationPrefsForm, PasswordForm } from "./forms";

export const metadata: Metadata = { title: "Settings & Privacy" };

export default async function Settings() {
  const user = await requireUser();
  const store = await db();
  const [profile, prefs, links, blocks, users] = await Promise.all([
    store.find("profiles", { userId: user.id }), store.find("notification_prefs", { userId: user.id }), store.all("parent_links", { studentId: user.id }),
    store.all("blocks", { blockerId: user.id }), store.all("users"),
  ]);
  const name = (id: string) => users.find((u) => u.id === id)?.name ?? "Member";
  const nav = [["account", "Account"], ["privacy", "Privacy"], ["notifications", "Notifications"], ["parent", "Parent access"], ["blocked", "Blocked members"], ["data", "Your data"]];
  return (
    <div className="mx-auto grid max-w-5xl gap-5 px-4 py-6 md:grid-cols-[200px_1fr]">
      <nav className="card h-fit p-2 text-sm md:sticky md:top-20" aria-label="Settings sections">{nav.map(([id, l]) => <a key={id} href={`#${id}`} className="block rounded px-3 py-2 hover:bg-canvas">{l}</a>)}</nav>
      <div className="space-y-4">
        <PageHeader title="Settings & privacy" />
        <Card className="scroll-mt-20 p-5" id="account">
          <h2 className="font-semibold">Account</h2>
          <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
            <div><dt className="text-muted">Name</dt><dd>{user.name}</dd></div><div><dt className="text-muted">Email</dt><dd>{user.email}</dd></div>
            <div><dt className="text-muted">Account type</dt><dd>{label(user.role)}</dd></div><div><dt className="text-muted">Age group</dt><dd>{user.ageGroup === "minor" ? "Under 18 (extra protections on)" : "18 or older"}</dd></div>
            {requiresVerification(user.role) && <div><dt className="text-muted">Verification</dt><dd className="flex items-center gap-1">{user.verified ? <><BadgeCheck className="h-4 w-4 text-brand" /> Verified</> : <><Clock className="h-4 w-4 text-amber-500" /> Pending admin review</>}</dd></div>}
          </dl>
          <h3 className="mt-5 text-sm font-semibold">Change password</h3>
          <PasswordForm />
        </Card>
        <Card className="scroll-mt-20 p-5" id="privacy">
          <h2 className="font-semibold">Privacy</h2>
          <p className="mt-1 text-sm">Profile visibility: <strong>{profile?.visibility === "public" ? "All signed-in members" : profile?.visibility === "network" ? "Connections only" : "Only me"}</strong> · <Link href="/profile/edit" className="link">Change</Link> · <Link href="/profile/preview" className="link">Preview</Link></p>
          {user.ageGroup === "minor" && <div className="mt-3"><Notice tone="blue">Because you're under 18: your profile can't be public, adults can't send you connection requests, you won't appear in adults' search results, and direct messaging is off.</Notice></div>}
          <p className="mt-3 text-xs text-muted">Never shown publicly: your email, age group, applications, FAFSA progress, residency status, confirmation numbers, essays, courses and notes.</p>
        </Card>
        <Card className="scroll-mt-20 p-5" id="notifications"><h2 className="font-semibold">Notifications</h2><NotificationPrefsForm prefs={prefs ? { categories: prefs.categories, frequency: prefs.frequency, email: prefs.email } : null} /></Card>
        {user.role === "student" && (
          <Card className="scroll-mt-20 p-5" id="parent">
            <h2 className="font-semibold">Parent or guardian access</h2>
            <p className="mt-1 text-sm text-muted">Give a parent read-only access to your planning checklist (FAFSA steps, application statuses, deadlines). They can't see your posts, messages, essays or notes.</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {profile?.parentLinkCode ? <p className="rounded-lg bg-canvas px-3 py-2 font-mono text-lg tracking-widest">{profile.parentLinkCode}</p> : null}
              <ActionButton className="btn-secondary btn-sm" action={generateParentCode}>{profile?.parentLinkCode ? "Generate a new code" : "Generate link code"}</ActionButton>
            </div>
            {profile?.parentLinkCode && <p className="mt-1 text-xs text-muted">Share this one-time code with your parent. They enter it on their dashboard.</p>}
            <ul className="mt-3 space-y-1 text-sm">{links.map((l) => <li key={l.id} className="flex items-center gap-2">{name(l.parentId)} <ActionButton className="btn-ghost btn-sm text-red-600" confirm="Remove this parent's access?" action={revokeParentAccess.bind(null, l.parentId)}>Remove access</ActionButton></li>)}</ul>
          </Card>
        )}
        <Card className="scroll-mt-20 p-5" id="blocked">
          <h2 className="font-semibold">Blocked members</h2>
          {blocks.length === 0 ? <p className="mt-1 text-sm text-muted">You haven't blocked anyone.</p> : <ul className="mt-2 space-y-1 text-sm">{blocks.map((b) => <li key={b.id} className="flex items-center gap-2">{name(b.blockedId)} <ActionButton className="btn-ghost btn-sm" action={unblockUser.bind(null, b.blockedId)}>Unblock</ActionButton></li>)}</ul>}
        </Card>
        <Card className="scroll-mt-20 p-5" id="data">
          <h2 className="font-semibold">Your data</h2>
          <p className="mt-1 text-sm text-muted">Download a copy of everything stored about you, or permanently delete your account.</p>
          <a href="/api/export" className="btn-secondary mt-3">Export my data (JSON)</a>
          <DeleteAccountForm />
        </Card>
      </div>
    </div>
  );
}
