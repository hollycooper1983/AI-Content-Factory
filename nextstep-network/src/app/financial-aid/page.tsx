import type { Metadata } from "next";
import Link from "next/link";
import { deleteAidOffer } from "@/app/actions/planning";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { aidBreakdown } from "@/lib/aid";
import { ActionButton } from "@/components/client-ui";
import { Card, EmptyState, Notice, PageHeader } from "@/components/ui";
import { OfferForm } from "./form";

export const metadata: Metadata = { title: "Financial Aid Comparison" };

export default async function FinancialAid() {
  const user = await requireUser();
  const store = await db();
  const offers = await store.all("aid_offers", { userId: user.id });
  const rows = offers.map((o) => ({ o, b: aidBreakdown(o) }));
  const max = Math.max(1, ...rows.map((r) => r.b.cost));
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <PageHeader eyebrow="Financial Aid Command Center" title="Compare financial aid offers" subtitle="Enter each school's offer to see what's free money, what you'd earn, what you'd borrow, and your estimated remaining cost for one year." action={<Link href="/fafsa" className="btn-ghost">FAFSA checklist</Link>} />
      <Notice tone="blue" title="How to read an offer">
        <strong>Gifts</strong> (grants and scholarships) don't need to be repaid. <strong>Work-study</strong> is money you earn by working, paid over time, and isn't guaranteed. <strong>Loans</strong> are debt you repay with interest. Remaining cost = total cost − gifts. Figures are your own estimates for one academic year.
      </Notice>
      {rows.length > 0 && (
        <Card className="mt-4 p-5">
          <h2 className="font-semibold">Estimated annual cost & funding gap</h2>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-teal" />Gifts</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-brand" />Work-study</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-amber-500" />Loans</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-red-400" />Remaining gap</span>
          </div>
          <div className="mt-4 space-y-4" role="list">
            {rows.map(({ o, b }) => (
              <div key={o.id} role="listitem">
                <div className="flex justify-between text-sm"><span className="font-medium">{o.collegeName}</span><span className="text-muted">Total cost {money(b.cost)}</span></div>
                <div className="mt-1 flex h-6 overflow-hidden rounded-md bg-canvas" style={{ width: `${(b.cost / max) * 100}%` }} aria-label={`${o.collegeName}: gifts ${money(b.gifts)}, work-study ${money(o.workStudy)}, loans ${money(o.loans)}, gap ${money(b.gap)}`}>
                  {[[b.gifts, "bg-teal"], [Math.min(o.workStudy, b.cost - b.gifts), "bg-brand"], [Math.min(o.loans, Math.max(0, b.cost - b.gifts - o.workStudy)), "bg-amber-500"], [b.gap, "bg-red-400"]].map(([v, c], i) => (
                    <div key={i} className={c as string} style={{ width: `${((v as number) / Math.max(1, b.cost)) * 100}%` }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      <Card className="mt-4 overflow-x-auto">
        {rows.length === 0 ? <EmptyState title="No offers yet" body="Add an offer below when you receive one from a school." /> : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead><tr className="border-b border-line"><th className="p-3 text-muted">Per year</th>{rows.map(({ o }) => <th key={o.id} className="p-3">{o.collegeName}</th>)}</tr></thead>
            <tbody>
              {[
                ["Tuition", (o: typeof offers[number]) => money(o.tuition)], ["Fees", (o: typeof offers[number]) => money(o.fees)], ["Housing (estimate)", (o: typeof offers[number]) => money(o.housing)],
                ["Books & materials", (o: typeof offers[number]) => money(o.books)], ["Transportation", (o: typeof offers[number]) => money(o.transportation)],
              ].map(([k, f]) => <tr key={k as string} className="border-b border-line"><th scope="row" className="p-3 font-normal text-muted">{k as string}</th>{rows.map(({ o }) => <td key={o.id} className="p-3">{(f as (x: typeof o) => string)(o)}</td>)}</tr>)}
              <tr className="border-b border-line bg-canvas font-semibold"><th scope="row" className="p-3">Total estimated cost</th>{rows.map(({ o, b }) => <td key={o.id} className="p-3">{money(b.cost)}</td>)}</tr>
              <tr className="border-b border-line"><th scope="row" className="p-3 font-normal text-teal-700 dark:text-teal">Grants (gift)</th>{rows.map(({ o }) => <td key={o.id} className="p-3">{money(o.grants)}</td>)}</tr>
              <tr className="border-b border-line"><th scope="row" className="p-3 font-normal text-teal-700 dark:text-teal">Scholarships (gift)</th>{rows.map(({ o }) => <td key={o.id} className="p-3">{money(o.scholarships)}</td>)}</tr>
              <tr className="border-b border-line"><th scope="row" className="p-3 font-normal text-brand">Work-study (earned)</th>{rows.map(({ o }) => <td key={o.id} className="p-3">{money(o.workStudy)}</td>)}</tr>
              <tr className="border-b border-line"><th scope="row" className="p-3 font-normal text-amber-600">Federal loans (debt)</th>{rows.map(({ o }) => <td key={o.id} className="p-3">{money(o.loans)}</td>)}</tr>
              <tr className="border-b border-line bg-canvas font-semibold"><th scope="row" className="p-3">Remaining cost after gifts</th>{rows.map(({ o, b }) => <td key={o.id} className="p-3">{money(b.net)}</td>)}</tr>
              <tr className="font-semibold"><th scope="row" className="p-3 text-red-600">Gap after all aid (incl. loans)</th>{rows.map(({ o, b }) => <td key={o.id} className="p-3 text-red-600">{money(b.gap)}</td>)}</tr>
              <tr><td className="p-3" />{rows.map(({ o }) => <td key={o.id} className="p-3"><ActionButton className="btn-ghost btn-sm text-red-600" confirm="Delete this offer?" action={deleteAidOffer.bind(null, o.id)}>Delete</ActionButton></td>)}</tr>
            </tbody>
          </table>
        )}
      </Card>
      <OfferForm />
    </div>
  );
}
