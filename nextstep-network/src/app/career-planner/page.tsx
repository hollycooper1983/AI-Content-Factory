import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { CareerTools } from "./tools";

export const metadata: Metadata = { title: "Career Planner & Tools" };

export default async function CareerPlanner() {
  const user = await requireUser();
  const store = await db();
  const passport = await store.find("user_docs", { userId: user.id, kind: "passport" });
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <PageHeader eyebrow="Resume & Career Development Center" title="Career planner & tools" subtitle="Interest assessment, skills inventory, cover letters, interview practice and more. AI suggestions improve your own words — they never invent qualifications." />
      <CareerTools initial={(passport?.data ?? {}) as Record<string, unknown>} />
    </div>
  );
}
