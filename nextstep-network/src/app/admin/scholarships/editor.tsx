"use client";

import { useFormState } from "react-dom";
import { saveScholarship } from "@/app/actions/admin";
import { FormMessage, SubmitButton } from "@/components/client-ui";
import type { Scholarship } from "@/lib/types";

export function ScholarshipEditor({ s }: { s: Scholarship | null }) {
  const [state, action] = useFormState(saveScholarship, undefined);
  const f = (name: string, labelText: string, def?: string | number | null, type = "text") => (
    <div><label className="label text-xs" htmlFor={`s-${name}`}>{labelText}</label><input id={`s-${name}`} name={name} type={type} defaultValue={def ?? ""} className="input py-1.5" /></div>
  );
  return (
    <form action={action} className="card grid gap-3 p-5 sm:grid-cols-2">
      {s && <input type="hidden" name="id" value={s.id} />}
      <h2 className="font-semibold sm:col-span-2">{s ? `Edit: ${s.name}` : "New scholarship"}</h2>
      {f("name", "Name", s?.name)}{f("sponsor", "Sponsor", s?.sponsor)}
      {f("url", "Official URL (https)", s?.url, "url")}{f("amountText", "Award amount (text)", s?.amountText)}
      {f("amountMax", "Max award ($, optional)", s?.amountMax, "number")}{f("deadline", "Deadline (verified only)", s?.deadline, "date")}
      {f("deadlineNote", "Deadline note", s?.deadlineNote)}{f("tags", "Tags (comma-separated)", s?.tags.join(", "))}
      {f("states", "States (comma-separated, blank = national)", s?.states.join(", "))}{f("documents", "Required documents", s?.documents.join(", "))}
      <div className="sm:col-span-2"><label className="label text-xs" htmlFor="s-elig">Eligibility</label><textarea id="s-elig" name="eligibility" rows={2} defaultValue={s?.eligibility} className="input" /></div>
      <fieldset className="flex flex-wrap gap-3 text-sm sm:col-span-2">
        {(["high_school", "college", "transfer"] as const).map((l) => <label key={l} className="flex items-center gap-1"><input type="checkbox" name={`level_${l}`} defaultChecked={s?.levels.includes(l)} /> {l.replace("_", " ")}</label>)}
        {[["essay", s?.essay], ["renewable", s?.renewable], ["needBased", s?.needBased], ["firstGen", s?.firstGen]].map(([k, v]) => <label key={k as string} className="flex items-center gap-1"><input type="checkbox" name={k as string} defaultChecked={!!v} /> {k as string}</label>)}
      </fieldset>
      <div><label className="label text-xs" htmlFor="s-v">Verification</label><select id="s-v" name="vstatus" defaultValue={s?.verification.status ?? "unverified"} className="input py-1.5"><option value="unverified">Unverified</option><option value="verified">Verified (checked against sponsor site today)</option></select></div>
      <div><label className="label text-xs" htmlFor="s-p">Workflow status</label><select id="s-p" name="publishStatus" defaultValue={s?.publishStatus ?? "draft"} className="input py-1.5"><option value="draft">Draft</option><option value="pending_review">Pending Review</option><option value="approved">Approved</option><option value="published">Published</option><option value="archived">Archived</option></select></div>
      <div className="flex items-center gap-2 sm:col-span-2"><SubmitButton>Save</SubmitButton><FormMessage state={state} /></div>
    </form>
  );
}
