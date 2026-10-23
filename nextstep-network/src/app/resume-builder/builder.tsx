"use client";

import { useState } from "react";
import { Plus, Printer, RotateCcw, Trash2 } from "lucide-react";
import { saveDoc } from "@/app/actions/planning";
import { WritingAssist } from "@/components/ai-advisor";
import { cn } from "@/lib/format";

type Item = { title: string; org: string; dates: string; details: string };
export interface Resume {
  template: "classic" | "modern" | "compact"; name: string; email: string; location: string; headline: string; summary: string;
  education: Item[]; experience: Item[]; volunteer: Item[]; projects: Item[]; awards: Item[]; certifications: Item[]; skills: string;
}
type ListKey = "education" | "experience" | "volunteer" | "projects" | "awards" | "certifications";
const SECTIONS: [ListKey, string][] = [["education", "Education"], ["experience", "Work Experience"], ["volunteer", "Volunteer Service"], ["projects", "Projects"], ["awards", "Achievements & Activities"], ["certifications", "Certifications"]];

export function ResumeBuilder({ initial, fromProfile, hasSaved }: { initial: Resume; fromProfile: Resume; hasSaved: boolean }) {
  const [r, setR] = useState<Resume>(initial);
  const [status, setStatus] = useState(hasSaved ? "Loaded your saved resume" : "Pre-filled from your profile — not saved yet");
  const set = (p: Partial<Resume>) => { setR({ ...r, ...p }); setStatus("Unsaved changes"); };
  const setItem = (k: ListKey, i: number, p: Partial<Item>) => set({ [k]: r[k].map((x, j) => (j === i ? { ...x, ...p } : x)) } as Partial<Resume>);
  const save = async () => { setStatus("Saving…"); const res = await saveDoc("resume", r as unknown as Record<string, unknown>); setStatus(res.ok ? "Saved" : "Couldn't save"); };
  const heading = { classic: "border-b border-black/70 pb-0.5 text-[13px] font-bold uppercase tracking-wide", modern: "text-[13px] font-bold uppercase tracking-wider text-[#2563EB]", compact: "text-[12px] font-bold" }[r.template];
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="no-print space-y-4">
        <section className="card space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Template:</span>
            {(["classic", "modern", "compact"] as const).map((t) => <button key={t} type="button" aria-pressed={r.template === t} onClick={() => set({ template: t })} className={cn("chip capitalize", r.template === t && "border-brand text-brand")}>{t}</button>)}
            <button type="button" className="btn-ghost btn-sm ml-auto" onClick={() => { if (confirm("Replace with your current profile data?")) set(fromProfile); }}><RotateCcw className="h-4 w-4" /> Reset from profile</button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="input" aria-label="Name" placeholder="Name" value={r.name} onChange={(e) => set({ name: e.target.value })} />
            <input className="input" aria-label="Email" placeholder="Email" value={r.email} onChange={(e) => set({ email: e.target.value })} />
            <input className="input" aria-label="City, State" placeholder="City, State" value={r.location} onChange={(e) => set({ location: e.target.value })} />
            <input className="input" aria-label="Headline" placeholder="Headline" value={r.headline} onChange={(e) => set({ headline: e.target.value })} />
          </div>
          <p className="text-xs text-muted">Don't include your home address, birth date or ID numbers on a resume.</p>
          <textarea className="input" rows={3} aria-label="Summary" placeholder="Summary" value={r.summary} onChange={(e) => set({ summary: e.target.value })} />
          <WritingAssist mode="resume" getText={() => r.summary} label="Improve summary with AI" />
        </section>
        {SECTIONS.map(([k, l]) => (
          <section key={k} className="card space-y-2 p-4">
            <div className="flex items-center justify-between"><h2 className="font-semibold">{l}</h2><button type="button" className="btn-ghost btn-sm" onClick={() => set({ [k]: [...r[k], { title: "", org: "", dates: "", details: "" }] } as Partial<Resume>)}><Plus className="h-4 w-4" /> Add</button></div>
            {r[k].map((it, i) => (
              <div key={i} className="grid gap-2 rounded-lg border border-line p-2 sm:grid-cols-3">
                <input className="input py-1.5" aria-label={`${l} title`} placeholder="Title / degree" value={it.title} onChange={(e) => setItem(k, i, { title: e.target.value })} />
                <input className="input py-1.5" aria-label="Organization" placeholder="Organization / school" value={it.org} onChange={(e) => setItem(k, i, { org: e.target.value })} />
                <input className="input py-1.5" aria-label="Dates" placeholder="Dates" value={it.dates} onChange={(e) => setItem(k, i, { dates: e.target.value })} />
                <textarea className="input py-1.5 sm:col-span-3" rows={2} aria-label="Details" placeholder="Bullet points (one per line)" value={it.details} onChange={(e) => setItem(k, i, { details: e.target.value })} />
                <button type="button" className="btn-ghost btn-sm justify-self-start text-red-600" onClick={() => set({ [k]: r[k].filter((_, j) => j !== i) } as Partial<Resume>)}><Trash2 className="h-4 w-4" /> Remove</button>
              </div>
            ))}
          </section>
        ))}
        <section className="card p-4"><label htmlFor="skills" className="label">Skills (comma-separated)</label><input id="skills" className="input" value={r.skills} onChange={(e) => set({ skills: e.target.value })} /></section>
        <div className="sticky bottom-20 flex items-center gap-2 rounded-xl border border-line bg-surface p-3 shadow-lg lg:bottom-4">
          <button type="button" className="btn-primary" onClick={save}>Save resume</button>
          <button type="button" className="btn-secondary" onClick={() => window.print()}><Printer className="h-4 w-4" /> Download PDF</button>
          <span className="text-xs text-muted" role="status">{status}</span>
        </div>
        <p className="text-xs text-muted">“Download PDF” opens your browser's print dialog — choose “Save as PDF”.</p>
      </div>
      <div className="lg:sticky lg:top-20 lg:h-fit">
        <article className={cn("print-area mx-auto aspect-[8.5/11] w-full max-w-[640px] overflow-hidden bg-white p-8 text-[11px] leading-snug text-black shadow-xl", r.template === "modern" && "border-t-8 border-[#11213B]", r.template === "compact" && "p-6 text-[10px]")} aria-label="Resume preview">
          <header className={r.template === "classic" ? "text-center" : ""}>
            <h1 className={cn("font-bold", r.template === "compact" ? "text-lg" : "text-2xl", r.template === "modern" && "text-[#11213B]")}>{r.name || "Your Name"}</h1>
            {r.headline && <p className="text-[12px]">{r.headline}</p>}
            <p className="text-gray-600">{[r.email, r.location].filter(Boolean).join(" · ")}</p>
          </header>
          {r.summary && <section className="mt-3"><h2 className={heading}>Summary</h2><p className="mt-1">{r.summary}</p></section>}
          {SECTIONS.map(([k, l]) => r[k].length > 0 && (
            <section key={k} className="mt-3"><h2 className={heading}>{l}</h2>
              {r[k].map((it, i) => (
                <div key={i} className="mt-1.5">
                  <div className="flex justify-between gap-2"><p><strong>{it.title}</strong>{it.org && <>, {it.org}</>}</p><p className="shrink-0 text-gray-600">{it.dates}</p></div>
                  {it.details && <ul className="ml-4 list-disc">{it.details.split("\n").filter(Boolean).map((d, j) => <li key={j}>{d.replace(/^[-•]\s*/, "")}</li>)}</ul>}
                </div>
              ))}
            </section>
          ))}
          {r.skills && <section className="mt-3"><h2 className={heading}>Skills</h2><p className="mt-1">{r.skills}</p></section>}
        </article>
      </div>
    </div>
  );
}
