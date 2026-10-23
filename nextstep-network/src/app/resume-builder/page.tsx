import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { ResumeBuilder, type Resume } from "./builder";

export const metadata: Metadata = { title: "Resume Builder" };

export default async function ResumePage() {
  const user = await requireUser();
  const store = await db();
  const [doc, p] = await Promise.all([store.find("user_docs", { userId: user.id, kind: "resume" }), store.find("profiles", { userId: user.id })]);
  const fmt = (e: { title: string; org?: string; start?: string; end?: string; description?: string }) => ({ title: e.title, org: e.org ?? "", dates: [e.start, e.end].filter(Boolean).join(" – "), details: e.description ?? "" });
  const fromProfile: Resume = {
    template: "classic", name: user.name, email: user.email, location: [p?.city, p?.state].filter(Boolean).join(", "), headline: p?.headline ?? "", summary: p?.about ?? "",
    education: (p?.education ?? []).map(fmt), experience: (p?.experience ?? []).map(fmt), volunteer: (p?.volunteer ?? []).map(fmt), projects: (p?.projects ?? []).map(fmt),
    awards: [...(p?.awards ?? []), ...(p?.activities ?? [])].map(fmt), certifications: (p?.certifications ?? []).map(fmt), skills: (p?.skills ?? []).join(", "),
  };
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="no-print"><PageHeader eyebrow="Resume & Career Development Center" title="Resume Builder" subtitle="Start from your profile, pick a template, then save or download a PDF. Only include real experience." /></div>
      <ResumeBuilder initial={(doc?.data as Resume | undefined) ?? fromProfile} fromProfile={fromProfile} hasSaved={!!doc} />
    </div>
  );
}
