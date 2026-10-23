"use client";

import { useFormState } from "react-dom";
import { saveAidOffer } from "@/app/actions/planning";
import { FormMessage, SubmitButton } from "@/components/client-ui";

const FIELDS: [string, string][] = [
  ["tuition", "Tuition"], ["fees", "Fees"], ["housing", "Housing & food"], ["books", "Books & materials"], ["transportation", "Transportation"],
  ["grants", "Grants (gift)"], ["scholarships", "Scholarships (gift)"], ["workStudy", "Work-study (earned)"], ["loans", "Federal loans (debt)"],
];

export function OfferForm() {
  const [state, action] = useFormState(saveAidOffer, undefined);
  return (
    <form action={action} className="card mt-4 space-y-3 p-5">
      <h2 className="font-semibold">Add an aid offer</h2>
      <div><label className="label" htmlFor="collegeName">School</label><input id="collegeName" name="collegeName" className="input" required /></div>
      <div className="grid gap-3 sm:grid-cols-3">
        {FIELDS.map(([k, l]) => (
          <div key={k}><label className="label text-xs" htmlFor={k}>{l} ($/year)</label><input id={k} name={k} type="number" min={0} step={50} defaultValue={0} className="input py-1.5" /></div>
        ))}
      </div>
      <div className="flex items-center gap-2"><SubmitButton>Add offer</SubmitButton><FormMessage state={state} /></div>
    </form>
  );
}
