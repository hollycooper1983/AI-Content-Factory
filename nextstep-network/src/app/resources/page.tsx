import type { Metadata } from "next";
import { BookOpen, Calculator, ShieldAlert, Wallet } from "lucide-react";
import { Card, ExternalLink, PageHeader } from "@/components/ui";
import { BudgetCalculator, GpaCalculator, GraduationCountdown, ScamChecker, StudyPlanner } from "./tools";

export const metadata: Metadata = { title: "Student Resources", description: "Official links, a scholarship scam checker, financial literacy lessons and free academic planning tools." };

const OFFICIAL = [
  ["StudentAid.gov — FAFSA & federal aid", "https://studentaid.gov/"], ["CFNC — North Carolina college planning", "https://www.cfnc.org/"],
  ["NC Residency Determination Service", "https://www.ncresidency.org/"], ["Common App", "https://www.commonapp.org/"],
  ["College Scorecard", "https://collegescorecard.ed.gov/"], ["BLS Occupational Outlook Handbook", "https://www.bls.gov/ooh/"],
  ["FTC: Scholarship & financial aid scams", "https://consumer.ftc.gov/articles/how-avoid-scholarship-and-financial-aid-scams"], ["988 Suicide & Crisis Lifeline", "https://988lifeline.org/"],
];

const LIT = [
  ["Budgeting", "List your monthly income and expenses. Cover needs first (housing, food, transportation, books), then savings, then wants. The 50/30/20 approach is a common starting point."],
  ["Grants", "Grants are gift aid you usually don't repay, often based on financial need (for example, the Federal Pell Grant). Filing the FAFSA is how you're considered."],
  ["Scholarships", "Scholarships are gift aid from schools, nonprofits and companies. Legitimate scholarships never charge you to apply."],
  ["Work-study", "Federal Work-Study lets eligible students earn money through part-time jobs. It's paid as you work — it's not subtracted from your bill up front."],
  ["Student loans", "Loans must be repaid with interest. Federal student loans generally offer fixed rates and income-driven repayment options; borrow only what you need. Learn more at StudentAid.gov."],
  ["Credit basics", "Your credit score reflects how reliably you repay debt. Pay bills on time, keep balances low, and be cautious with credit cards marketed to students."],
  ["Reading aid offers", "Separate gifts (grants, scholarships) from self-help (work-study, loans). Your real cost is the total cost of attendance minus gifts."],
];

export default function Resources() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6">
      <PageHeader eyebrow="Student Resources" title="Tools & resources" subtitle="Official links, safety tools, money basics and free planning calculators — all in one place." />
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><BookOpen className="h-5 w-5 text-brand" /> Official resources</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{OFFICIAL.map(([l, h]) => <Card key={h} className="p-3 text-sm"><ExternalLink href={h}>{l}</ExternalLink></Card>)}</div>
      </section>
      <section id="scam-checker" className="scroll-mt-20">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><ShieldAlert className="h-5 w-5 text-amber-500" /> Scholarship Scam Checker & Awareness Center</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <ScamChecker />
          <Card className="p-5 text-sm">
            <h3 className="font-semibold">Warning signs of a scholarship scam</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
              <li>You have to pay an application, processing or “release” fee.</li><li>It guarantees you'll win or get your money back.</li>
              <li>It asks for bank, credit card or Social Security numbers to “hold” an award.</li><li>You “won” something you never applied for.</li>
              <li>Pressure to act immediately, or only contact through text or social media.</li><li>A service charges to fill out the FAFSA (the FAFSA is free).</li>
            </ul>
            <p className="mt-3">If you suspect a scam, talk to your school counselor or financial aid office and report it to the <ExternalLink href="https://reportfraud.ftc.gov/">FTC</ExternalLink>.</p>
          </Card>
        </div>
      </section>
      <section id="financial-literacy" className="scroll-mt-20">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><Wallet className="h-5 w-5 text-teal" /> Financial Literacy Hub</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{LIT.map(([t, b]) => <Card key={t} className="p-4"><h3 className="font-semibold">{t}</h3><p className="mt-1 text-sm text-muted">{b}</p></Card>)}</div>
      </section>
      <section id="tools" className="scroll-mt-20">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><Calculator className="h-5 w-5 text-brand" /> Academic planning tools</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <GpaCalculator /><BudgetCalculator /><StudyPlanner /><GraduationCountdown />
        </div>
        <p className="mt-3 text-sm text-muted">Signed-in students also get the <a href="/applications/courses" className="link">Course & Credit Tracker</a>, <a href="/dashboard" className="link">College Readiness Checklist</a> and <a href="/transfer-planner" className="link">Transfer Planner</a>.</p>
      </section>
    </div>
  );
}
