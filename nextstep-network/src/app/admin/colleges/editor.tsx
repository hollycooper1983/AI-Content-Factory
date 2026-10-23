"use client";

import { useFormState } from "react-dom";
import { updateCollege } from "@/app/actions/admin";
import { FormMessage, SubmitButton } from "@/components/client-ui";
import type { College } from "@/lib/types";

export function CollegeEditor({ college: c }: { college: College }) {
  const [state, action] = useFormState(updateCollege, undefined);
  return (
    <form action={action} className="card grid gap-3 p-5 sm:grid-cols-3">
      <input type="hidden" name="id" value={c.id} />
      <h2 className="font-semibold sm:col-span-3">Edit: {c.name}</h2>
      <div><label className="label text-xs" htmlFor="tin">In-state tuition ($/yr)</label><input id="tin" name="tuitionInState" type="number" min={0} defaultValue={c.tuitionInState ?? ""} className="input py-1.5" /></div>
      <div><label className="label text-xs" htmlFor="tout">Out-of-state tuition ($/yr)</label><input id="tout" name="tuitionOutState" type="number" min={0} defaultValue={c.tuitionOutState ?? ""} className="input py-1.5" /></div>
      <div><label className="label text-xs" htmlFor="fee">Application fee ($)</label><input id="fee" name="appFee" type="number" min={0} defaultValue={c.appFee ?? ""} className="input py-1.5" /></div>
      <div className="sm:col-span-3"><label className="label text-xs" htmlFor="tp">Testing policy</label><input id="tp" name="testPolicy" defaultValue={c.testPolicy} className="input py-1.5" /></div>
      <div className="sm:col-span-3"><label className="label text-xs" htmlFor="fa">Free application / fee waiver note</label><input id="fa" name="freeAppNote" defaultValue={c.freeAppNote} className="input py-1.5" /></div>
      <div className="sm:col-span-3"><label className="label text-xs" htmlFor="ln">Lab note</label><input id="ln" name="labNote" defaultValue={c.labNote} className="input py-1.5" /></div>
      <div><label className="label text-xs" htmlFor="vs">Verification</label><select id="vs" name="vstatus" defaultValue={c.verification.status} className="input py-1.5"><option value="unverified">Unverified</option><option value="verified">Verified</option><option value="demo">Demo</option></select></div>
      <div><label className="label text-xs" htmlFor="src">Source description</label><input id="src" name="source" defaultValue={c.verification.source} className="input py-1.5" /></div>
      <div><label className="label text-xs" htmlFor="surl">Source URL (https)</label><input id="surl" name="sourceUrl" defaultValue={c.verification.sourceUrl} className="input py-1.5" /></div>
      <div><label className="label text-xs" htmlFor="ps">Publish status</label><select id="ps" name="publishStatus" defaultValue={c.publishStatus} className="input py-1.5"><option value="draft">Draft</option><option value="pending_review">Pending Review</option><option value="approved">Approved</option><option value="published">Published</option><option value="archived">Archived</option></select></div>
      <div className="flex items-center gap-2 sm:col-span-3"><SubmitButton>Save college</SubmitButton><FormMessage state={state} /></div>
    </form>
  );
}
