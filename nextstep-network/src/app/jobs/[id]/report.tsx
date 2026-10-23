"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { report } from "@/app/actions/social";
import { FormMessage, SubmitButton } from "@/components/client-ui";

export function ReportJob({ jobId }: { jobId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(report, undefined);
  if (!open) return <button type="button" className="mt-3 text-xs font-semibold text-red-600 hover:underline" onClick={() => setOpen(true)}>Report suspicious listing</button>;
  return (
    <form action={action} className="mt-3 flex flex-wrap gap-2">
      <input type="hidden" name="targetType" value="job" /><input type="hidden" name="targetId" value={jobId} />
      <label htmlFor="jr" className="sr-only">Reason</label>
      <select id="jr" name="reason" className="input w-auto" defaultValue="Fake or fraudulent listing"><option>Fake or fraudulent listing</option><option>Asks for payment</option><option>Inappropriate for students</option><option>Other</option></select>
      <SubmitButton className="btn-danger btn-sm">Report</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
