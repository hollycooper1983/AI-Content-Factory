import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { label, money } from "@/lib/format";
import { Card, ExternalLink, Notice, PageHeader, VerificationBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Compare colleges" };

export default async function Compare({ searchParams }: { searchParams: { ids?: string | string[] } }) {
  const raw = Array.isArray(searchParams.ids) ? searchParams.ids : (searchParams.ids ?? "").split(",");
  const ids = [...new Set(raw.filter(Boolean))].slice(0, 4);
  const store = await db();
  const all = (await store.all("colleges", { publishStatus: "published" })).sort((a, b) => a.name.localeCompare(b.name));
  const cols = ids.map((id) => all.find((c) => c.id === id)).filter(Boolean) as typeof all;
  const rows: [string, (c: (typeof all)[number]) => React.ReactNode][] = [
    ["Location", (c) => `${c.city}, ${c.state}`],
    ["Type", (c) => label(c.type) + (c.hbcu ? " · HBCU" : "")],
    ["Degrees", (c) => c.degrees.join(", ")],
    ["Delivery format", (c) => [c.online && "Online", c.hybrid && "Hybrid", c.campus && "On campus"].filter(Boolean).join(", ")],
    ["In-state tuition", (c) => (c.tuitionInState != null ? money(c.tuitionInState) : "Not yet verified")],
    ["Out-of-state tuition", (c) => (c.tuitionOutState != null ? money(c.tuitionOutState) : "Not yet verified")],
    ["Application fee", (c) => (c.appFee != null ? money(c.appFee) : "Not yet verified")],
    ["Fee notes", (c) => c.freeAppNote || "—"],
    ["Admissions / testing", (c) => c.testPolicy],
    ["Transfer policy", (c) => (c.transferFriendly ? "Accepts transfers — confirm credit evaluation" : "Check with college")],
    ["Labs", (c) => c.labNote || "Confirm lab format with the program"],
    ["Financial aid", (c) => <ExternalLink href={c.financialAidUrl || c.website}>Aid info</ExternalLink>],
    ["Verification", (c) => <VerificationBadge v={c.verification} />],
    ["Official site", (c) => <ExternalLink href={c.admissionsUrl}>Admissions</ExternalLink>],
  ];
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <PageHeader eyebrow="College Comparison" title="Compare colleges side by side" subtitle="Pick up to four colleges. Estimated financial aid depends on your FAFSA and each school's offer — use the Financial Aid Comparison tool once you receive offers." />
      <form className="card mb-4 flex flex-wrap items-end gap-2 p-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="min-w-[200px] flex-1">
            <label className="label" htmlFor={`ids-${i}`}>College {i + 1}</label>
            <select id={`ids-${i}`} name="ids" defaultValue={ids[i] ?? ""} className="input"><option value="">—</option>{all.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          </div>
        ))}
        <button className="btn-primary">Compare</button>
      </form>
      {cols.length === 0 ? <Notice>Select colleges above, or choose “Compare” on the <Link className="link" href="/colleges">College Finder</Link>.</Notice> : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead><tr className="border-b border-line"><th className="w-44 p-3" scope="col"><span className="sr-only">Attribute</span></th>{cols.map((c) => <th key={c.id} scope="col" className="p-3"><Link href={`/colleges/${c.id}`} className="font-semibold hover:text-brand">{c.name}</Link></th>)}</tr></thead>
            <tbody>{rows.map(([k, f]) => <tr key={k} className="border-b border-line align-top last:border-0"><th scope="row" className="p-3 font-medium text-muted">{k}</th>{cols.map((c) => <td key={c.id} className="p-3">{f(c)}</td>)}</tr>)}</tbody>
          </table>
          <p className="p-3 text-xs text-muted">Sources: College Scorecard and official college websites. Records marked unverified are starter data — confirm before deciding.</p>
        </Card>
      )}
    </div>
  );
}
