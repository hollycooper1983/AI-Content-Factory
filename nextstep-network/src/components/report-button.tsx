"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { report } from "@/app/actions/social";
import { FormMessage, SubmitButton } from "./client-ui";

export function ReportButton({ targetType, targetId, reasons, label = "Report" }: { targetType: "user" | "job" | "group"; targetId: string; reasons: string[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(report, undefined);
  if (state?.ok) return <p role="status" className="text-sm text-green-700 dark:text-green-400">{state.ok}</p>;
  if (!open) return <button type="button" className="btn-ghost text-red-600" onClick={() => setOpen(true)}>{label}</button>;
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="targetType" value={targetType} /><input type="hidden" name="targetId" value={targetId} />
      <label htmlFor={`rep-${targetId}`} className="sr-only">Reason</label>
      <select id={`rep-${targetId}`} name="reason" className="input w-auto py-1.5" defaultValue={reasons[0]}>{reasons.map((r) => <option key={r}>{r}</option>)}</select>
      <SubmitButton className="btn-danger btn-sm">Send report</SubmitButton>
      <button type="button" className="btn-ghost btn-sm" onClick={() => setOpen(false)}>Cancel</button>
      <FormMessage state={state} />
    </form>
  );
}
