"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { CheckSquare, ChevronDown, ExternalLink, Square, Trash2 } from "lucide-react";
import { removeApplication, toggleChecklist, updateApplication } from "@/app/actions/planning";
import { APP_CHECKLIST } from "@/lib/progress";
import { cn, daysUntil, formatDate, label } from "@/lib/format";
import type { CollegeApplication } from "@/lib/types";
import { ActionButton, FormMessage, SubmitButton } from "@/components/client-ui";
import { Progress, StatusPill } from "@/components/ui";

export function AppCard({ app, collegeName, admissionsUrl, pct, wide }: { app: CollegeApplication; collegeName: string; admissionsUrl: string; pct: number; wide?: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(updateApplication, undefined);
  const d = daysUntil(app.deadline);
  return (
    <article className="card p-3 text-sm">
      <div className={cn("flex gap-3", wide ? "items-center" : "flex-col")}>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{collegeName}</p>
          <p className="text-xs text-muted">{app.appType}{app.fee != null ? ` · Fee ${app.fee === 0 ? "none" : "$" + app.fee}` : ""}{app.feeWaiver ? " · Fee waiver" : ""}</p>
          {app.deadline && <p className={cn("text-xs", d != null && d < 0 ? "text-red-600" : d != null && d <= 14 ? "font-semibold text-amber-600" : "text-muted")}>Deadline {formatDate(app.deadline)}{d != null && d >= 0 ? ` · ${d} days` : ""}</p>}
        </div>
        <div className={wide ? "w-40" : ""}><Progress value={pct} label="Checklist" /><p className="mt-1 text-xs text-muted">{pct}% complete</p></div>
        <div className="flex items-center justify-between gap-2"><StatusPill status={app.status} />
          <button type="button" className="btn-ghost btn-sm" aria-expanded={open} onClick={() => setOpen((o) => !o)}>Details <ChevronDown className={cn("h-3.5 w-3.5 transition", open && "rotate-180")} /></button>
        </div>
      </div>
      {open && (
        <div className="mt-3 space-y-4 border-t border-line pt-3">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted">Checklist</p>
            <ul className="space-y-1">
              {APP_CHECKLIST.map((c) => (
                <li key={c.id}>
                  <ActionButton className="flex w-full items-center gap-2 rounded px-1 py-0.5 text-left hover:bg-canvas" action={toggleChecklist.bind(null, app.id, c.id)}>
                    {app.checklist[c.id] ? <CheckSquare className="h-4 w-4 text-teal" /> : <Square className="h-4 w-4 text-muted" />}<span className={app.checklist[c.id] ? "line-through text-muted" : ""}>{c.label}</span>
                  </ActionButton>
                </li>
              ))}
            </ul>
            <p className="mt-1 text-[11px] text-muted">Requirements vary by college. Confirm on the official admissions site — we don't assume any course or document meets a requirement.</p>
          </div>
          <form action={action} className="grid gap-2 sm:grid-cols-2">
            <input type="hidden" name="id" value={app.id} />
            <div><label className="label text-xs" htmlFor={`st-${app.id}`}>Status</label>
              <select id={`st-${app.id}`} name="status" defaultValue={app.status} className="input py-1.5">{["interested", "preparing", "in_progress", "submitted", "under_review", "accepted", "waitlisted", "declined", "enrolled"].map((s) => <option key={s} value={s}>{label(s)}</option>)}</select></div>
            <div><label className="label text-xs" htmlFor={`ty-${app.id}`}>Application type</label><input id={`ty-${app.id}`} name="appType" defaultValue={app.appType} className="input py-1.5" /></div>
            <div><label className="label text-xs" htmlFor={`dl-${app.id}`}>Deadline</label><input id={`dl-${app.id}`} type="date" name="deadline" defaultValue={app.deadline ?? ""} className="input py-1.5" /></div>
            <div><label className="label text-xs" htmlFor={`fee-${app.id}`}>Application fee ($)</label><input id={`fee-${app.id}`} type="number" min={0} name="fee" defaultValue={app.fee ?? ""} className="input py-1.5" /></div>
            <div><label className="label text-xs" htmlFor={`sub-${app.id}`}>Submitted on</label><input id={`sub-${app.id}`} type="date" name="submittedAt" defaultValue={app.submittedAt?.slice(0, 10) ?? ""} className="input py-1.5" /></div>
            <div><label className="label text-xs" htmlFor={`dec-${app.id}`}>Decision date</label><input id={`dec-${app.id}`} type="date" name="decisionDate" defaultValue={app.decisionDate ?? ""} className="input py-1.5" /></div>
            <div><label className="label text-xs" htmlFor={`dep-${app.id}`}>Enrollment deposit</label><input id={`dep-${app.id}`} name="enrollmentDeposit" defaultValue={app.enrollmentDeposit} placeholder="e.g. Paid May 1" className="input py-1.5" /></div>
            <div><label className="label text-xs" htmlFor={`cn-${app.id}`}>Confirmation number (private)</label><input id={`cn-${app.id}`} name="confirmationNumber" defaultValue={app.confirmationNumber} autoComplete="off" className="input py-1.5" /></div>
            <label className="flex items-center gap-2 text-xs sm:col-span-2"><input type="checkbox" name="feeWaiver" defaultChecked={app.feeWaiver} /> I have a verified fee waiver</label>
            <div className="sm:col-span-2"><label className="label text-xs" htmlFor={`n-${app.id}`}>Notes (essay, GPA, testing, residency requirements…)</label><textarea id={`n-${app.id}`} name="notes" defaultValue={app.notes} rows={3} className="input" /></div>
            <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
              <SubmitButton className="btn-primary btn-sm">Save</SubmitButton>
              <a href={admissionsUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm">Official application <ExternalLink className="h-3.5 w-3.5" /></a>
              <ActionButton className="btn-ghost btn-sm text-red-600" confirm={`Remove ${collegeName} from your tracker?`} action={removeApplication.bind(null, app.id)}><Trash2 className="h-3.5 w-3.5" /> Remove</ActionButton>
              <FormMessage state={state} />
            </div>
          </form>
        </div>
      )}
    </article>
  );
}
