import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { CAREERS, WAGE_SOURCE } from "@/lib/data/careers";
import { money } from "@/lib/format";
import { Badge, Card, ExternalLink, Notice, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Career Explorer", description: "Explore careers: education, licensing, median pay and job outlook from the U.S. Bureau of Labor Statistics." };

export default function Careers({ searchParams }: { searchParams: { c?: string; compare?: string | string[]; cluster?: string } }) {
  const sel = CAREERS.find((c) => c.id === searchParams.c) ?? null;
  const cmpIds = (Array.isArray(searchParams.compare) ? searchParams.compare : (searchParams.compare ?? "").split(",")).filter(Boolean).slice(0, 4);
  const cmp = cmpIds.map((id) => CAREERS.find((c) => c.id === id)).filter(Boolean) as typeof CAREERS;
  const list = CAREERS.filter((c) => !searchParams.cluster || c.cluster === searchParams.cluster);
  const maxPay = Math.max(...CAREERS.map((c) => c.medianPay));
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <PageHeader eyebrow="Career Exploration & Salary Comparison" title="Explore careers" subtitle="Learn what each career requires, what it pays and where it's headed — then map your education path." action={<Link href="/career-planner" className="btn-secondary">Career tools & assessment</Link>} />
      <Notice tone="blue">Source: {WAGE_SOURCE}. Half of workers earn more than the median and half earn less. Pay varies by state and metro area — check <ExternalLink href="https://www.bls.gov/oes/">BLS state & metro wage data</ExternalLink> for your area and the linked OOH page for the latest figures.</Notice>

      {sel && (
        <Card className="mt-4 p-6" id="detail">
          <div className="flex flex-wrap items-start justify-between gap-2"><div><Badge tone="teal">{sel.cluster}</Badge><h2 className="mt-1 text-2xl font-bold">{sel.title}</h2></div><Link href="/careers" className="btn-ghost btn-sm">Close</Link></div>
          <p className="mt-2 text-sm">{sel.description}</p>
          <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
            <div><dt className="font-semibold">Required education</dt><dd className="text-muted">{sel.education}</dd></div>
            <div><dt className="font-semibold">Licensing</dt><dd className="text-muted">{sel.licensing}</dd></div>
            <div><dt className="font-semibold">Median pay (national, May 2023)</dt><dd className="text-muted">{money(sel.medianPay)} per year</dd></div>
            <div><dt className="font-semibold">Projected growth 2023–33</dt><dd className="text-muted">{sel.outlookPct}%</dd></div>
            <div><dt className="font-semibold">Common job titles</dt><dd className="text-muted">{sel.titles.join(", ")}</dd></div>
            <div><dt className="font-semibold">Work environments</dt><dd className="text-muted">{sel.environments}</dd></div>
            <div><dt className="font-semibold">Relevant degrees</dt><dd className="text-muted">{sel.degrees.join(", ")}</dd></div>
            <div><dt className="font-semibold">Approximate education costs</dt><dd className="text-muted">Depends on school and aid. Compare schools in the <Link href="/colleges" className="link">College Finder</Link> and offers in <Link href="/financial-aid" className="link">Financial Aid Comparison</Link>.</dd></div>
          </dl>
          {sel.caution && <div className="mt-4"><Notice tone="amber"><span className="flex gap-2"><AlertTriangle className="h-4 w-4 shrink-0" />{sel.caution}</span></Notice></div>}
          <h3 className="mt-6 font-semibold">Education-to-career roadmap</h3>
          <ol className="mt-3 flex flex-col gap-0 md:flex-row">
            {sel.roadmap.map((r, i) => (
              <li key={r} className="relative flex-1 pb-4 pl-8 md:pb-0 md:pl-0 md:pr-4 md:pt-8">
                <span className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">{i + 1}</span>
                {i < sel.roadmap.length - 1 && <span className="absolute left-3 top-6 h-full w-0.5 bg-brand/30 md:left-6 md:top-3 md:h-0.5 md:w-full" />}
                <p className="text-sm">{r}</p>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <ExternalLink href={sel.sourceUrl}>Read the full BLS profile</ExternalLink>
            <span className="text-muted">·</span><Link href={`/internships?q=${encodeURIComponent(sel.cluster)}`} className="link">Related internships</Link>
            <span className="text-muted">·</span><Link href={`/jobs?level=graduate`} className="link">Entry-level jobs</Link>
          </div>
        </Card>
      )}

      {cmp.length > 0 && (
        <Card className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead><tr className="border-b border-line"><th className="p-3 text-muted">Compare</th>{cmp.map((c) => <th key={c.id} className="p-3">{c.title}</th>)}</tr></thead>
            <tbody>
              {([["Median pay (2023)", (c) => money(c.medianPay)], ["Growth 2023–33", (c) => `${c.outlookPct}%`], ["Education", (c) => c.education], ["Licensing", (c) => c.licensing], ["Degrees", (c) => c.degrees.join(", ")], ["Environment", (c) => c.environments]] as [string, (c: (typeof CAREERS)[number]) => string][]).map(([k, f]) => (
                <tr key={k} className="border-b border-line align-top last:border-0"><th scope="row" className="p-3 font-medium text-muted">{k}</th>{cmp.map((c) => <td key={c.id} className="p-3">{f(c)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <form className="mt-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {["", "Healthcare", "Science", "Technology", "Engineering", "Business"].map((cl) => <Link key={cl} href={cl ? `/careers?cluster=${cl}` : "/careers"} className={`chip ${searchParams.cluster === cl || (!cl && !searchParams.cluster) ? "border-brand text-brand" : ""}`}>{cl || "All"}</Link>)}
          <button className="btn-secondary btn-sm ml-auto">Compare selected</button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between gap-2"><div><Badge tone="teal">{c.cluster}</Badge><Link href={`/careers?c=${c.id}#detail`} className="mt-1 block font-semibold hover:text-brand">{c.title}</Link></div>
                <label className="flex items-center gap-1 text-xs text-muted"><input type="checkbox" name="compare" value={c.id} defaultChecked={cmpIds.includes(c.id)} /> Compare</label></div>
              <p className="mt-2 text-sm text-muted line-clamp-2">{c.description}</p>
              <div className="mt-3"><p className="text-xs text-muted">Median pay</p><div className="mt-1 h-2 rounded-full bg-canvas"><div className="h-2 rounded-full bg-teal" style={{ width: `${(c.medianPay / maxPay) * 100}%` }} /></div><p className="mt-1 text-sm font-semibold">{money(c.medianPay)} · <span className="font-normal text-muted">+{c.outlookPct}% outlook</span></p></div>
            </Card>
          ))}
        </div>
      </form>
    </div>
  );
}
