import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "How it works" };

const STEPS = [
  ["Create your profile", "Add a headline, interests, skills, projects and activities. Students under 18 start private."],
  ["Build your network", "Connect with classmates, join moderated groups, and follow colleges and verified employers."],
  ["Explore options", "Search colleges, scholarships, careers and internships — every listing shows its source and verification."],
  ["Organize everything", "Track applications, FAFSA steps, scholarships and deadlines in your Student Command Center."],
  ["Apply officially", "Use official links (CFNC, Common App, StudentAid.gov, sponsor sites) to apply. We help you stay organized."],
  ["Keep growing", "Use the resume builder, transfer planner and AI Advisor as you move from high school to college to career."],
];

export default function HowItWorks() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageHeader eyebrow="How it works" title="Your next step, one step at a time" />
      <ol className="grid gap-4 md:grid-cols-2">
        {STEPS.map(([t, b], i) => (
          <Card key={t} as="div" className="flex gap-4 p-5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand font-bold text-white">{i + 1}</span><div><h2 className="font-semibold">{t}</h2><p className="mt-1 text-sm text-muted">{b}</p></div></Card>
        ))}
      </ol>
      <Card className="mt-6 p-6 text-sm">
        <h2 className="font-semibold">For families, counselors, colleges and employers</h2>
        <p className="mt-1 text-muted">Parents see a read-only checklist when their student invites them. Counselors and mentors are verified before students under 18 can connect. Colleges and employers get official pages and can post opportunities after verification; every listing is reviewed before it goes live.</p>
        <Link href="/signup" className="btn-primary mt-4">Get started</Link>
      </Card>
    </div>
  );
}
