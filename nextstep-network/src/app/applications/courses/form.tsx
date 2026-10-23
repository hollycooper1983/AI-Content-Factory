"use client";

import { useFormState } from "react-dom";
import { addCourse } from "@/app/actions/planning";
import { FormMessage, SubmitButton } from "@/components/client-ui";

export function CourseForm() {
  const [state, action] = useFormState(addCourse, undefined);
  return (
    <form action={action} className="card mt-4 grid gap-2 p-4 sm:grid-cols-7">
      <div className="sm:col-span-2"><label className="label text-xs" htmlFor="cname">Course</label><input id="cname" name="name" className="input py-1.5" required /></div>
      <div><label className="label text-xs" htmlFor="cy">School year</label><input id="cy" name="schoolYear" placeholder="2026–27" className="input py-1.5" /></div>
      <div><label className="label text-xs" htmlFor="ct">Term</label><select id="ct" name="term" className="input py-1.5"><option>Full year</option><option>Fall</option><option>Spring</option><option>Semester 1</option><option>Semester 2</option><option>Trimester 1</option><option>Trimester 2</option><option>Trimester 3</option><option>Summer</option></select></div>
      <div><label className="label text-xs" htmlFor="cl">Level</label><select id="cl" name="level" className="input py-1.5"><option value="standard">Standard</option><option value="honors">Honors</option><option value="ap">AP</option><option value="ib">IB</option><option value="dual_enrollment">Dual enrollment</option><option value="college">College</option></select></div>
      <div><label className="label text-xs" htmlFor="cc">Credit</label><input id="cc" name="credit" type="number" step="0.5" min="0" defaultValue={1} className="input py-1.5" /></div>
      <div><label className="label text-xs" htmlFor="cg">Grade</label><input id="cg" name="grade" placeholder="A-" className="input py-1.5" /></div>
      <div className="flex items-center gap-2 sm:col-span-7"><SubmitButton className="btn-primary btn-sm">Add course</SubmitButton><FormMessage state={state} /></div>
    </form>
  );
}
