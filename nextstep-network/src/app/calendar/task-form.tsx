"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { addTask } from "@/app/actions/planning";
import { FormMessage, SubmitButton } from "@/components/client-ui";

export function TaskForm() {
  const [state, action] = useFormState(addTask, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) ref.current?.reset(); }, [state]);
  return (
    <form ref={ref} action={action} className="card space-y-2 p-4">
      <h2 className="font-semibold">Add a deadline or reminder</h2>
      <label htmlFor="tt" className="sr-only">Title</label><input id="tt" name="title" placeholder="e.g. Submit NC State application" className="input" required />
      <div className="grid grid-cols-2 gap-2">
        <div><label htmlFor="td" className="label text-xs">Date</label><input id="td" name="date" type="date" className="input py-1.5" /></div>
        <div><label htmlFor="tk" className="label text-xs">Type</label><select id="tk" name="kind" className="input py-1.5"><option value="application">Application</option><option value="fafsa">FAFSA</option><option value="scholarship">Scholarship</option><option value="job">Internship / job</option><option value="event">Event / visit</option><option value="personal">Personal</option></select></div>
      </div>
      <div className="flex items-center gap-2"><SubmitButton className="btn-primary btn-sm">Add</SubmitButton><FormMessage state={state} /></div>
    </form>
  );
}
