"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { postJob } from "@/app/actions/admin";
import { FormMessage, SubmitButton } from "@/components/client-ui";

export function JobForm() {
  const [state, action] = useFormState(postJob, undefined);
  const [paid, setPaid] = useState(true);
  return (
    <form action={action} className="card grid gap-3 p-5 sm:grid-cols-2">
      <h2 className="font-semibold sm:col-span-2">Post an opportunity</h2>
      <div className="sm:col-span-2"><label className="label" htmlFor="jt">Title</label><input id="jt" name="title" className="input" required /></div>
      <div><label className="label" htmlFor="jl">Location</label><input id="jl" name="location" className="input" /></div>
      <div><label className="label" htmlFor="ja">Arrangement</label><select id="ja" name="arrangement" className="input"><option value="on_site">On-site</option><option value="hybrid">Hybrid</option><option value="remote">Remote</option></select></div>
      <div><label className="label" htmlFor="jc">Category</label><input id="jc" name="category" placeholder="Healthcare, Technology…" className="input" /></div>
      <div><label className="label" htmlFor="jlev">Level</label><select id="jlev" name="level" className="input"><option value="high_school">High school students</option><option value="college">College students</option><option value="graduate">Recent graduates</option></select></div>
      <div><label className="label" htmlFor="jm">Minimum age</label><input id="jm" name="minAge" type="number" min={14} max={99} className="input" /></div>
      <div><label className="label" htmlFor="js">Schedule</label><input id="js" name="schedule" placeholder="Part-time, Summer…" className="input" /></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="paid" checked={paid} onChange={(e) => setPaid(e.target.checked)} /> Paid position</label>
      {paid ? <div><label className="label" htmlFor="jp">Compensation</label><input id="jp" name="payText" placeholder="$16/hr" className="input" /></div> : <p className="text-sm text-amber-700">Will be clearly labeled as unpaid. Check labor law requirements for unpaid internships.</p>}
      <div><label className="label" htmlFor="jd">Application deadline</label><input id="jd" name="deadline" type="date" className="input" /></div>
      <div><label className="label" htmlFor="ju">Official application link (https)</label><input id="ju" name="url" type="url" className="input" /></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="jdesc">Description</label><textarea id="jdesc" name="description" rows={3} className="input" /></div>
      <div><label className="label" htmlFor="jr">Responsibilities (one per line)</label><textarea id="jr" name="responsibilities" rows={3} className="input" /></div>
      <div><label className="label" htmlFor="jq">Qualifications (one per line)</label><textarea id="jq" name="qualifications" rows={3} className="input" /></div>
      <div className="flex items-center gap-2 sm:col-span-2"><SubmitButton>Submit for review</SubmitButton><FormMessage state={state} /></div>
    </form>
  );
}
