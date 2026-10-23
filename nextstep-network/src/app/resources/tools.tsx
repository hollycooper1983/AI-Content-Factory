"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { checkScholarship, type ScamFinding } from "@/lib/scam-check";
import { gpa } from "@/lib/gpa";
import { money } from "@/lib/format";
import type { Course } from "@/lib/types";

const card = "card space-y-3 p-5";

export function ScamChecker() {
  const [url, setUrl] = useState("");
  const [desc, setDesc] = useState("");
  const [res, setRes] = useState<{ findings: ScamFinding[]; summary: string } | null>(null);
  return (
    <form className={card} onSubmit={(e) => { e.preventDefault(); setRes(checkScholarship(url, desc)); }}>
      <h3 className="font-semibold">Check a scholarship</h3>
      <p className="text-xs text-muted">A limited check of the link and description you paste. We don't visit the site, and no check can guarantee a scholarship is legitimate.</p>
      <div><label className="label" htmlFor="scam-url">Scholarship URL</label><input id="scam-url" className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" /></div>
      <div><label className="label" htmlFor="scam-desc">Paste the description or email (optional)</label><textarea id="scam-desc" className="input" rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
      <button className="btn-primary">Check</button>
      {res && (
        <div role="status" className="space-y-2 rounded-lg bg-canvas p-3 text-sm">
          <p className="font-semibold">{res.summary}</p>
          <ul className="space-y-1">{res.findings.map((f, i) => <li key={i} className={f.level === "warning" ? "text-red-600" : f.level === "caution" ? "text-amber-700 dark:text-amber-300" : "text-muted"}>{f.level === "warning" ? "⚠️" : f.level === "caution" ? "•" : "ℹ️"} {f.message}</li>)}</ul>
        </div>
      )}
    </form>
  );
}

export function GpaCalculator() {
  const [rows, setRows] = useState<Pick<Course, "grade" | "credit" | "level">[]>([{ grade: "A", credit: 1, level: "standard" }, { grade: "B+", credit: 1, level: "honors" }]);
  const g = gpa(rows);
  return (
    <div className={card}>
      <h3 className="font-semibold">GPA calculator</h3>
      {rows.map((r, i) => (
        <div key={i} className="flex gap-2">
          <select aria-label="Grade" className="input py-1.5" value={r.grade} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, grade: e.target.value } : x)))}>{["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"].map((x) => <option key={x}>{x}</option>)}</select>
          <select aria-label="Level" className="input py-1.5" value={r.level} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, level: e.target.value as Course["level"] } : x)))}><option value="standard">Standard</option><option value="honors">Honors</option><option value="ap">AP</option><option value="ib">IB</option><option value="dual_enrollment">Dual enrollment</option></select>
          <input aria-label="Credits" type="number" min={0} step={0.5} className="input w-20 py-1.5" value={r.credit} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, credit: Number(e.target.value) } : x)))} />
          <button type="button" aria-label="Remove" className="btn-ghost btn-sm" onClick={() => setRows(rows.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
      <button type="button" className="btn-ghost btn-sm" onClick={() => setRows([...rows, { grade: "A", credit: 1, level: "standard" }])}><Plus className="h-4 w-4" /> Add class</button>
      <p className="text-sm">Unweighted: <strong>{g.unweighted ?? "—"}</strong> · Weighted: <strong>{g.weighted ?? "—"}</strong></p>
      <p className="text-xs text-muted">Estimate on a 4.0 scale. Your school's official GPA may differ.</p>
    </div>
  );
}

export function BudgetCalculator() {
  const [v, setV] = useState({ income: 800, aid: 0, housing: 0, food: 250, transport: 120, books: 60, phone: 40, other: 100 });
  const inc = v.income + v.aid;
  const exp = v.housing + v.food + v.transport + v.books + v.phone + v.other;
  const f = (k: keyof typeof v, l: string) => <div key={k}><label className="label text-xs" htmlFor={`b-${k}`}>{l}</label><input id={`b-${k}`} type="number" min={0} className="input py-1.5" value={v[k]} onChange={(e) => setV({ ...v, [k]: Number(e.target.value) || 0 })} /></div>;
  return (
    <div className={card}>
      <h3 className="font-semibold">College budget calculator (monthly)</h3>
      <div className="grid grid-cols-2 gap-2">{f("income", "Job income")}{f("aid", "Aid refund / family help")}{f("housing", "Housing")}{f("food", "Food")}{f("transport", "Transportation")}{f("books", "Books & supplies")}{f("phone", "Phone & internet")}{f("other", "Other")}</div>
      <p className="text-sm">Income {money(inc)} − expenses {money(exp)} = <strong className={inc - exp < 0 ? "text-red-600" : "text-green-700"}>{money(inc - exp)}</strong> per month</p>
    </div>
  );
}

export function StudyPlanner() {
  const [items, setItems] = useState<{ t: string; day: string; done: boolean }[]>([]);
  const [t, setT] = useState("");
  const [day, setDay] = useState("Mon");
  useEffect(() => { try { setItems(JSON.parse(localStorage.getItem("ns-study") ?? "[]")); } catch {} }, []);
  const save = (n: typeof items) => { setItems(n); try { localStorage.setItem("ns-study", JSON.stringify(n)); } catch {} };
  return (
    <div className={card}>
      <h3 className="font-semibold">Weekly study planner</h3>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (t.trim()) { save([...items, { t: t.trim(), day, done: false }]); setT(""); } }}>
        <input aria-label="Study task" className="input py-1.5" value={t} onChange={(e) => setT(e.target.value)} placeholder="e.g. Review BIO 111 ch. 3" />
        <select aria-label="Day" className="input w-24 py-1.5" value={day} onChange={(e) => setDay(e.target.value)}>{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <option key={d}>{d}</option>)}</select>
        <button className="btn-secondary btn-sm">Add</button>
      </form>
      <ul className="space-y-1 text-sm">{items.map((x, i) => <li key={i} className="flex items-center gap-2"><input type="checkbox" checked={x.done} onChange={() => save(items.map((y, j) => (j === i ? { ...y, done: !y.done } : y)))} aria-label={`Done: ${x.t}`} /><span className="w-10 text-xs text-muted">{x.day}</span><span className={x.done ? "line-through text-muted" : ""}>{x.t}</span><button type="button" aria-label="Remove" className="ml-auto text-muted" onClick={() => save(items.filter((_, j) => j !== i))}>✕</button></li>)}</ul>
      <p className="text-xs text-muted">Saved in this browser only.</p>
    </div>
  );
}

export function GraduationCountdown() {
  const [date, setDate] = useState("2027-06-10");
  const days = Math.ceil((new Date(date + "T12:00:00").getTime() - Date.now()) / 864e5);
  return (
    <div className={card}>
      <h3 className="font-semibold">Graduation countdown</h3>
      <label htmlFor="grad" className="label text-xs">Graduation date</label>
      <input id="grad" type="date" className="input py-1.5" value={date} onChange={(e) => setDate(e.target.value)} />
      <p className="text-3xl font-extrabold text-brand">{Number.isFinite(days) ? (days >= 0 ? `${days} days` : "Congratulations, graduate! 🎓") : "—"}</p>
    </div>
  );
}
