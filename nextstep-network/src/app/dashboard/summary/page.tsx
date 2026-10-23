import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { studentSummary } from "@/lib/dashboard";
import { formatDate, label } from "@/lib/format";
import { FAFSA_STEPS } from "@/lib/progress";
import { PrintButton } from "@/components/print-button";

export const metadata: Metadata = { title: "Planning summary" };

export default async function Summary() {
  const user = await requireUser();
  const s = await studentSummary(user.id);
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="no-print mb-4 flex items-center justify-between">
        <p className="text-sm text-muted">Use your browser's print dialog and choose “Save as PDF” to download.</p>
        <PrintButton />
      </div>
      <article className="card print-area space-y-6 p-8 text-sm">
        <header>
          <h1 className="text-2xl font-bold">College & Career Planning Summary</h1>
          <p className="text-muted">{user.name} · {s.profile?.school} {s.profile?.gradYear ? `· Class of ${s.profile.gradYear}` : ""} · Generated {formatDate(new Date().toISOString())}</p>
        </header>
        <section><h2 className="mb-2 font-semibold">Readiness checklist ({s.readiness.score}% of tasks complete)</h2><ul>{s.readiness.items.map((i) => <li key={i.label}>{i.done ? "☑" : "☐"} {i.label}</li>)}</ul></section>
        <section><h2 className="mb-2 font-semibold">Colleges</h2>
          <table className="w-full text-left"><thead><tr className="border-b border-line"><th className="py-1">College</th><th>Status</th><th>Deadline</th><th>Checklist</th></tr></thead>
            <tbody>{s.apps.map((a) => <tr key={a.id} className="border-b border-line"><td className="py-1">{a.college?.name}</td><td>{label(a.status)}</td><td>{formatDate(a.deadline)}</td><td>{a.pct}%</td></tr>)}</tbody></table>
        </section>
        <section><h2 className="mb-2 font-semibold">FAFSA ({s.fPct}%)</h2><ul className="columns-2">{FAFSA_STEPS.map((st) => <li key={st.id}>{s.fafsa?.steps[st.id]?.done ? "☑" : "☐"} {st.label}</li>)}</ul></section>
        <section><h2 className="mb-2 font-semibold">Scholarships</h2><ul>{s.schApps.map((x) => <li key={x.id}>{x.scholarship?.name} — {label(x.status)}</li>)}</ul></section>
        <section><h2 className="mb-2 font-semibold">Upcoming deadlines</h2><ul>{s.upcoming.map((t) => <li key={t.id}>{formatDate(t.date)} — {t.title}</li>)}</ul></section>
        <footer className="text-xs text-muted">Confirm all deadlines and requirements with each college, StudentAid.gov and scholarship sponsor. NextStep Network does not submit applications.</footer>
      </article>
    </div>
  );
}
