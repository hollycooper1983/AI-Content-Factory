import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Notice, PageHeader } from "@/components/ui";
import { TransferPlanner, type Plan } from "./planner";

export const metadata: Metadata = { title: "Transfer Planner" };

export default async function TransferPage() {
  const user = await requireUser();
  const store = await db();
  const [doc, colleges] = await Promise.all([store.find("user_docs", { userId: user.id, kind: "transfer_plan" }), store.all("colleges", { publishStatus: "published" })]);
  const cc = colleges.filter((c) => c.type === "community").map((c) => ({ id: c.id, name: c.name }));
  const unis = colleges.filter((c) => c.type !== "community").map((c) => ({ id: c.id, name: c.name, url: c.admissionsUrl, online: c.online, labNote: c.labNote ?? "" }));
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <PageHeader eyebrow="Community College Transfer Planner" title="Plan your transfer" subtitle="Map your path from an associate degree to a bachelor's: courses, credits, labs and costs, semester by semester." />
      <div className="mb-4"><Notice tone="amber" title="Always confirm with an advisor">This plan is a planning aid, not an official degree audit. Course transferability and major requirements must be confirmed with your community college advisor and each university's transfer admissions office. Courses stay marked <strong>Unverified</strong> until you confirm them.</Notice></div>
      <TransferPlanner initial={(doc?.data as Plan | undefined) ?? null} communityColleges={cc} universities={unis} />
    </div>
  );
}
