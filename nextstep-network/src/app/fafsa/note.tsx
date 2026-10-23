"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { saveFafsaNote } from "@/app/actions/planning";
import { FormMessage, SubmitButton } from "@/components/client-ui";

export function StepNote({ stepId, initial }: { stepId: string; initial: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(saveFafsaNote, undefined);
  if (!open) return (
    <div className="mt-1">
      {initial && <p className="text-xs italic text-fg">Note: {initial}</p>}
      <button type="button" className="text-xs font-semibold text-brand hover:underline" onClick={() => setOpen(true)}>{initial ? "Edit note" : "Add note"}</button>
    </div>
  );
  return (
    <form action={action} className="mt-2 flex flex-wrap gap-2">
      <input type="hidden" name="stepId" value={stepId} />
      <label htmlFor={`note-${stepId}`} className="sr-only">Progress note</label>
      <input id={`note-${stepId}`} name="note" defaultValue={initial} maxLength={300} placeholder="Non-sensitive note (no SSNs or passwords)" className="input flex-1 py-1.5" />
      <SubmitButton className="btn-secondary btn-sm">Save</SubmitButton>
      <button type="button" className="btn-ghost btn-sm" onClick={() => setOpen(false)}>Close</button>
      <div className="w-full"><FormMessage state={state} /></div>
    </form>
  );
}
