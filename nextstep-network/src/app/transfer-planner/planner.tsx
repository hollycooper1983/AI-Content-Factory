"use client";

import { useMemo, useState } from "react";
import { FlaskConical, Plus, Printer, Trash2 } from "lucide-react";
import { saveDoc } from "@/app/actions/planning";
import { money } from "@/lib/format";

export interface Course { id: string; semester: string; code: string; name: string; credits: number; lab: boolean; format: "online" | "hybrid" | "in_person"; status: "planned" | "in_progress" | "completed"; verified: boolean }
export interface Plan { cc: string; associate: string; major: string; targets: string[]; costPerCredit: number; feesPerSemester: number; courses: Course[] }

const rid = () => Math.random().toString(36).slice(2, 9);
const c = (semester: string, code: string, name: string, credits: number, lab = false): Course => ({ id: rid(), semester, code, name, credits, lab, format: lab ? "hybrid" : "online", status: "planned", verified: false });

const TEMPLATE: Course[] = [
  c("Fall 2027", "ENG 111", "Writing and Inquiry", 3), c("Fall 2027", "MAT 171", "Precalculus Algebra", 4), c("Fall 2027", "BIO 111", "General Biology I", 4, true), c("Fall 2027", "ACA 122", "College Transfer Success", 1),
  c("Spring 2028", "ENG 112", "Writing/Research in the Disciplines", 3), c("Spring 2028", "MAT 172", "Precalculus Trigonometry", 4), c("Spring 2028", "BIO 112", "General Biology II", 4, true), c("Spring 2028", "PSY 150", "General Psychology", 3),
  c("Fall 2028", "CHM 151", "General Chemistry I", 4, true), c("Fall 2028", "COM 231", "Public Speaking", 3), c("Fall 2028", "HIS 111", "World Civilizations I", 3), c("Fall 2028", "MAT 152", "Statistical Methods I", 4),
  c("Spring 2029", "CHM 152", "General Chemistry II", 4, true), c("Spring 2029", "ART 111", "Art Appreciation", 3), c("Spring 2029", "SOC 210", "Introduction to Sociology", 3), c("Spring 2029", "BIO 275", "Microbiology", 4, true),
];

const DEFAULT: Plan = { cc: "", associate: "Associate in Science (AS)", major: "Biology (BS)", targets: [], costPerCredit: 0, feesPerSemester: 0, courses: TEMPLATE };

export function TransferPlanner({ initial, communityColleges, universities }: { initial: Plan | null; communityColleges: { id: string; name: string }[]; universities: { id: string; name: string; url: string; online: boolean; labNote: string }[] }) {
  const [plan, setPlan] = useState<Plan>(initial ?? { ...DEFAULT, cc: communityColleges[0]?.id ?? "" });
  const [status, setStatus] = useState(initial ? "Loaded your saved plan" : "Starter template — not yet saved");
  const set = (p: Partial<Plan>) => { setPlan({ ...plan, ...p }); setStatus("Unsaved changes"); };
  const upd = (id: string, p: Partial<Course>) => set({ courses: plan.courses.map((x) => (x.id === id ? { ...x, ...p } : x)) });
  const semesters = useMemo(() => [...new Set(plan.courses.map((x) => x.semester))], [plan.courses]);
  const total = plan.courses.reduce((s, x) => s + x.credits, 0);
  const done = plan.courses.filter((x) => x.status === "completed").reduce((s, x) => s + x.credits, 0);
  const verified = plan.courses.filter((x) => x.verified);
  const labs = plan.courses.filter((x) => x.lab);
  const cost = total * plan.costPerCredit + semesters.length * plan.feesPerSemester;
  const save = async () => { setStatus("Saving…"); const r = await saveDoc("transfer_plan", plan as unknown as Record<string, unknown>); setStatus(r.ok ? "Saved" : "Couldn't save — plan too large?"); };
  return (
    <div className="space-y-4">
      <section className="card grid gap-3 p-5 md:grid-cols-2 lg:grid-cols-4">
        <div><label className="label" htmlFor="cc">1. Community college</label><select id="cc" className="input" value={plan.cc} onChange={(e) => set({ cc: e.target.value })}>{communityColleges.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
        <div><label className="label" htmlFor="assoc">2. Associate degree</label><select id="assoc" className="input" value={plan.associate} onChange={(e) => set({ associate: e.target.value })}>{["Associate in Science (AS)", "Associate in Arts (AA)", "Associate in Engineering (AE)", "Associate in Applied Science (AAS)", "Associate Degree Nursing (ADN)"].map((x) => <option key={x}>{x}</option>)}</select></div>
        <div><label className="label" htmlFor="major">3. Bachelor's major</label><input id="major" className="input" value={plan.major} onChange={(e) => set({ major: e.target.value })} /></div>
        <div><label className="label" htmlFor="targets">4. Target universities</label>
          <select id="targets" multiple className="input h-24" value={plan.targets} onChange={(e) => set({ targets: [...e.target.selectedOptions].map((o) => o.value) })}>{universities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
          <p className="mt-1 text-[11px] text-muted">Hold Ctrl/⌘ to pick several.</p></div>
      </section>
      {plan.associate.includes("AAS") && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">Applied science (AAS) degrees are designed for direct employment, and many courses may not transfer. Talk to an advisor before choosing this path for transfer.</p>}
      {plan.associate.includes("ADN") && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">Nursing programs include required in-person clinical placements. After licensure, many RNs complete an online RN-to-BSN program.</p>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="card overflow-x-auto p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line p-4">
            <h2 className="font-semibold">6. Semester-by-semester course plan</h2>
            <div className="flex gap-2 no-print">
              <button type="button" className="btn-secondary btn-sm" onClick={() => set({ courses: [...plan.courses, c(semesters[semesters.length - 1] ?? "Fall 2027", "", "", 3)] })}><Plus className="h-4 w-4" /> Course</button>
              <button type="button" className="btn-ghost btn-sm" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</button>
              <button type="button" className="btn-primary btn-sm" onClick={save}>Save plan</button>
            </div>
          </div>
          <p className="px-4 pt-2 text-xs text-muted" role="status">{status}</p>
          {semesters.map((sem) => (
            <div key={sem} className="px-4 py-3">
              <h3 className="mb-2 text-sm font-semibold">{sem} <span className="font-normal text-muted">· {plan.courses.filter((x) => x.semester === sem).reduce((s, x) => s + x.credits, 0)} credits</span></h3>
              <table className="w-full min-w-[820px] text-sm">
                <thead><tr className="text-left text-xs text-muted"><th className="pb-1">Semester</th><th>Code</th><th>Course</th><th>Cr</th><th>Format</th><th>In-person lab</th><th>Status</th><th>Transfer confirmed</th><th /></tr></thead>
                <tbody>{plan.courses.filter((x) => x.semester === sem).map((x) => (
                  <tr key={x.id} className="border-t border-line">
                    <td className="py-1 pr-1"><input aria-label="Semester" className="input w-28 py-1" value={x.semester} onChange={(e) => upd(x.id, { semester: e.target.value })} /></td>
                    <td className="pr-1"><input aria-label="Code" className="input w-20 py-1" value={x.code} onChange={(e) => upd(x.id, { code: e.target.value })} /></td>
                    <td className="pr-1"><input aria-label="Course name" className="input py-1" value={x.name} onChange={(e) => upd(x.id, { name: e.target.value })} /></td>
                    <td className="pr-1"><input aria-label="Credits" type="number" min={0} max={8} className="input w-14 py-1" value={x.credits} onChange={(e) => upd(x.id, { credits: Number(e.target.value) || 0 })} /></td>
                    <td className="pr-1"><select aria-label="Format" className="input py-1" value={x.format} onChange={(e) => upd(x.id, { format: e.target.value as Course["format"] })}><option value="online">Online</option><option value="hybrid">Hybrid</option><option value="in_person">In person</option></select></td>
                    <td className="text-center"><input aria-label="Requires in-person lab" type="checkbox" checked={x.lab} onChange={(e) => upd(x.id, { lab: e.target.checked })} /></td>
                    <td className="pr-1"><select aria-label="Status" className="input py-1" value={x.status} onChange={(e) => upd(x.id, { status: e.target.value as Course["status"] })}><option value="planned">Planned</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select></td>
                    <td className="text-center"><label className="inline-flex items-center gap-1 text-xs"><input type="checkbox" checked={x.verified} onChange={(e) => upd(x.id, { verified: e.target.checked })} /> {x.verified ? <span className="text-green-700">Verified</span> : <span className="text-amber-600">Unverified</span>}</label></td>
                    <td><button type="button" aria-label="Remove course" className="btn-ghost btn-sm" onClick={() => set({ courses: plan.courses.filter((y) => y.id !== x.id) })}><Trash2 className="h-4 w-4" /></button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ))}
          <p className="px-4 pb-4 text-xs text-muted">Starter courses follow a common NC Associate in Science transfer pattern and are examples only. Your college catalog and advisor determine actual requirements.</p>
        </section>
        <aside className="space-y-4">
          <section className="card p-4 text-sm">
            <h2 className="font-semibold">7. Progress</h2>
            <p className="mt-2">{done} of {total} credits completed</p>
            <div className="mt-1 h-2 rounded-full bg-canvas"><div className="h-2 rounded-full bg-teal" style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></div>
            <p className="mt-3"><strong className="text-green-700">{verified.length}</strong> courses verified · <strong className="text-amber-600">{plan.courses.length - verified.length}</strong> unverified</p>
          </section>
          <section className="card p-4 text-sm">
            <h2 className="flex items-center gap-2 font-semibold"><FlaskConical className="h-4 w-4 text-teal" /> 9. Courses with labs ({labs.length})</h2>
            <ul className="mt-2 space-y-1">{labs.map((x) => <li key={x.id}>{x.code} {x.name} <span className="text-xs text-muted">({x.format === "online" ? "online — confirm lab format" : x.format.replace("_", " ")})</span></li>)}</ul>
            <p className="mt-2 text-xs text-muted">Online lectures don't guarantee online labs. Some programs use at-home lab kits; others require campus lab sessions. Confirm each course's lab format.</p>
          </section>
          <section className="card p-4 text-sm">
            <h2 className="font-semibold">8. Estimated cost</h2>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div><label className="label text-xs" htmlFor="cpc">Tuition per credit ($)</label><input id="cpc" type="number" min={0} className="input py-1" value={plan.costPerCredit} onChange={(e) => set({ costPerCredit: Number(e.target.value) || 0 })} /></div>
              <div><label className="label text-xs" htmlFor="fps">Fees per semester ($)</label><input id="fps" type="number" min={0} className="input py-1" value={plan.feesPerSemester} onChange={(e) => set({ feesPerSemester: Number(e.target.value) || 0 })} /></div>
            </div>
            <p className="mt-2">Estimated total: <strong>{money(cost)}</strong> for {total} credits over {semesters.length} semesters (before aid).</p>
            <p className="mt-1 text-xs text-muted">Enter current rates from your college's official tuition page.</p>
          </section>
          <section className="card p-4 text-sm">
            <h2 className="font-semibold">5. Transfer agreements & resources</h2>
            <ul className="mt-2 space-y-1.5">
              {plan.targets.map((t) => { const u = universities.find((x) => x.id === t); return u && <li key={t}><a className="link" href={u.url} target="_blank" rel="noopener noreferrer">{u.name} — transfer admissions</a>{u.online && <span className="text-xs text-muted"> · online options</span>}{u.labNote && <p className="text-xs text-muted">{u.labNote}</p>}</li>; })}
              <li><a className="link" href="https://www.cfnc.org/" target="_blank" rel="noopener noreferrer">CFNC transfer planning</a></li>
              <li><a className="link" href="https://www.nccommunitycolleges.edu/" target="_blank" rel="noopener noreferrer">NC Community College System</a></li>
            </ul>
            <p className="mt-2 text-xs text-muted">Ask your advisor about North Carolina's Comprehensive Articulation Agreement and any bilateral agreements with your target universities.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
