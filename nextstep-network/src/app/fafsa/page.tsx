import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Circle, ExternalLink as Ext, ShieldAlert } from "lucide-react";
import { toggleFafsaStep } from "@/app/actions/planning";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { FAFSA_STEPS, fafsaPercent } from "@/lib/progress";
import { ActionButton } from "@/components/client-ui";
import { Card, ExternalLink, Notice, PageHeader, Progress, Ring } from "@/components/ui";
import { StepNote } from "./note";

export const metadata: Metadata = { title: "FAFSA Command Center" };

export default async function Fafsa() {
  const user = await requireUser();
  const store = await db();
  const p = await store.find("fafsa_progress", { userId: user.id });
  const pct = fafsaPercent(p);
  const next = FAFSA_STEPS.find((s) => !p?.steps[s.id]?.done);
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <PageHeader eyebrow="FAFSA & Financial Aid Command Center" title="Your FAFSA checklist" subtitle="Track your progress step by step. The FAFSA itself is free and is completed only at StudentAid.gov."
        action={<a href="https://studentaid.gov/h/apply-for-aid/fafsa" target="_blank" rel="noopener noreferrer" className="btn-primary">Go to the official FAFSA <Ext className="h-4 w-4" /></a>} />
      <div className="mb-4"><Notice tone="red" title="Protect your information">
        NextStep never asks for your Social Security number, StudentAid.gov (FSA ID) login, or tax information, and you shouldn't enter them here. Anyone charging a fee to “file your FAFSA” is not the official form.
      </Notice></div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card>
          <div className="flex items-center gap-4 border-b border-line p-4">
            <Ring value={pct} size={72} />
            <div className="flex-1"><p className="font-semibold">Award year {p?.awardYear ?? "2027–28"}</p><p className="text-sm text-muted">{next ? <>Next step: <strong className="text-fg">{next.label}</strong></> : "All steps complete — great work!"}</p><div className="mt-2"><Progress value={pct} tone="teal" /></div></div>
          </div>
          <ol className="divide-y divide-line">
            {FAFSA_STEPS.map((s, i) => {
              const st = p?.steps[s.id];
              return (
                <li key={s.id} className="flex gap-3 p-4">
                  <ActionButton className="mt-0.5 shrink-0" title={st?.done ? "Mark incomplete" : "Mark complete"} action={toggleFafsaStep.bind(null, s.id)}>
                    {st?.done ? <CheckCircle2 className="h-6 w-6 text-teal" /> : <Circle className="h-6 w-6 text-muted" />}
                    <span className="sr-only">{st?.done ? "Mark incomplete" : "Mark complete"}: {s.label}</span>
                  </ActionButton>
                  <div className="min-w-0 flex-1">
                    <p className={`font-medium ${st?.done ? "text-muted line-through" : ""}`}>{i + 1}. {s.label}</p>
                    {s.help && <p className="text-sm text-muted">{s.help}</p>}
                    <StepNote stepId={s.id} initial={st?.note ?? ""} />
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>
        <aside className="space-y-4">
          <Card className="p-4 text-sm">
            <h2 className="font-semibold">Official resources</h2>
            <ul className="mt-2 space-y-1.5">
              <li><ExternalLink href="https://studentaid.gov/">StudentAid.gov</ExternalLink></li>
              <li><ExternalLink href="https://studentaid.gov/h/apply-for-aid/fafsa">Start or continue the FAFSA</ExternalLink></li>
              <li><ExternalLink href="https://studentaid.gov/fsa-id/create-account/launch">Create a StudentAid.gov account</ExternalLink></li>
              <li><ExternalLink href="https://studentaid.gov/resources/aid-estimator">Federal Student Aid Estimator</ExternalLink></li>
              <li><ExternalLink href="https://www.cfnc.org/">CFNC (North Carolina)</ExternalLink></li>
            </ul>
          </Card>
          <Card className="p-4 text-sm">
            <h2 className="flex items-center gap-2 font-semibold"><ShieldAlert className="h-4 w-4 text-amber-500" /> Deadlines</h2>
            <p className="mt-1 text-muted">Federal, state and college FAFSA deadlines differ, and some state and school aid is first-come, first-served. Check the deadlines listed on StudentAid.gov and with each college's financial aid office, then add them to your <Link href="/calendar" className="link">calendar</Link>.</p>
          </Card>
          <Card className="p-4 text-sm">
            <h2 className="font-semibold">After you submit</h2>
            <p className="mt-1 text-muted">Compare offers from each school, including what's free money, what's earned and what's debt.</p>
            <Link href="/financial-aid" className="btn-secondary btn-sm mt-3">Financial Aid Comparison</Link>
          </Card>
        </aside>
      </div>
    </div>
  );
}
