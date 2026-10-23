import type { AidOffer } from "./types";

/** One-year breakdown of a financial aid offer. Gifts reduce cost; work-study and loans only cover it. */
export function aidBreakdown(o: Pick<AidOffer, "tuition" | "fees" | "housing" | "books" | "transportation" | "grants" | "scholarships" | "workStudy" | "loans">) {
  const cost = o.tuition + o.fees + o.housing + o.books + o.transportation;
  const gifts = o.grants + o.scholarships;
  const net = Math.max(0, cost - gifts);
  const gap = Math.max(0, net - o.workStudy - o.loans);
  return { cost, gifts, net, gap, debt: o.loans };
}
