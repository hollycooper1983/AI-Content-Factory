import type { Metadata } from "next";
import Link from "next/link";
import { img } from "@/lib/images";
import { SafeImage } from "@/components/client-ui";
import { Card, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "About", description: "NextStep Network is the student education and career network: connect, learn, apply, succeed." };

export default function About() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageHeader eyebrow="About NextStep Network" title="Connect. Learn. Apply. Succeed." subtitle="We're building the professional network students keep from high school through their first career — with safety, honesty and access at the center." />
      <SafeImage src={img("hero")} alt="Students collaborating" className="mb-8 aspect-[21/9] w-full rounded-2xl object-cover" />
      <div className="grid gap-4 md:grid-cols-3">
        {[["Our mission", "Help every student find, afford and succeed in their next step — college, career training or work — with one account that grows with them."],
          ["Our principles", "Accurate information with sources, official links instead of shortcuts, privacy by default for younger students, and no selling of student data."],
          ["Who it's for", "High school students, community college and university students, transfer and trade students, recent grads, families, counselors, mentors, colleges and employers."]].map(([t, b]) => (
          <Card key={t} className="p-5"><h2 className="font-semibold">{t}</h2><p className="mt-2 text-sm text-muted">{b}</p></Card>
        ))}
      </div>
      <Card className="mt-6 p-6 text-sm">
        <h2 className="font-semibold">What we don't do</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
          <li>We don't submit college applications or the FAFSA for you — we link to the official sites.</li>
          <li>We don't charge students for scholarship searches or official application links.</li>
          <li>We don't sell student data or make private student records searchable.</li>
          <li>We don't present unverified information as fact; every college and scholarship record shows its verification status.</li>
        </ul>
        <div className="mt-4 flex gap-2"><Link href="/signup" className="btn-primary">Join free</Link><Link href="/how-it-works" className="btn-secondary">How it works</Link></div>
      </Card>
    </div>
  );
}
