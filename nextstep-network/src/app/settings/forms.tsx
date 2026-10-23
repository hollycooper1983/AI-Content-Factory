"use client";

import { useFormState } from "react-dom";
import { changePassword, deleteAccount } from "@/app/actions/auth";
import { saveNotificationPrefs } from "@/app/actions/social";
import { FormMessage, SubmitButton } from "@/components/client-ui";

const CATS: [string, string][] = [["connection", "Connection requests"], ["group", "Group activity"], ["deadline", "Deadlines & reminders"], ["comment", "Comments on my posts"], ["reaction", "Reactions"], ["job", "Saved jobs & listings"], ["message", "Messages"], ["system", "Account & safety (recommended)"], ["post", "School & organization updates"]];

export function NotificationPrefsForm({ prefs }: { prefs: { categories: Record<string, boolean>; frequency: string; email: boolean } | null }) {
  const [state, action] = useFormState(saveNotificationPrefs, undefined);
  return (
    <form action={action} className="mt-3 space-y-3 text-sm">
      <fieldset className="grid gap-1 sm:grid-cols-2"><legend className="mb-1 font-medium">Notify me about</legend>
        {CATS.map(([k, l]) => <label key={k} className="flex items-center gap-2"><input type="checkbox" name={`cat_${k}`} defaultChecked={prefs ? prefs.categories[k] !== false : true} /> {l}</label>)}
      </fieldset>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2">Frequency <select name="frequency" defaultValue={prefs?.frequency ?? "realtime"} className="input w-auto py-1"><option value="realtime">As it happens</option><option value="daily">Daily digest</option><option value="weekly">Weekly digest</option></select></label>
        <label className="flex items-center gap-2"><input type="checkbox" name="email" defaultChecked={prefs?.email ?? false} /> Email me too</label>
      </div>
      <p className="text-xs text-muted">Email delivery and digests start once an email provider is configured. Until then, notifications appear in the app.</p>
      <div className="flex items-center gap-2"><SubmitButton className="btn-primary btn-sm">Save preferences</SubmitButton><FormMessage state={state} /></div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useFormState(changePassword, undefined);
  return (
    <form action={action} className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
      <input name="current" type="password" autoComplete="current-password" placeholder="Current password" aria-label="Current password" className="input" />
      <input name="next" type="password" autoComplete="new-password" placeholder="New password (10+ characters)" aria-label="New password" className="input" />
      <SubmitButton className="btn-secondary">Update</SubmitButton>
      <div className="sm:col-span-3"><FormMessage state={state} /></div>
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, action] = useFormState(deleteAccount, undefined);
  return (
    <form action={action} className="mt-5 rounded-lg border border-red-200 p-4 dark:border-red-500/30" onSubmit={(e) => { if (!confirm("Permanently delete your account and all data? This can't be undone.")) e.preventDefault(); }}>
      <p className="text-sm font-semibold text-red-700 dark:text-red-400">Delete account</p>
      <p className="text-xs text-muted">Deletes your profile, posts, comments, connections, planning data and messages you sent. Type DELETE to confirm.</p>
      <div className="mt-2 flex gap-2"><input name="confirm" aria-label="Type DELETE to confirm" className="input w-40" /><SubmitButton className="btn-danger">Delete</SubmitButton></div>
      <FormMessage state={state} />
    </form>
  );
}
